from app.core.idempotency import IdempotentRoute
import json
import os

@router.get("/health")
def health(settings: SettingsDep, service: ServiceDep) -> dict[str, str | int]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "indexed_chunks": service.vector_store.count,
    }


@router.post("/documents", response_model=IngestResponse)
@limiter.limit("10/minute")
def ingest_document(request: Request, document: DocumentIn, service: ServiceDep, auth: GuestAuthDep) -> IngestResponse:
    return service.ingest(document)


@router.get("/documents")
def list_documents(service: ServiceDep, auth: GuestAuthDep) -> list[dict[str, str]]:
    return service.sources()


@router.delete("/documents/{source}")
def delete_document(source: str, service: ServiceDep, auth: GuestAuthDep) -> dict[str, str | int]:
    deleted_count = service.delete_source(source)
    return {
        "status": "deleted",
        "source": source,
        "chunks_removed": deleted_count,
    }


@router.post("/query", response_model=QueryResponse)
def query(request: QueryRequest, service: ServiceDep, auth: GuestAuthDep) -> QueryResponse:
    return service.query(request.question, top_k=request.top_k, filters=request.filters)


@router.post("/query/stream")
@limiter.limit("10/minute")
def query_stream(request: Request, body: QueryRequest, service: ServiceDep, auth: GuestAuthDep) -> StreamingResponse:
    sources, token_stream = service.query_stream(
        body.question, top_k=body.top_k, filters=body.filters
    )

    def generator():
        sources_list = [source.model_dump() for source in sources]
        yield f"data: {json.dumps({'sources': sources_list})}\n\n"
        for token in token_stream:
            yield f"data: {json.dumps({'token': token})}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")


@router.post("/match", response_model=MatchResponse)
def match_role(request: MatchRequest, service: ServiceDep, auth: GuestAuthDep) -> MatchResponse:
    return service.match_role(
        role_title=request.role_title,
        job_description=request.job_description,
        top_k=request.top_k,
        source_doc=request.source_doc,
    )


@router.post("/analyze/resume", response_model=ResumeAnalyzeResponse)
def analyze_resume(
    request: ResumeAnalyzeRequest,
    service: ServiceDep,
    auth: GuestAuthDep,
    x_openai_key: str | None = Header(default=None),
) -> ResumeAnalyzeResponse:
    api_key = request.openai_key or x_openai_key
    analysis = service.analyze_resume(request.text, api_key)
    return ResumeAnalyzeResponse(profile=analysis["profile"], scoring=analysis["scoring"])

@router.post("/upload/resume")
@limiter.limit("10/minute")
async def upload_resume_endpoint(request: Request, auth: GuestAuthDep, file: UploadFile = File(...)): # noqa: B008
    try:
        content = await file.read()
        text = parse_document(content, file.filename)
        if not text.strip():
            raise ValueError("No extractable text found.")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

@router.post("/analyze/match", response_model=list[MatchedJob])
@limiter.limit("5/minute")
def match_jobs(request: Request, body: AtsMatchRequest, service: ServiceDep, auth: GuestAuthDep) -> list[MatchedJob]:
    return service.match_jobs(body.profile.model_dump(), body.top_k or 10)


@router.post("/analyze/upgrade", response_model=UpgradeResponse)
def upgrade_skills(request: UpgradeRequest, service: ServiceDep, auth: GuestAuthDep) -> UpgradeResponse:
    new_scores = service.upgrade_skills(request.profile.model_dump(), request.learned_skills)
    return UpgradeResponse(new_scores=new_scores)


@router.post("/analyze/interview", response_model=InterviewResponse)
def generate_interview(
    request: InterviewRequest,
    service: ServiceDep,
    auth: GuestAuthDep,
    x_openai_key: str | None = Header(default=None),
) -> InterviewResponse:
    questions = service.generate_interview_prep(
        request.job_id,
        request.profile.model_dump(),
        x_openai_key,
    )
    return InterviewResponse(questions=questions)


@router.post("/jobs/seed")
def seed_jobs_endpoint(service: ServiceDep, auth: GuestAuthDep) -> dict[str, str | int]:
    count = seed_jobs(service.vector_store, service.embedding_model)
    return {
        "status": "seeded",
        "count": count
    }
