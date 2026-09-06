from sqlalchemy import select
import hashlib
import secrets
from src.database import engine
from src.models import State,District, SubDistrict,Village,ApiKey


def get_states():
    with engine.connect() as connection:
        result = connection.execute(
            select(State).order_by(State.state_name)
        )

        return result.mappings().all()
    
def get_districts_by_state(state_id: int):
    with engine.connect() as connection:

        state = connection.execute(
            select(State).where(State.id == state_id)
        ).first()

        if state is None:
            return None

        result = connection.execute(
            select(District)
            .where(District.state_id == state_id)
            .order_by(District.district_name)
        )

        return result.mappings().all()  

def get_subdistricts_by_district(district_id: int):
    with engine.connect() as connection:

        district = connection.execute(
            select(District).where(District.id == district_id)
        ).first()

        if district is None:
            return None

        result = connection.execute(
            select(SubDistrict)
            .where(SubDistrict.district_id == district_id)
            .order_by(SubDistrict.sub_district_name)
        )

        return result.mappings().all()

    
def get_villages_by_subdistrict(sub_district_id: int):
    with engine.connect() as connection:

        subdistrict = connection.execute(
            select(SubDistrict).where(SubDistrict.id == sub_district_id)
        ).first()

        if subdistrict is None:
            return None

        result = connection.execute(
            select(Village)
            .where(Village.sub_district_id == sub_district_id)
            .order_by(Village.village_name)
        )

        return result.mappings().all()  
      
def search_villages(query: str, limit: int = 20):
    with engine.connect() as connection:

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
        )

        return result.mappings().all()   

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
            select(ApiKey)
            .where(
                ApiKey.key_hash == key_hash,
                ApiKey.is_active == True
            )
        ).first()

        if result is None:
            return False

        return True
      