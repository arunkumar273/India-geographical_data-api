
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set in the .env file."
    )


# Connect to Neon
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


print("=" * 60)
print("DATABASE RECORD COUNTS")
print("=" * 60)

with engine.connect() as connection:

    tables = [
        "states",
        "districts",
        "sub_districts",
        "villages"
    ]

    for table in tables:

        result = connection.execute(
            text(
                f"SELECT COUNT(*) FROM {table}"
            )
        )

        count = result.scalar()

        print(
            f"{table:<20} {count:,}"
        )

print("=" * 60)

