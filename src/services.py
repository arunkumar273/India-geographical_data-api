from sqlalchemy import select

from src.database import engine
from src.models import State,District, SubDistrict,Village


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
            select(Village)
            .where(
                Village.village_name.ilike(f"%{query}%")
            )
            .order_by(Village.village_name)
            .limit(limit)
        )

        return result.mappings().all()       
    

      