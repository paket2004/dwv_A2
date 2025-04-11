import csv
import requests

def send_packages(csv_file):
    with open(csv_file, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            clean_row = {
                "ip_address": str(row['ip address']),
                "latitude": float(row['Latitude']),
                "longitude": float(row['Longitude']),
                "timestamp": str(row['Timestamp']),
                "suspicious": str(row['suspicious'])
            }
            requests.post('http://backend:5000/api/packages', json=clean_row)

send_packages('ip_addresses.csv')