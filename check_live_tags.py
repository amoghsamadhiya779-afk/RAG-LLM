import urllib.request, json
url = "https://1amogh212-resume-intelligence.hf.space/api/v1/jobs?page_size=100&page=1"
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        items = data.get('items', [])
        employment_tags = []
        for item in items:
            for tag in item.get('tags', []):
                t = tag.lower()
                if 'full' in t or 'time' in t or 'part' in t or 'contract' in t or 'intern' in t:
                    employment_tags.append(t)
        print("Found employment-related tags:", employment_tags)
except Exception as e:
    print(e)