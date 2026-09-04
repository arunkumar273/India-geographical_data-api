from pathlib import Path
import pandas as pd

DATA_DIR = Path("data/raw")

files = (
    list(DATA_DIR.glob("*.xls"))
    + list(DATA_DIR.glob("*.xlsx"))
    + list(DATA_DIR.glob("*.ods"))
)
EXPECTED_COLUMNS = [
    "MDDS STC",
    "STATE NAME",
    "MDDS DTC",
    "DISTRICT NAME",
    "MDDS Sub_DT",
    "SUB-DISTRICT NAME",
    "MDDS PLCN",
    "Area Name"
]

total_rows = 0
successful_files = 0
problem_files = []

print("=" * 70)
print("INDIA VILLAGE DATASET ANALYSIS")
print("=" * 70)

print(f"\nTotal Excel files found: {len(files)}")

for file in files:

    try:
        excel = pd.ExcelFile(file)

        selected_sheet = None

        # Find the sheet containing the expected columns
        for sheet in excel.sheet_names:

            df = pd.read_excel(
                file,
                sheet_name=sheet,
                dtype=str
            )

            columns = [str(col).strip() for col in df.columns]

            if all(column in columns for column in EXPECTED_COLUMNS):
                selected_sheet = sheet
                break

        if selected_sheet is None:
            raise ValueError(
                "No sheet containing the expected 8 columns was found"
            )

        # Read the correct sheet
        df = pd.read_excel(
            file,
            sheet_name=selected_sheet,
            dtype=str
        )

        # Clean column names
        df.columns = [str(col).strip() for col in df.columns]

        rows = len(df)
        total_rows += rows
        successful_files += 1

        print("\n" + "-" * 70)
        print(f"FILE: {file.name}")
        print(f"Sheet: {selected_sheet}")
        print(f"Rows: {rows:,}")
        print(f"Columns: {len(df.columns)}")

        print(f"Unique State Codes: {df['MDDS STC'].nunique()}")
        print(f"Unique District Codes: {df['MDDS DTC'].nunique()}")
        print(f"Unique Sub-District Codes: {df['MDDS Sub_DT'].nunique()}")
        print(f"Unique Area Codes: {df['MDDS PLCN'].nunique()}")

    except Exception as e:

        problem_files.append((file.name, str(e)))

        print("\nERROR:", file.name)
        print("Reason:", e)


print("\n" + "=" * 70)
print("FINAL SUMMARY")
print("=" * 70)

print(f"Total files found: {len(files)}")
print(f"Successfully analyzed: {successful_files}")
print(f"Problem files: {len(problem_files)}")
print(f"Total rows: {total_rows:,}")

if problem_files:

    print("\nProblem files:")

    for filename, error in problem_files:
        print(f"- {filename}: {error}")

else:
    print("\nAll files analyzed successfully!")

print("=" * 70)