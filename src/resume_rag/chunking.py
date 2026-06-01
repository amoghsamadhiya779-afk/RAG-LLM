from dataclasses import dataclass
from hashlib import sha256

from resume_rag.schemas import DocumentIn


@dataclass(frozen=True)
class Chunk:
    id: str
    text: str
    source: str
    doc_type: str
    metadata: dict[str, str]


def chunk_document(document: DocumentIn, chunk_size: int, overlap: int) -> list[Chunk]:
    if overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    paragraphs = [p.strip() for p in document.text.split("\n\n") if p.strip()]
    windows: list[str] = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
            continue
        if current:
            windows.extend(_split_long_text(current, chunk_size, overlap))
        current = paragraph

    if current:
        windows.extend(_split_long_text(current, chunk_size, overlap))

    chunks: list[Chunk] = []
    for idx, text in enumerate(windows):
        digest = sha256(f"{document.source}:{idx}:{text}".encode()).hexdigest()[:16]
        metadata = {str(k): str(v) for k, v in document.metadata.items()}
        metadata["chunk_index"] = str(idx)
        chunks.append(
            Chunk(
                id=digest,
                text=text,
                source=document.source,
                doc_type=document.doc_type,
                metadata=metadata,
            )
        )
    return chunks


def _split_long_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end].strip())
        if end == len(text):
            break
        start = max(0, end - overlap)
    return [chunk for chunk in chunks if chunk]
