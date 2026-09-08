from sqlalchemy import select,func
import hashlib
import secrets
from datetime import datetime, timezone
from src.database import engine
from src.models import State,District, SubDistrict,Village,ApiKey


def get_states():
    with engine.connect() as connection:
        result = connection.execute(
            select(State).order_by(State.state_name)
        )

        return result.mappings().all()
    
def get_districts_by_state(
    state_id: int,
    limit: int = 20,
    offset: int = 0
):
    with engine.connect() as connection:

        # Check if state exists
        state = connection.execute(
            select(State).where(State.id == state_id)
        ).first()

        if state is None:
            return None

        # Total districts for this state
        total = connection.execute(
            select(func.count(District.id))
            .where(District.state_id == state_id)
        ).scalar_one()

        # Paginated districts
        result = connection.execute(
            select(District)
            .where(District.state_id == state_id)
            .order_by(District.district_name)
            .limit(limit)
            .offset(offset)
        )

        return {
            "data": result.mappings().all(),
            "total": total
        }

def get_subdistricts_by_district(
    district_id: int,
    limit: int = 20,
    offset: int = 0
):
    with engine.connect() as connection:

        # Check if district exists
        district = connection.execute(
            select(District).where(District.id == district_id)
        ).first()

        if district is None:
            return None

        # Total sub-districts for this district
        total = connection.execute(
            select(func.count(SubDistrict.id))
            .where(SubDistrict.district_id == district_id)
        ).scalar_one()

        # Paginated sub-districts
        result = connection.execute(
            select(SubDistrict)
            .where(SubDistrict.district_id == district_id)
            .order_by(SubDistrict.sub_district_name)
            .limit(limit)
            .offset(offset)
        )

        return {
            "data": result.mappings().all(),
            "total": total
        }

    
def get_villages_by_subdistrict(
    sub_district_id: int,
    limit: int = 20,
    offset: int = 0
):
    with engine.connect() as connection:

        # Check if sub-district exists
        subdistrict = connection.execute(
            select(SubDistrict)
            .where(SubDistrict.id == sub_district_id)
        ).first()

        if subdistrict is None:
            return None

        # Total villages for this sub-district
        total = connection.execute(
            select(func.count(Village.id))
            .where(Village.sub_district_id == sub_district_id)
        ).scalar_one()

        # Paginated villages
        result = connection.execute(
            select(Village)
            .where(Village.sub_district_id == sub_district_id)
            .order_by(Village.village_name)
            .limit(limit)
            .offset(offset)
        )

        return {
            "data": result.mappings().all(),
            "total": total
        }
      
def search_villages(
    query: str,
    limit: int = 20,
    offset: int = 0
):
    with engine.connect() as connection:

        # Get total number of matching villages
        total = connection.execute(
            select(func.count(Village.id))
            .where(
                Village.village_name.ilike(f"%{query}%")
            )
        ).scalar_one()

        # Get paginated village results
        result = connection.execute(
            select(
                Village.id,
                Village.village_code,
                Village.village_name,
                Village.sub_district_id,
                SubDistrict.sub_district_name.label("sub_district"),
                District.district_name.label("district"),
                State.state_name.label("state")
            )
            .join(
                SubDistrict,
                Village.sub_district_id == SubDistrict.id
            )
            .join(
                District,
                SubDistrict.district_id == District.id
            )
            .join(
                State,
                District.state_id == State.id
            )
            .where(
                Village.village_name.ilike(f"%{query}%")
            )
            .order_by(Village.village_name)
            .limit(limit)
            .offset(offset)
        )

        return {
            "data": result.mappings().all(),
            "total": total
        }

def create_api_key(name: str):

    raw_key = "vg_" + secrets.token_urlsafe(32)

    key_hash = hashlib.sha256(
        raw_key.encode()
    ).hexdigest()

    with engine.begin() as connection:

        result = connection.execute(
            ApiKey.__table__.insert().values(
                key_hash=key_hash,
                name=name,
                is_active=True
            )
        )

        api_key_id = result.inserted_primary_key[0]

    return {
        "id": api_key_id,
        "name": name,
        "api_key": raw_key
    }       
    
def verify_api_key(raw_key: str):

    key_hash = hashlib.sha256(
        raw_key.encode()
    ).hexdigest()

    with engine.connect() as connection:

        result = connection.execute(
            select(
                ApiKey.id,
                ApiKey.is_active,
                ApiKey.expires_at
            )
            .where(
                ApiKey.key_hash == key_hash
            )
        ).first()

        if result is None:
            return False

        if not result.is_active:
            return False

        if (
            result.expires_at is not None
            and result.expires_at <= datetime.now(timezone.utc).replace(tzinfo=None)
        ):
            return False

        return True