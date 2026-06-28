import re
from resume_rag.schemas import SearchResult


def _extract_signal(results: list[SearchResult], limit: int) -> list[str]:
    if not results:
        return ["No resume evidence has been indexed yet."]
    strengths: list[str] = []
    for result in results[:limit]:
        text = " ".join(result.chunk.text.split())
        strengths.append(text[:180])
    return strengths


def _extract_gaps(job_description: str, results: list[SearchResult]) -> list[str]:
    evidence = " ".join(result.chunk.text.lower() for result in results)
    desired = _keywords(job_description)
    missing = [keyword for keyword in desired if keyword not in evidence]
    if not missing:
        return ["No obvious keyword gaps found in the retrieved resume evidence."]
    return [f"Add concrete evidence for: {keyword}" for keyword in missing[:5]]


def _keyword_coverage(job_description: str, evidence: str) -> float:
    desired = _keywords(job_description)
    if not desired:
        return 0.5
    evidence_lower = evidence.lower()
    matched = sum(1 for keyword in desired if keyword in evidence_lower)
    return matched / len(desired)


def _keywords(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", text.lower())
    stopwords = {
        "and",
        "the",
        "for",
        "with",
        "that",
        "you",
        "are",
        "will",
        "have",
        "from",
        "this",
        "role",
        "team",
        "work",
        "build",
        "using",
    }
    ranked = []
    for token in tokens:
        if token not in stopwords and token not in ranked:
            ranked.append(token)
    return ranked[:24]
