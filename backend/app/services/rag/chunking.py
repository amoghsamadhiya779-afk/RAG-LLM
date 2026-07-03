from dataclasses import dataclass
from hashlib import sha256

from app.services.rag.schemas import DocumentIn


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

    # Recursive character splitting
    separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""]
    raw_chunks = _recursive_split(document.text, separators, chunk_size, overlap)

    chunks: list[Chunk] = []
    for idx, text in enumerate(raw_chunks):
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


def _recursive_split(text: str, separators: list[str], chunk_size: int, overlap: int) -> list[str]:
    if len(text) <= chunk_size:
        return [text.strip()] if text.strip() else []

    if not separators:
        # Force hard split window with overlap if no separators remain
        step = max(1, chunk_size - overlap)
        return [text[i : i + chunk_size].strip() for i in range(0, len(text), step)]

    separator = separators[0]
    next_separators = separators[1:]

    parts = text.split(separator)
    splits: list[str] = []
    current_chunk = ""

    for part in parts:
        if len(part) > chunk_size:
            if current_chunk:
                splits.append(current_chunk.strip())
                current_chunk = ""
            splits.extend(_recursive_split(part, next_separators, chunk_size, overlap))
        else:
            candidate = f"{current_chunk}{separator}{part}" if current_chunk else part
            if len(candidate) <= chunk_size:
                current_chunk = candidate
            else:
                if current_chunk:
                    splits.append(current_chunk.strip())
                overlap_text = current_chunk[-overlap:] if current_chunk and overlap > 0 else ""
                current_chunk = f"{overlap_text}{separator}{part}" if overlap_text else part

    if current_chunk:
        splits.append(current_chunk.strip())

    return [s for s in splits if s.strip()]
