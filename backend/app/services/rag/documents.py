from pathlib import Path
from uuid import uuid4

from pypdf import PdfReader

from app.rag.schemas import DocumentIn


def load_document(path: Path, doc_type: str = "general") -> DocumentIn:
    if not path.exists():
        raise FileNotFoundError(path)

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text = _read_pdf(path)
    elif suffix in {".txt", ".md"}:
        text = path.read_text(encoding="utf-8")
    else:
        raise ValueError(f"Unsupported file type: {suffix}. Use PDF, TXT, or Markdown.")

    return DocumentIn(
        text=text,
        source=str(path),
        doc_type=doc_type,
        metadata={"file_name": path.name, "document_id": str(uuid4())},
    )


def _read_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(page.strip() for page in pages if page.strip())
