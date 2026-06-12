import json

from resume_rag.embeddings import EmbeddingModel
from resume_rag.vector_store import JsonVectorStore

JOBS_DATA = [
    {
        "id": "job-backend-mid",
        "title": "Backend Engineer",
        "company": "CloudFlow Systems",
        "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "Redis", "REST APIs", "Git"],
        "responsibilities": "Design and build scalable microservices using FastAPI. Optimize SQL queries and structure PostgreSQL schemas. Implement caching strategies using Redis. Write thorough unit tests.",
        "experience_level": "Mid-level (2-4 years)",
        "salary_range": "$110,000 - $130,000",
        "location": "Remote (US/Canada)",
        "tech_stack": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "GitHub"],
        "culture": "Fast-paced, collaborative, strong emphasis on clean code and peer reviews."
    },
    {
        "id": "job-backend-sr",
        "title": "Senior Backend Engineer",
        "company": "Nova Scale AI",
        "skills": ["Python", "Go", "FastAPI", "Docker", "Kubernetes", "PostgreSQL", "Redis", "Kafka", "System Design", "Prometheus"],
        "responsibilities": "Lead the architectural design of high-throughput distributed systems. Mentor mid-level engineers. Implement event-driven ingestion pipelines using Kafka. Orchestrate container workloads via Kubernetes.",
        "experience_level": "Senior (5+ years)",
        "salary_range": "$160,000 - $190,000",
        "location": "New York, NY (Hybrid)",
        "tech_stack": ["Python", "Go", "FastAPI", "Kubernetes", "Kafka", "PostgreSQL", "Redis", "AWS"],
        "culture": "Mission-driven, high autonomy, engineering-led decision making."
    },
    {
        "id": "job-frontend-mid",
        "title": "Frontend Engineer",
        "company": "PixelVibe Studio",
        "skills": ["TypeScript", "React", "Next.js", "Tailwind CSS", "Framer Motion", "HTML5", "CSS3"],
        "responsibilities": "Develop interactive web dashboards and landing pages. Implement spring physics animations using Framer Motion. Collaborate with UI/UX designers to translate Figma mockups into pixel-perfect components.",
        "experience_level": "Mid-level (2-4 years)",
        "salary_range": "$100,000 - $125,000",
        "location": "Remote (US)",
        "tech_stack": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
        "culture": "Creative, design-driven, flexible hours, strong design system culture."
    },
    {
        "id": "job-frontend-sr",
        "title": "Senior Frontend Engineer",
        "company": "Fintech Spark",
        "skills": ["TypeScript", "React", "Next.js", "Redux", "Performance Optimization", "Webpack", "Testing Library", "CSS Grid"],
        "responsibilities": "Optimize client-side load speeds and bundle sizes. Refactor legacy state management to modern Redux Toolkit. Standardize automated component unit testing suites.",
        "experience_level": "Senior (5+ years)",
        "salary_range": "$150,000 - $175,000",
        "location": "San Francisco, CA (Hybrid)",
        "tech_stack": ["React", "Next.js", "TypeScript", "Redux", "Jest", "Playwright"],
        "culture": "Security-focused, data-driven, continuous learning and tech talks."
    },
    {
        "id": "job-devops",
        "title": "DevOps Engineer",
        "company": "InfraCore Labs",
        "skills": ["AWS", "Terraform", "Docker", "Kubernetes", "CI/CD", "GitHub Actions", "Linux", "Bash"],
        "responsibilities": "Manage cloud resources using Infrastructure as Code (Terraform). Build and maintain deployment pipelines using GitHub Actions. Secure AWS configurations and audit permissions.",
        "experience_level": "Mid-Senior (3-5 years)",
        "salary_range": "$130,000 - $155,000",
        "location": "Austin, TX (On-site)",
        "tech_stack": ["AWS", "Terraform", "Kubernetes", "GitHub Actions", "Docker", "Helm"],
        "culture": "Reliability-first, Blameless post-mortems, open source contribution culture."
    },
    {
        "id": "job-platform",
        "title": "Platform Engineer",
        "company": "DataMesh Inc.",
        "skills": ["Kubernetes", "Terraform", "AWS", "Go", "Docker", "Helm", "Prometheus", "Service Mesh", "GitOps"],
        "responsibilities": "Design and build internal developer platforms. Write Go operators for custom Kubernetes controllers. Standardize metric reporting via Prometheus and Grafana dashboards.",
        "experience_level": "Senior (5+ years)",
        "salary_range": "$170,000 - $200,000",
        "location": "Remote (US/Europe)",
        "tech_stack": ["Go", "Kubernetes", "Terraform", "AWS", "ArgoCD", "Prometheus"],
        "culture": "Developer empowerment, platform-as-a-product mindset, technical writing advocate."
    },
    {
        "id": "job-staff",
        "title": "Staff Engineer",
        "company": "Global Network Solutions",
        "skills": ["System Design", "Distributed Systems", "Architecture", "Go", "Java", "Cloud Infrastructure", "Leadership", "Concurrency"],
        "responsibilities": "Provide technical vision across multiple engineering teams. Define corporate API standards and protocols. Author technical RFCs and lead cross-department architecture reviews.",
        "experience_level": "Staff (8+ years)",
        "salary_range": "$220,000 - $260,000",
        "location": "Seattle, WA (Hybrid)",
        "tech_stack": ["Go", "Java", "AWS", "Kubernetes", "gRPC", "Protobuf"],
        "culture": "High ownership, strategic, mentorship-centric, architectural rigor."
    },
    {
        "id": "job-ml-mid",
        "title": "Machine Learning Engineer",
        "company": "VisionAI Research",
        "skills": ["Python", "PyTorch", "TensorFlow", "Scikit-learn", "Docker", "NumPy", "Pandas", "Computer Vision"],
        "responsibilities": "Train and evaluate deep learning models for image segmentation. Optimize model hyper-parameters. Deploy lightweight model binaries inside Docker containers.",
        "experience_level": "Mid-level (2-4 years)",
        "salary_range": "$125,000 - $150,000",
        "location": "Boston, MA (Hybrid)",
        "tech_stack": ["Python", "PyTorch", "OpenCV", "Scikit-learn", "Docker", "AWS"],
        "culture": "Research-oriented, academically curious, publishes papers regularly."
    },
    {
        "id": "job-mlops",
        "title": "MLOps Engineer",
        "company": "DeepFlow Intelligence",
        "skills": ["Python", "MLflow", "Airflow", "Docker", "Kubernetes", "AWS", "Triton", "DVC", "CI/CD"],
        "responsibilities": "Build and manage end-to-end model training and deployment pipelines. Implement automated model evaluation steps. Orchestrate models on Triton Inference Server.",
        "experience_level": "Senior (4+ years)",
        "salary_range": "$155,000 - $185,000",
        "location": "Remote (US)",
        "tech_stack": ["Python", "MLflow", "Airflow", "Kubernetes", "Triton", "DVC", "AWS"],
        "culture": "Engineering-first ML, robust reproducibility, continuous automation focus."
    },
    {
        "id": "job-ml-platform",
        "title": "ML Platform Engineer",
        "company": "Cognitive Scale",
        "skills": ["Python", "Go", "Kubernetes", "MLflow", "Triton", "Ray", "PyTorch", "CUDA", "Helm"],
        "responsibilities": "Build custom distributed training runtimes using Ray on Kubernetes. Optimize PyTorch cluster communications. Manage CUDA toolkit setups on multi-GPU nodes.",
        "experience_level": "Senior (5+ years)",
        "salary_range": "$180,000 - $210,000",
        "location": "Denver, CO (Hybrid)",
        "tech_stack": ["Python", "Go", "Ray", "Kubernetes", "Triton", "PyTorch", "CUDA"],
        "culture": "High performance computing focus, infrastructure-as-a-science, open-source first."
    },
    {
        "id": "job-ai-infra",
        "title": "AI Infrastructure Engineer",
        "company": "Tensor Foundry",
        "skills": ["Go", "C++", "CUDA", "Kubernetes", "PyTorch", "DeepSpeed", "Infiniband", "Linux Kernel"],
        "responsibilities": "Optimize multi-node cluster networks using Infiniband. Hack on PyTorch compiler scripts to accelerate LLM fine-tuning. Profile memory layout performance of deep learning pipelines.",
        "experience_level": "Senior/Staff (6+ years)",
        "salary_range": "$200,000 - $240,000",
        "location": "Remote (US)",
        "tech_stack": ["C++", "Go", "CUDA", "PyTorch", "DeepSpeed", "Kubernetes", "Infiniband"],
        "culture": "Hardcore systems engineering, GPU enthusiast, close collaboration with hardware vendors."
    },
    {
        "id": "job-data-mid",
        "title": "Data Engineer",
        "company": "Metric Analytics",
        "skills": ["Python", "Spark", "SQL", "Airflow", "Snowflake", "AWS", "DBT", "Git"],
        "responsibilities": "Author and schedule ETL jobs in Apache Airflow. Build robust data warehouse dimensions and facts using DBT and Snowflake. Model business metrics cleanly.",
        "experience_level": "Mid-level (2-4 years)",
        "salary_range": "$105,000 - $125,000",
        "location": "Chicago, IL (Hybrid)",
        "tech_stack": ["Python", "Spark", "Airflow", "Snowflake", "DBT", "AWS"],
        "culture": "Business-aligned, metrics-obsessed, highly organized documentation structure."
    },
    {
        "id": "job-data-sr",
        "title": "Senior Data Engineer",
        "company": "BigQuery Logistics",
        "skills": ["Python", "Scala", "Spark", "Kafka", "Airflow", "Snowflake", "AWS", "Kubernetes", "DBT", "Data Lake"],
        "responsibilities": "Design real-time data streaming architectures. Manage large scale Spark compute pools on Kubernetes clusters. Audit data catalog schemas and compliance partitions.",
        "experience_level": "Senior (5+ years)",
        "salary_range": "$150,000 - $180,000",
        "location": "Remote (US)",
        "tech_stack": ["Python", "Scala", "Spark", "Kafka", "Airflow", "Snowflake", "DBT"],
        "culture": "Reliable data quality pipelines, active data cataloging, cross-department collaboration."
    },
    {
        "id": "job-security",
        "title": "Cloud Security Engineer",
        "company": "Securify Cloud",
        "skills": ["AWS", "IAM", "Terraform", "Security Auditing", "Kubernetes Security", "Vault", "SIEM", "Python"],
        "responsibilities": "Design and audit least-privilege IAM policies. Integrate HashiCorp Vault secrets storage. Configure VPC network boundaries and monitor security logs.",
        "experience_level": "Mid-Senior (4+ years)",
        "salary_range": "$140,000 - $165,000",
        "location": "Los Angeles, CA (Hybrid)",
        "tech_stack": ["AWS", "Terraform", "Vault", "Kubernetes", "Python", "CloudTrail"],
        "culture": "Security-first, proactive defense, collaborative threat-modeling."
    },
    {
        "id": "job-fullstack",
        "title": "Full Stack Engineer",
        "company": "SaaS Accelerator",
        "skills": ["TypeScript", "React", "Next.js", "Node.js", "Express", "PostgreSQL", "Prisma", "Tailwind CSS"],
        "responsibilities": "Own product features end-to-end. Implement backend APIs and database migrations alongside modern React frontend layouts. Standardize component styles.",
        "experience_level": "Mid-level (3-5 years)",
        "salary_range": "$115,000 - $135,000",
        "location": "Remote (US)",
        "tech_stack": ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Prisma"],
        "culture": "Product-minded, rapid prototyping, direct customer feedback loops."
    }
]

def seed_jobs(vector_store: JsonVectorStore, embedding_model: EmbeddingModel) -> int:
    vector_store.clear_jobs()
    for job in JOBS_DATA:
        vector_store.add_job(
            id=job["id"],
            title=job["title"],
            company=job["company"],
            skills=job["skills"],
            responsibilities=job["responsibilities"],
            experience_level=job["experience_level"],
            salary_range=job["salary_range"],
            location=job["location"],
            tech_stack=job["tech_stack"],
            culture=job["culture"],
            embedding_model=embedding_model,
        )
    return len(JOBS_DATA)
