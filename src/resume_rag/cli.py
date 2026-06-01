from __future__ import annotations

import argparse
from pathlib import Path

from resume_rag.documents import load_document
from resume_rag.factory import get_service


def main() -> None:
    parser = argparse.ArgumentParser(description="Resume RAG Command Center CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ingest = subparsers.add_parser("ingest", help="Index a PDF, TXT, or Markdown document.")
    ingest.add_argument("path", type=Path)
    ingest.add_argument(
        "--type",
        default="resume",
        choices=["resume", "job", "portfolio", "general"],
    )

    query = subparsers.add_parser("query", help="Ask a grounded question.")
    query.add_argument("question")
    query.add_argument("--top-k", type=int, default=None)

    match = subparsers.add_parser(
        "match",
        help="Score a job description against indexed resume evidence.",
    )
    match.add_argument("role_title")
    match.add_argument("job_description_path", type=Path)

    args = parser.parse_args()
    service = get_service()

    if args.command == "ingest":
        document = load_document(args.path, doc_type=args.type)
        response = service.ingest(document)
        print(response.model_dump_json(indent=2))
    elif args.command == "query":
        response = service.query(args.question, top_k=args.top_k)
        print(response.model_dump_json(indent=2))
    elif args.command == "match":
        job_description = args.job_description_path.read_text(encoding="utf-8")
        response = service.match_role(args.role_title, job_description, top_k=8)
        print(response.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
