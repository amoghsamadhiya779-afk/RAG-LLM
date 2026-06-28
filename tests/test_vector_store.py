import pytest
from pathlib import Path
from resume_rag.vector_store import SQLiteVectorStore
from resume_rag.documents import DocumentChunk

def test_sqlite_vector_store(tmp_path: Path):
    db_path = tmp_path / "test_store.db"
    store = SQLiteVectorStore(index_path=db_path)
    
    # Test initial count
    assert store.count == 0
    
    # Add a document
    chunk = DocumentChunk(
        content="The quick brown fox jumps over the lazy dog",
        metadata={"source": "test_doc.txt"},
        embedding=[0.1, 0.2, 0.3]
    )
    store.add([chunk])
    
    assert store.count == 1
    
    # Test sources
    sources = store.sources()
    assert len(sources) == 1
    assert sources[0]["source"] == "test_doc.txt"
    assert sources[0]["count"] == 1
    
    # Delete the document
    deleted = store.delete("test_doc.txt")
    assert deleted == 1
    assert store.count == 0
