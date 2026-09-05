from sqlalchemy import select

from src.database import engine
from src.models import State, District, SubDistrict, Village


def main():
    with engine.connect() as connection:

        state_count = connection.execute(
            select(State)
        ).fetchall()

        district_count = connection.execute(
            select(District)
        ).fetchall()

        subdistrict_count = connection.execute(
            select(SubDistrict)
        ).fetchall()

        village_count = connection.execute(
            select(Village)
        ).fetchall()

        print("MODEL DATABASE TEST")
        print("=" * 40)
        print(f"States: {len(state_count):,}")
        print(f"Districts: {len(district_count):,}")
        print(f"Sub-districts: {len(subdistrict_count):,}")
        print(f"Villages: {len(village_count):,}")
        print("=" * 40)


if __name__ == "__main__":
    main()