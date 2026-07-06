import json
import urllib.request

url = 'https://1amogh212-resume-intelligence.hf.space/openapi.json'
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read().decode())

print("API Routes:")
for path in sorted(data.get('paths', {}).keys()):
    print(path)