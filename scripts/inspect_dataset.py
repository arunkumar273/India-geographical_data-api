from pathlib import Path
import pandas as pd

DATA_DIR = Path("data/raw")

excel_files = list(DATA_DIR.glob("*.xls")) + list(DATA_DIR.glob("*.xlsx"))

print("=" * 70)
print("DETAILED DATASET INSPECTION")
print("=" * 70)

print(f"\nTotal Excel files: {len(excel_files)}")

# Inspect the first Excel file
file = excel_files[0]

print(f"\nFile being inspected: {file.name}")

df = pd.read_excel(file)

print(f"Rows: {len(df):,}")
print(f"Columns: {len(df.columns)}")

print("\nColumn names:")
for column in df.columns:
    print(f"  - {column}")

print("\n" + "-" * 70)
print("FIRST 10 RECORDS")
print("-" * 70)

print(df.head(10).to_string(index=False))

print("\n" + "-" * 70)
print("DATA TYPES")
print("-" * 70)

print(df.dtypes)

print("\n" + "-" * 70)
print("MISSING VALUES")
print("-" * 70)

print(df.isnull().sum())

print("\n" + "-" * 70)
print("DUPLICATE ROWS")
print("-" * 70)

print("Duplicate rows:", df.duplicated().sum())

print("\n" + "=" * 70)
print("INSPECTION COMPLETED")
print("=" * 70)