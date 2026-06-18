import pandas as pd
from sqlalchemy import create_engine
import os

# --- UPDATE THIS WITH YOUR POSTGRES CREDENTIALS ---
DB_URL = "postgresql://postgres:root@localhost:5432/readiness_db"

engine = create_engine(DB_URL)

# Map the files to clean table names for your database
excel_files = {
    r"D:\root-cause-explorer\backend\Sales Return Price is Greater than Sales Price.xlsx": "tx_sales_return_price_greater",
    r"D:\root-cause-explorer\backend\Sales Return After 180 Days.xlsx": "tx_sales_return_180_days",
    r"D:\root-cause-explorer\backend\Sales Return - IM.xlsx": "tx_sales_return_im",
    r"D:\root-cause-explorer\backend\Duplicate Customers Analytics-Apr-2026 - Updated.xlsx": "tx_duplicate_customers",
    r"D:\root-cause-explorer\backend\Multiple Sales Return.xlsx": "tx_multiple_sales_return"
}

def load_data():
    for file_name, table_name in excel_files.items():
        if os.path.exists(file_name):
            print(f"Loading {file_name} into table '{table_name}'...")
            
            try:
                # Use read_excel for .xlsx files
                df = pd.read_excel(file_name)
                
                # Clean up column names (lowercase, replace spaces with underscores)
                df.columns = [str(c).strip().lower().replace(' ', '_').replace('-', '_') for c in df.columns]
                
                # Push to PostgreSQL (replace table if it exists)
                df.to_sql(table_name, engine, if_exists='replace', index=False)
                print(f"✅ Successfully loaded {len(df)} rows into '{table_name}'\n")
                
            except Exception as e:
                print(f"❌ Failed to load {file_name}. Error: {e}\n")
        else:
            print(f"❌ File not found: {file_name}\n")

if __name__ == "__main__":
    load_data()
    print("Database seeding complete!")