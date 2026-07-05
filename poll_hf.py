import time
import urllib.request
url = "https://1amogh212-resume-intelligence.hf.space/api/v1/jobs?employment_type=full-time&page_size=1&page=1"

for i in range(20):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            print(f"Success! Status: {response.status}")
            print(response.read().decode()[:200])
            break
    except urllib.error.HTTPError as e:
        if e.code == 500:
            print(f"[{i}] Still 500...")
        else:
            print(f"[{i}] Error {e.code}: {e.read().decode()}")
            break
    except Exception as e:
        print(f"[{i}] Connection error: {e}")
    time.sleep(5)