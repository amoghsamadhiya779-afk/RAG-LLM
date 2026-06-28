import json
from collections.abc import Iterator
from resume_rag.config import Settings
from resume_rag.embeddings import EmbeddingModel
from resume_rag.llm import AnswerGenerator
from resume_rag.schemas import QueryResponse, SourceSnippet
from resume_rag.vector_store import SQLiteVectorStore, SearchResult


def _to_source(result: SearchResult) -> SourceSnippet:
    return SourceSnippet(
        source=result.chunk.source,
        doc_type=result.chunk.doc_type,
        score=round(result.score, 4),
        text=result.chunk.text,
        metadata=result.chunk.metadata,
    )


class QueryService:
    def __init__(
        self,
        settings: Settings,
        embedding_model: EmbeddingModel,
        answer_generator: AnswerGenerator,
        vector_store: SQLiteVectorStore,
    ):
        self.settings = settings
        self.embedding_model = embedding_model
        self.answer_generator = answer_generator
        self.vector_store = vector_store

    def query(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> QueryResponse:
        route = self.answer_generator.route_query(question)
        if route == "general":
            return QueryResponse(answer="I am a Resume Intelligence Assistant. Please ask me about candidate skills, experience, or job matching.", sources=[])
            
        queries = self.answer_generator.generate_queries(question)
        all_results = []
        for q in queries:
            results = self.vector_store.search(
                q,
                self.embedding_model,
                top_k=top_k or self.settings.top_k,
                filters=filters,
            )
            all_results.append(results)
            
        fused_results = self._reciprocal_rank_fusion(all_results, top_n=top_k or self.settings.top_k)
        graded_results = self.answer_generator.grade_documents(question, fused_results)

        return QueryResponse(
            answer=self.answer_generator.answer(question, graded_results),
            sources=[_to_source(result) for result in graded_results],
        )

    def query_stream(
        self,
        question: str,
        top_k: int | None = None,
        filters: dict[str, str] | None = None,
    ) -> tuple[list[SourceSnippet], Iterator[str]]:
        route = self.answer_generator.route_query(question)
        if route == "general":
            def gen():
                yield "I am a Resume Intelligence Assistant. Please ask me about candidate skills, experience, or job matching."
            return [], gen()
            
        queries = self.answer_generator.generate_queries(question)
        all_results = []
        for q in queries:
            results = self.vector_store.search(
                q,
                self.embedding_model,
                top_k=top_k or self.settings.top_k,
                filters=filters,
            )
            all_results.append(results)
            
        fused_results = self._reciprocal_rank_fusion(all_results, top_n=top_k or self.settings.top_k)
        graded_results = self.answer_generator.grade_documents(question, fused_results)

        sources = [_to_source(result) for result in graded_results]
        token_stream = self.answer_generator.answer_stream(question, graded_results)
        return sources, token_stream

    def _reciprocal_rank_fusion(self, results_list: list[list[SearchResult]], k: int = 60, top_n: int = 4) -> list[SearchResult]:
        fused_scores = {}
        chunk_map = {}
        for results in results_list:
            for rank, result in enumerate(results):
                chunk_id = result.chunk.id
                if chunk_id not in chunk_map:
                    chunk_map[chunk_id] = result
                if chunk_id not in fused_scores:
                    fused_scores[chunk_id] = 0.0
                fused_scores[chunk_id] += 1 / (rank + k)
                
        sorted_chunks = sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
        
        fused_results = []
        for chunk_id, _score in sorted_chunks[:top_n]:
            fused_results.append(chunk_map[chunk_id])
            
        return fused_results
