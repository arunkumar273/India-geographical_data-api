from pathlib import Path
import pandas as pd

DATA_DIR = Path("data/raw")

files = list(DATA_DIR.glob("*.xls")) + list(DATA_DIR.glob("*.xlsx"))

total_rows = 0

for file in files:
    df = pd.read_excel(file, dtype=str)

    total_rows += len(df)

    print(f"\nFILE: {file.name}")
    print(f"Rows: {len(df):,}")

    print("Unique State Codes:", df["MDDS STC"].nunique())
    print("Unique District Codes:", df["MDDS DTC"].nunique())
    print("Unique Sub-District Codes:", df["MDDS Sub_DT"].nunique())
    print("Unique Area Codes:", df["MDDS PLCN"].nunique())

print("\n" + "=" * 60)
print(f"TOTAL FILES: {len(files)}")
print(f"TOTAL ROWS: {total_rows:,}")
print("=" * 60)