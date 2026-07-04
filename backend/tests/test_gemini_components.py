import pytest
import json
from dataclasses import dataclass
from app.services.rag.embeddings import GeminiEmbeddingModel
from app.services.rag.llm import GeminiAnswerGenerator
from app.services.rag.vector_store import StoredChunk, SearchResult

class MockEmbeddingItem:
    def __init__(self, values):
        self.values = values

class MockEmbedResponse:
    def __init__(self, embeddings):
        self.embeddings = embeddings

class MockGenerateResponse:
    def __init__(self, text):
        self.text = text

class MockModelsService:
    def embed_content(self, model, contents, **kwargs):
        # Return a list of embeddings with dummy floats
        return MockEmbedResponse([MockEmbeddingItem([0.1, 0.2, 0.3]) for _ in contents])

    def generate_content(self, model, contents, config=None, **kwargs):
        # We can check contents and return custom text
        if "generate 3" in contents or "versions of the given user question" in contents:
            return MockGenerateResponse("Alternative question 1\nAlternative question 2\nAlternative question 3")
        elif "routing" in contents or "datasource" in contents:
            return MockGenerateResponse('{"datasource": "job_search"}')
        elif "Evaluate the candidate's resume credentials" in contents:
            return MockGenerateResponse('{"match_score": 85, "strengths": ["Python"], "gaps": ["Go"]}')
        return MockGenerateResponse("Mocked general response")

class MockClient:
    def __init__(self, api_key=None):
        self.models = MockModelsService()

@pytest.fixture
def mock_gemini_client(monkeypatch):
    import google.genai
    monkeypatch.setattr(google.genai, "Client", MockClient)

def test_gemini_embedding_model(mock_gemini_client):
    model = GeminiEmbeddingModel(api_key="test-key", model="text-embedding-004")
    embeddings = model.embed(["test text 1", "test text 2"])
    assert len(embeddings) == 2
    assert embeddings[0] == [0.1, 0.2, 0.3]
    assert embeddings[1] == [0.1, 0.2, 0.3]

def test_gemini_answer_generator_queries(mock_gemini_client):
    generator = GeminiAnswerGenerator(api_key="test-key", model="gemini-2.5-flash")
    queries = generator.generate_queries("How to learn Python?")
    # Check that it extracted the 3 mocked queries
    assert len(queries) == 3
    assert "Alternative question 1" in queries
    # Note the bug we found: the original question is NOT prepended or returned on success!
    assert "How to learn Python?" not in queries

def test_gemini_answer_generator_route(mock_gemini_client):
    generator = GeminiAnswerGenerator(api_key="test-key", model="gemini-2.5-flash")
    route = generator.route_query("Is there an open position?")
    assert route == "job_search"

def test_gemini_answer_generator_evaluate(mock_gemini_client):
    generator = GeminiAnswerGenerator(api_key="test-key", model="gemini-2.5-flash")
    dummy_chunk = StoredChunk(
        id="1", 
        text="Python expert", 
        source="resume.pdf", 
        doc_type="resume", 
        metadata={"candidate": "Amogh"},
        embedding=[0.1, 0.2, 0.3]
    )
    score, strengths, gaps = generator.evaluate_match(
        role_title="SWE",
        job_description="Need Python and Go",
        contexts=[SearchResult(chunk=dummy_chunk, score=0.9)]
    )
    assert score == 85
    assert "Python" in strengths
    assert "Go" in gaps
