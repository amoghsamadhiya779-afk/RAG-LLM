import os
import re

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '@tanstack/react-router' not in content:
        return
        
    print(f"Fixing {path}")
    
    # Handle single imports
    content = re.sub(r'import\s+{\s*Link\s*}\s+from\s+[\'"]@tanstack/react-router[\'"];?', 'import Link from "next/link";', content)
    content = re.sub(r'import\s+{\s*useRouter\s*}\s+from\s+[\'"]@tanstack/react-router[\'"];?', 'import { useRouter } from "next/navigation";', content)
    content = re.sub(r'import\s+{\s*useParams\s*}\s+from\s+[\'"]@tanstack/react-router[\'"];?', 'import { useParams } from "next/navigation";', content)
    content = re.sub(r'import\s+{\s*Navigate\s*}\s+from\s+[\'"]@tanstack/react-router[\'"];?', 'import { redirect } from "next/navigation";', content)
    
    # Handle combination of Link and others (very simplistic)
    if 'import { Link,' in content or 'import { Link ' in content:
        content = content.replace('import { Link,', 'import Link from "next/link";\nimport {')
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))

for root, dirs, files in os.walk('src/hooks'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
