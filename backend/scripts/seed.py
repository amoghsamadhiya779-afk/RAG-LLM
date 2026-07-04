import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import engine, AsyncSessionLocal
from app.db.models import User, Profile, Company, Job, RoleEnum, JobTypeEnum, JobLevelEnum, JobStatusEnum
from app.core.security import get_password_hash
from app.db.base import Base

async def seed():
    async with engine.begin() as conn:

        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Create users
        admin_user = User(email="admin@devboard.local", password_hash=get_password_hash("password"))
        employer_user = User(email="employer@devboard.local", password_hash=get_password_hash("password"))
        seeker_user = User(email="seeker@devboard.local", password_hash=get_password_hash("password"))
        
        session.add_all([admin_user, employer_user, seeker_user])
        await session.commit()
        
        admin_profile = Profile(user_id=admin_user.id, role=RoleEnum.admin, full_name="System Admin")
        employer_profile = Profile(user_id=employer_user.id, role=RoleEnum.employer, full_name="Tech Recruiter")
        seeker_profile = Profile(user_id=seeker_user.id, role=RoleEnum.seeker, full_name="Alice Engineer")
        
        session.add_all([admin_profile, employer_profile, seeker_profile])
        await session.commit()
        
        # Create companies with real logos (using clearbit)
        stripe = Company(
            owner_id=employer_user.id,
            slug="stripe",
            name="Stripe",
            about="Financial infrastructure platform for the internet.",
            location="San Francisco, CA / Remote",
            logo_url="https://logo.clearbit.com/stripe.com",
            website="https://stripe.com"
        )
        vercel = Company(
            owner_id=employer_user.id,
            slug="vercel",
            name="Vercel",
            about="Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.",
            location="Remote",
            logo_url="https://logo.clearbit.com/vercel.com",
            website="https://vercel.com"
        )
        openai = Company(
            owner_id=employer_user.id,
            slug="openai",
            name="OpenAI",
            about="AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.",
            location="San Francisco, CA",
            logo_url="https://logo.clearbit.com/openai.com",
            website="https://openai.com"
        )
        linear = Company(
            owner_id=employer_user.id,
            slug="linear",
            name="Linear",
            about="Linear is a purpose-built tool for planning and building products.",
            location="Remote",
            logo_url="https://logo.clearbit.com/linear.app",
            website="https://linear.app"
        )
        
        session.add_all([stripe, vercel, openai, linear])
        await session.commit()
        
        # Create real jobs
        jobs = [
            Job(
                company_id=stripe.id,
                title="Senior Backend Engineer, Payments",
                description="""Stripe is looking for a senior backend engineer to join our core payments team. You will be responsible for building highly reliable and scalable distributed systems that process billions of dollars in transactions.
                
Key Responsibilities:
- Design, build, and maintain robust backend APIs using Ruby, Go, and Java.
- Optimize high-throughput, low-latency financial systems.
- Collaborate with product and infrastructure teams.""",
                requirements=["Ruby", "Go", "Distributed Systems", "PostgreSQL", "AWS"],
                remote=False,
                job_type=JobTypeEnum.full_time,
                level=JobLevelEnum.senior,
                salary_min=180000,
                salary_max=250000,
                tags=["ruby", "go", "backend", "fintech"],
                status=JobStatusEnum.live,
                embedding=[0.01] * 768 
            ),
            Job(
                company_id=vercel.id,
                title="Frontend Engineer, Next.js",
                description="""Join the Next.js core team at Vercel. We are looking for passionate frontend engineers who want to push the boundaries of React and web development.
                
You will work on features like Server Components, Turbopack, and advanced routing patterns. Deep knowledge of React internals, TypeScript, and modern CSS is required.""",
                requirements=["React", "TypeScript", "Next.js", "Node.js", "CSS"],
                remote=True,
                job_type=JobTypeEnum.full_time,
                level=JobLevelEnum.mid,
                salary_min=140000,
                salary_max=190000,
                tags=["react", "typescript", "nextjs", "frontend"],
                status=JobStatusEnum.live,
                embedding=[0.02] * 768
            ),
            Job(
                company_id=openai.id,
                title="Machine Learning Engineer, Reasoning",
                description="""OpenAI is seeking ML Engineers to advance our models' reasoning capabilities. You will work on pre-training, fine-tuning (RLHF), and evaluation pipelines.
                
Experience with large scale distributed training (PyTorch, Triton) and deep learning fundamentals is essential. Help us build the next generation of AGI.""",
                requirements=["Python", "PyTorch", "C++", "CUDA", "LLMs", "RLHF"],
                remote=False,
                job_type=JobTypeEnum.full_time,
                level=JobLevelEnum.senior,
                salary_min=220000,
                salary_max=350000,
                tags=["python", "pytorch", "ml", "ai", "llm"],
                status=JobStatusEnum.live,
                embedding=[0.03] * 768
            ),
            Job(
                company_id=linear.id,
                title="Full Stack Engineer",
                description="""Help us build the best product management tool in the world. Linear is looking for full stack engineers who care deeply about performance, design, and user experience.
                
Our stack is React, TypeScript, GraphQL, Node.js, and PostgreSQL. We deploy multiple times a day and value high-velocity, high-quality shipping.""",
                requirements=["TypeScript", "React", "GraphQL", "Node.js", "PostgreSQL"],
                remote=True,
                job_type=JobTypeEnum.full_time,
                level=JobLevelEnum.senior,
                salary_min=160000,
                salary_max=220000,
                tags=["typescript", "react", "graphql", "fullstack"],
                status=JobStatusEnum.live,
                embedding=[0.04] * 768
            )
        ]
        
        session.add_all(jobs)
        await session.commit()
        
        print("Database seeded successfully with real company data!")

if __name__ == "__main__":
    asyncio.run(seed())
