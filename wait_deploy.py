import time
import requests
import sys

url = "https://1amogh212-resume-intelligence.hf.space/api/v1/me"
print(f"Polling {url}...")
for _ in range(30):
    try:
        response = requests.get(url)
        if response.status_code == 401:
            print("Success! Live space has restarted. Status 401 Unauthorized.")
            sys.exit(0)
        else:
            print(f"Still getting {response.status_code}...")
    except Exception as e:
        print("Error:", e)
    time.sleep(5)
print("Timeout waiting for deploy.")
sys.exit(1)