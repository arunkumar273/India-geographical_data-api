import os
from pathlib import Path
from io import StringIO

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

DATA_DIR = Path("data/unclean")

# TEST WITH ONE FILE FIRST
TEST_FILE = "Rdir_2011_28_ANDHRA_PRADESH.xls"

EXPECTED_COLUMNS = [
    "MDDS STC",
    "STATE NAME",
    "MDDS DTC",
    "DISTRICT NAME",
    "MDDS Sub_DT",
    "SUB-DISTRICT NAME",
    "MDDS PLCN",
    "Area Name",
]

# Smaller batches reduce the chance of Neon closing the connection.
BATCH_SIZE = 500


# ============================================================
# DATABASE ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)


# ============================================================
# READ DATASET
# ============================================================

def read_dataset(file_path):

    print()
    print("=" * 60)
    print(f"Reading: {file_path.name}")
    print("=" * 60)

    excel = pd.ExcelFile(file_path)

    print("Available sheets:")

    for sheet in excel.sheet_names:
        print(f"  - {sheet}")

    selected_sheet = None

    # Automatically find Village Directory
    for sheet in excel.sheet_names:

        temp_df = pd.read_excel(
            file_path,
            sheet_name=sheet,
            dtype=str
        )

        temp_df.columns = [
            str(column).strip()
            for column in temp_df.columns
        ]

        if all(
            column in temp_df.columns
            for column in EXPECTED_COLUMNS
        ):
            selected_sheet = sheet
            break

    if selected_sheet is None:
        raise ValueError(
            f"No valid Village Directory sheet found in "
            f"{file_path.name}"
        )

    print(f"Using sheet: {selected_sheet}")

    df = pd.read_excel(
        file_path,
        sheet_name=selected_sheet,
        dtype=str
    )

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    # Clean values while preserving codes as strings
    for column in EXPECTED_COLUMNS:

        df[column] = (
            df[column]
            .fillna("")
            .astype(str)
            .str.strip()
        )

    print(f"Rows loaded: {len(df):,}")

    return df


# ============================================================
# PREPARE DATA
# ============================================================

def prepare_data(df):

    print()
    print("Preparing data...")

    # --------------------------------------------------------
    # STATES
    # --------------------------------------------------------

    states_df = (
        df[
            [
                "MDDS STC",
                "STATE NAME"
            ]
        ]
        .drop_duplicates()
        .rename(
            columns={
                "MDDS STC": "state_code",
                "STATE NAME": "state_name",
            }
        )
    )

    states_df = states_df[
        (states_df["state_code"] != "") &
        (states_df["state_name"] != "")
    ]

    print(
        f"Unique states: {len(states_df):,}"
    )

    # --------------------------------------------------------
    # DISTRICTS
    # --------------------------------------------------------

    districts_df = (
        df[
            [
                "MDDS STC",
                "MDDS DTC",
                "DISTRICT NAME",
            ]
        ]
        .drop_duplicates()
    )

    districts_df = districts_df[
        (districts_df["MDDS STC"] != "") &
        (districts_df["MDDS DTC"] != "") &
        (districts_df["DISTRICT NAME"] != "") &
        (districts_df["MDDS DTC"] != "000")
    ]

    print(
        f"Unique districts: {len(districts_df):,}"
    )

    # --------------------------------------------------------
    # SUB-DISTRICTS
    # --------------------------------------------------------

    subdistricts_df = (
        df[
            [
                "MDDS STC",
                "MDDS DTC",
                "MDDS Sub_DT",
                "SUB-DISTRICT NAME",
            ]
        ]
        .drop_duplicates()
    )

    subdistricts_df = subdistricts_df[
        (subdistricts_df["MDDS STC"] != "") &
        (subdistricts_df["MDDS DTC"] != "") &
        (subdistricts_df["MDDS Sub_DT"] != "") &
        (subdistricts_df["SUB-DISTRICT NAME"] != "") &
        (subdistricts_df["MDDS DTC"] != "000") &
        (subdistricts_df["MDDS Sub_DT"] != "00000")
    ]

    print(
        f"Unique sub-districts: "
        f"{len(subdistricts_df):,}"
    )

    # --------------------------------------------------------
    # VILLAGES
    # --------------------------------------------------------

    villages_df = df[
        [
            "MDDS STC",
            "MDDS DTC",
            "MDDS Sub_DT",
            "MDDS PLCN",
            "Area Name",
        ]
    ].copy()

    villages_df = villages_df[
        (villages_df["MDDS STC"] != "") &
        (villages_df["MDDS DTC"] != "") &
        (villages_df["MDDS Sub_DT"] != "") &
        (villages_df["MDDS PLCN"] != "") &
        (villages_df["Area Name"] != "") &
        (villages_df["MDDS DTC"] != "000") &
        (villages_df["MDDS Sub_DT"] != "00000") &
        (villages_df["MDDS PLCN"] != "000000")
    ]

    villages_df = villages_df.drop_duplicates(
        subset=[
            "MDDS STC",
            "MDDS DTC",
            "MDDS Sub_DT",
            "MDDS PLCN",
        ]
    )

    print(
        f"Unique villages: {len(villages_df):,}"
    )

    return (
        states_df,
        districts_df,
        subdistricts_df,
        villages_df,
    )


# ============================================================
# IMPORT STATES
# ============================================================

def import_states(states_df):

    print()
    print("Connecting to Neon...")
    print("Importing states...")

    with engine.begin() as connection:

        records = states_df.to_dict("records")

        if records:

            connection.execute(
                text("""
                    INSERT INTO states
                    (
                        state_code,
                        state_name
                    )
                    VALUES
                    (
                        :state_code,
                        :state_name
                    )
                    ON CONFLICT (state_code)
                    DO UPDATE SET
                        state_name =
                        EXCLUDED.state_name
                """),
                records
            )

    print(
        f"State records processed: "
        f"{len(states_df):,}"
    )


# ============================================================
# LOAD STATE IDS
# ============================================================

def load_state_map():

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT
                    id,
                    state_code
                FROM states
            """)
        )

        return {
            row.state_code: row.id
            for row in result
        }


# ============================================================
# IMPORT DISTRICTS
# ============================================================

def import_districts(
    districts_df,
    state_map
):

    print("Importing districts...")

    district_records = []

    for _, row in districts_df.iterrows():

        state_id = state_map.get(
            row["MDDS STC"]
        )

        if state_id is None:
            continue

        district_records.append(
            {
                "district_code":
                    row["MDDS DTC"],

                "district_name":
                    row["DISTRICT NAME"],

                "state_id":
                    state_id,
            }
        )

    with engine.begin() as connection:

        if district_records:

            connection.execute(
                text("""
                    INSERT INTO districts
                    (
                        district_code,
                        district_name,
                        state_id
                    )
                    VALUES
                    (
                        :district_code,
                        :district_name,
                        :state_id
                    )
                    ON CONFLICT
                    (
                        state_id,
                        district_code
                    )
                    DO UPDATE SET
                        district_name =
                        EXCLUDED.district_name
                """),
                district_records
            )

    print(
        f"District records processed: "
        f"{len(district_records):,}"
    )


# ============================================================
# LOAD DISTRICT IDS
# ============================================================

def load_district_map():

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT
                    id,
                    district_code,
                    state_id
                FROM districts
            """)
        )

        return {
            (
                row.state_id,
                row.district_code
            ): row.id

            for row in result
        }


# ============================================================
# IMPORT SUB-DISTRICTS
# ============================================================

def import_subdistricts(
    subdistricts_df,
    state_map,
    district_map
):

    print("Importing sub-districts...")

    subdistrict_records = []

    for _, row in subdistricts_df.iterrows():

        state_id = state_map.get(
            row["MDDS STC"]
        )

        if state_id is None:
            continue

        district_id = district_map.get(
            (
                state_id,
                row["MDDS DTC"]
            )
        )

        if district_id is None:
            continue

        subdistrict_records.append(
            {
                "sub_district_code":
                    row["MDDS Sub_DT"],

                "sub_district_name":
                    row["SUB-DISTRICT NAME"],

                "district_id":
                    district_id,
            }
        )

    with engine.begin() as connection:

        if subdistrict_records:

            connection.execute(
                text("""
                    INSERT INTO sub_districts
                    (
                        sub_district_code,
                        sub_district_name,
                        district_id
                    )
                    VALUES
                    (
                        :sub_district_code,
                        :sub_district_name,
                        :district_id
                    )
                    ON CONFLICT
                    (
                        district_id,
                        sub_district_code
                    )
                    DO UPDATE SET
                        sub_district_name =
                        EXCLUDED.sub_district_name
                """),
                subdistrict_records
            )

    print(
        f"Sub-district records processed: "
        f"{len(subdistrict_records):,}"
    )


# ============================================================
# LOAD SUB-DISTRICT IDS
# ============================================================

def load_subdistrict_map():

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT
                    id,
                    sub_district_code,
                    district_id
                FROM sub_districts
            """)
        )

        return {
            (
                row.district_id,
                row.sub_district_code
            ): row.id

            for row in result
        }


# ============================================================
# PREPARE VILLAGES
# ============================================================

def prepare_villages(
    villages_df,
    state_map,
    district_map,
    subdistrict_map
):

    print("Preparing villages...")

    village_records = []

    for _, row in villages_df.iterrows():

        state_id = state_map.get(
            row["MDDS STC"]
        )

        if state_id is None:
            continue

        district_id = district_map.get(
            (
                state_id,
                row["MDDS DTC"]
            )
        )

        if district_id is None:
            continue

        subdistrict_id = subdistrict_map.get(
            (
                district_id,
                row["MDDS Sub_DT"]
            )
        )

        if subdistrict_id is None:
            continue

        village_records.append(
            {
                "village_code":
                    row["MDDS PLCN"],

                "village_name":
                    row["Area Name"],

                "sub_district_id":
                    subdistrict_id,
            }
        )

    print(
        f"Villages prepared: "
        f"{len(village_records):,}"
    )

    return village_records


# ============================================================
# INSERT VILLAGES WITH SMALL TRANSACTIONS
# ============================================================



def import_villages(village_records):

    total = len(village_records)

    print()
    print(
        f"Starting village bulk import "
        f"({total:,} records)..."
    )

    # --------------------------------------------------------
    # Use one database connection
    # --------------------------------------------------------

    with engine.raw_connection() as raw_connection:

        try:

            cursor = raw_connection.cursor()

            # ------------------------------------------------
            # Create temporary staging table
            # ------------------------------------------------

            cursor.execute("""
                DROP TABLE IF EXISTS village_staging;
                CREATE TEMP TABLE village_staging (
                    village_code VARCHAR(20),
                    village_name TEXT,
                    sub_district_id INTEGER
                )
                
            """)


            # ------------------------------------------------
            # Prepare CSV data in memory
            # ------------------------------------------------

            csv_buffer = StringIO()

            for record in village_records:

                village_code = str(
                    record["village_code"]
                ).replace("\\", "\\\\").replace(
                    "\t", " "
                ).replace("\n", " ")

                village_name = str(
                    record["village_name"]
                ).replace("\\", "\\\\").replace(
                    "\t", " "
                ).replace("\n", " ")

                sub_district_id = str(
                    record["sub_district_id"]
                )

                csv_buffer.write(
                    f"{village_code}\t"
                    f"{village_name}\t"
                    f"{sub_district_id}\n"
                )

            csv_buffer.seek(0)

            # ------------------------------------------------
            # Bulk load into staging table
            # ------------------------------------------------

            print("Bulk loading villages into staging table...")

            cursor.copy_from(
                csv_buffer,
                "village_staging",
                columns=(
                    "village_code",
                    "village_name",
                    "sub_district_id"
                ),
                sep="\t"
            )

            raw_connection.commit()

            print(
                f"Staging records loaded: "
                f"{total:,}"
            )

            # ------------------------------------------------
            # Merge staging data into villages
            # ------------------------------------------------

            print(
                "Merging villages into database..."
            )

            cursor.execute("""
                INSERT INTO villages
                (
                    village_code,
                    village_name,
                    sub_district_id
                )
                SELECT
                    village_code,
                    village_name,
                    sub_district_id
                FROM village_staging
                ON CONFLICT
                (
                    sub_district_id,
                    village_code
                )
                DO UPDATE SET
                    village_name =
                    EXCLUDED.village_name
            """)

            raw_connection.commit()

            print(
                f"Villages processed: "
                f"{total:,}/{total:,}"
            )

            cursor.close()

        except Exception:

            raw_connection.rollback()

            raise

    return total




# ============================================================
# IMPORT ONE FILE
# ============================================================

def import_file(df):

    (
        states_df,
        districts_df,
        subdistricts_df,
        villages_df,
    ) = prepare_data(df)

    # --------------------------------------------------------
    # STATES
    # --------------------------------------------------------

    import_states(states_df)

    state_map = load_state_map()

    print(
        f"State records ready: "
        f"{len(state_map):,}"
    )

    # --------------------------------------------------------
    # DISTRICTS
    # --------------------------------------------------------

    import_districts(
        districts_df,
        state_map
    )

    district_map = load_district_map()

    # --------------------------------------------------------
    # SUB-DISTRICTS
    # --------------------------------------------------------

    import_subdistricts(
        subdistricts_df,
        state_map,
        district_map
    )

    subdistrict_map = load_subdistrict_map()

    # --------------------------------------------------------
    # VILLAGES
    # --------------------------------------------------------

    village_records = prepare_villages(
        villages_df,
        state_map,
        district_map,
        subdistrict_map
    )

    inserted = import_villages(
        village_records
    )

    return inserted


# ============================================================
# MAIN
# ============================================================


def main():

    print()
    print("=" * 60)
    print("INDIA VILLAGE DATA - FULL IMPORT")
    print("=" * 60)

    files = sorted(DATA_DIR.glob("Rdir_2011_*"))

    if not files:
        raise FileNotFoundError(
            f"No dataset files found in {DATA_DIR}"
        )

    print()
    print(f"Files found: {len(files)}")

    for file_path in files:
        print(f"  - {file_path.name}")

    print()
    print(f"File count verified: {len(files)}")
    print("=" * 60)

    successful = 0
    failed = 0

    for index, file_path in enumerate(files, start=1):

        print()
        print("=" * 60)
        print(f"FILE {index}/{len(files)}")
        print(file_path.name)
        print("=" * 60)

        try:
            df = read_dataset(file_path)

            village_count = import_file(df)

            print()
            print(f"SUCCESS: {file_path.name}")
            print(
                f"Village records processed: "
                f"{village_count:,}"
            )

            successful += 1

        except Exception as error:

            print()
            print(f"FAILED: {file_path.name}")
            print(f"Error: {error}")

            failed += 1

    print()
    print("=" * 60)
    print("FULL IMPORT SUMMARY")
    print("=" * 60)
    print(f"Successful files: {successful}")
    print(f"Failed files:     {failed}")
    print(f"Total files:      {len(files)}")
    print("=" * 60)


if __name__ == "__main__":
    main()





