import urllib.request, json
url = "https://1amogh212-resume-intelligence.hf.space/api/v1/jobs?page_size=100&page=1"
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        items = data.get('items', [])
        
        counts = {
            'remote': 0,
            'seniority': 0,
            'salary_min': 0,
            'tags': {
                'React': 0, 'TypeScript': 0, 'Python': 0, 'Go': 0, 'Rust': 0, 'AI/ML': 0, 'Design': 0, 'Product': 0
            }
        }
        
        for item in items:
            if item.get('remote') is True:
                counts['remote'] += 1
            if item.get('seniority'):
                counts['seniority'] += 1
            if item.get('salaryMin') or item.get('salary_min'):
                counts['salary_min'] += 1
            
            job_tags = item.get('tags', [])
            job_tags_lower = [t.lower() for t in job_tags]
            
            for tag in counts['tags'].keys():
                tag_lower = tag.lower()
                # substring match
                if any(tag_lower in jt for jt in job_tags_lower):
                    counts['tags'][tag] += 1
        
        print("Total checked:", len(items))
        print("Counts:", json.dumps(counts, indent=2))
except Exception as e:
    print("Error:", e)