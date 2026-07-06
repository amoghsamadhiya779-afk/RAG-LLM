import json
import urllib.request

url = 'https://1amogh212-resume-intelligence.hf.space/openapi.json'
with urllib.request.urlopen(url) as response:
    data = json.loads(response.read().decode())

print("Matching Paths:")
for path in data.get('paths', {}):
    if 'me' in path.lower() or 'user' in path.lower() or 'profile' in path.lower():
        print(path)