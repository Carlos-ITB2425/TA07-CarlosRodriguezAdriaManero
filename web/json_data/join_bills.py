import json
import pandas as pd
from datetime import datetime


def combine_json_files():
    try:
        # Read each JSON file
        with open('cleaningProducts_bill.json', 'r') as f:
            cleaning_data = json.load(f)

        with open('officeMaterial_bill.json', 'r') as f:
            office_data = json.load(f)

        with open('services_bill.json', 'r') as f:
            services_data = json.load(f)

        # Add a category field to each record to identify its source
        for item in cleaning_data:
            item['Category'] = 'Cleaning Products'

        for item in office_data:
            item['Category'] = 'Office Material'

        for item in services_data:
            item['Category'] = 'Services'

        # Combine all data
        combined_data = cleaning_data + office_data + services_data

        # Sort by date using pandas
        df = pd.DataFrame(combined_data)
        df['Fecha'] = pd.to_datetime(df['Fecha'])
        df = df.sort_values('Fecha')

        # Convert datetime back to ISO format string
        df['Fecha'] = df['Fecha'].dt.strftime('%Y-%m-%dT%H:%M:%S.000')

        # Convert back to list of dictionaries
        sorted_data = df.to_dict('records')

        # Save the combined data
        with open('materials_combined.json', 'w', encoding='utf-8') as f:
            json.dump(sorted_data, f, ensure_ascii=False, indent=4)

        print("Files combined successfully into 'materials_combined.json'")

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    combine_json_files()