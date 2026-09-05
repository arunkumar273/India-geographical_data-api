import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

engine = create_engine(DATABASE_URL)

schema = """
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    state_code VARCHAR(2) NOT NULL UNIQUE,
    state_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    district_code VARCHAR(3) NOT NULL,
    district_name VARCHAR(150) NOT NULL,
    state_id INTEGER NOT NULL REFERENCES states(id),
    UNIQUE (state_id, district_code)
);

CREATE TABLE IF NOT EXISTS sub_districts (
    id SERIAL PRIMARY KEY,
    sub_district_code VARCHAR(5) NOT NULL,
    sub_district_name VARCHAR(150) NOT NULL,
    district_id INTEGER NOT NULL REFERENCES districts(id),
    UNIQUE (district_id, sub_district_code)
);

CREATE TABLE IF NOT EXISTS villages (
    id BIGSERIAL PRIMARY KEY,
    village_code VARCHAR(6) NOT NULL,
    village_name VARCHAR(200) NOT NULL,
    sub_district_id INTEGER NOT NULL REFERENCES sub_districts(id),
    UNIQUE (sub_district_id, village_code)
);

CREATE INDEX IF NOT EXISTS idx_districts_state_id
ON districts(state_id);

CREATE INDEX IF NOT EXISTS idx_sub_districts_district_id
ON sub_districts(district_id);

CREATE INDEX IF NOT EXISTS idx_villages_sub_district_id
ON villages(sub_district_id);

CREATE INDEX IF NOT EXISTS idx_villages_name
ON villages(village_name);
"""

try:
    with engine.begin() as connection:
        connection.execute(text(schema))

    print("Database schema created successfully!")

except Exception as e:
    print("Schema creation failed:")
    print(e)