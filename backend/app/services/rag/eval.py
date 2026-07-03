from dataclasses import dataclass

from app.rag.rag import ResumeRagService


@dataclass(frozen=True)
class EvalCase:
    question: str
    expected_terms: list[str]


def run_retrieval_eval(service: ResumeRagService, cases: list[EvalCase]) -> dict[str, float]:
    if not cases:
        return {"recall_at_k": 0.0}

    hits = 0
    for case in cases:
        response = service.query(case.question)
        context = " ".join(source.text.lower() for source in response.sources)
        if any(term.lower() in context for term in case.expected_terms):
            hits += 1
    return {"recall_at_k": hits / len(cases)}
