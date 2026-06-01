from __future__ import annotations

from pathlib import Path
from uuid import uuid4

import streamlit as st

from resume_rag.config import Settings
from resume_rag.documents import load_document
from resume_rag.embeddings import build_embedding_model
from resume_rag.llm import build_answer_generator
from resume_rag.rag import ResumeRagService
from resume_rag.schemas import DocumentIn
from resume_rag.vector_store import JsonVectorStore

APP_DIR = Path(__file__).parent
INDEX_PATH = APP_DIR / "data" / "index" / "streamlit_vector_store.json"

DEFAULT_JOB_DESCRIPTION = """Paste a target job description here.

Example focus areas:
- Python backend engineering
- FastAPI or REST API design
- RAG pipelines, vector embeddings, document retrieval, and LLM evaluation
- Docker, observability, cloud deployment, and production-quality testing
"""


st.set_page_config(
    page_title="Resume RAG Command Center",
    page_icon="",
    layout="wide",
    initial_sidebar_state="collapsed",
)


def inject_css() -> None:
    st.markdown(
        """
        <style>
        :root {
          --ink: #f6f0e8;
          --muted: #b9b0a5;
          --panel: rgba(33, 35, 32, 0.86);
          --panel-hi: rgba(74, 76, 69, 0.82);
          --line: rgba(255, 246, 230, 0.22);
          --gold: #d4962e;
          --red: #d1494d;
          --green: #5baa28;
        }

        .stApp {
          color: var(--ink);
          background:
            radial-gradient(circle at 12% 10%, rgba(215, 156, 51, .20), transparent 30%),
            radial-gradient(circle at 90% 3%, rgba(130, 184, 72, .13), transparent 28%),
            linear-gradient(145deg, #050505 0%, #111210 45%, #070807 100%);
        }

        .block-container {
          max-width: 1480px;
          padding-top: 1.4rem;
          padding-bottom: 3rem;
        }

        header[data-testid="stHeader"] {
          background: transparent;
        }

        h1, h2, h3, p, label, span, div {
          letter-spacing: 0;
        }

        .hero-shell {
          position: relative;
          padding: 26px 30px 22px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 22px;
          background:
            linear-gradient(155deg, rgba(61,63,57,.94), rgba(26,27,25,.94)),
            repeating-linear-gradient(90deg, rgba(255,255,255,.02) 0 1px, transparent 1px 7px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.26),
            inset 0 -18px 40px rgba(0,0,0,.22),
            0 26px 80px rgba(0,0,0,.42);
          overflow: hidden;
          animation: riseIn .65s cubic-bezier(.2,.8,.2,1) both;
        }

        .hero-shell:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              110deg,
              transparent 0%,
              rgba(255,255,255,.12) 42%,
              transparent 58%
            );
          transform: translateX(-120%);
          animation: scan 5.5s ease-in-out infinite;
          pointer-events: none;
        }

        .hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1.4fr .6fr;
          gap: 18px;
          align-items: end;
        }

        .title {
          margin: 0;
          font-size: clamp(2.1rem, 5vw, 4.8rem);
          line-height: .94;
          font-weight: 950;
          color: var(--ink);
          text-shadow: 0 2px 0 rgba(0,0,0,.52), 0 18px 42px rgba(0,0,0,.5);
        }

        .subtitle {
          margin-top: 12px;
          color: var(--muted);
          font-size: 1.08rem;
          font-weight: 700;
        }

        .live-chip {
          justify-self: end;
          width: fit-content;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.24);
          color: #eff7e9;
          background: linear-gradient(145deg, rgba(61,93,36,.94), rgba(27,45,19,.94));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 16px 38px rgba(0,0,0,.36);
          font-weight: 850;
          animation: breathe 2.8s ease-in-out infinite;
        }

        .metric-card, .command-card, .source-card {
          border: 1px solid var(--line);
          border-radius: 18px;
          background: linear-gradient(145deg, var(--panel-hi), var(--panel));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.18),
            inset 0 -12px 26px rgba(0,0,0,.22),
            0 18px 44px rgba(0,0,0,.28);
          transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
          animation: riseIn .6s cubic-bezier(.2,.8,.2,1) both;
        }

        .metric-card:hover, .command-card:hover, .source-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 232, 190, .42);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.22),
            inset 0 -12px 26px rgba(0,0,0,.20),
            0 28px 64px rgba(0,0,0,.38);
        }

        .metric-card {
          min-height: 132px;
          padding: 20px 22px;
        }

        .metric-label {
          color: var(--muted);
          font-size: .92rem;
          font-weight: 800;
        }

        .metric-value {
          margin-top: 10px;
          color: var(--ink);
          font-size: 2.1rem;
          line-height: 1;
          font-weight: 950;
        }

        .metric-foot {
          margin-top: 8px;
          color: var(--muted);
          font-weight: 700;
        }

        .red { color: var(--red); }
        .gold { color: var(--gold); }
        .green { color: var(--green); }

        .command-card {
          padding: 22px;
          min-height: 100%;
        }

        .section-title {
          font-size: 1.22rem;
          font-weight: 950;
          color: var(--ink);
          margin-bottom: 10px;
        }

        .answer-box {
          white-space: pre-wrap;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(0,0,0,.24);
          color: #eee9df;
          font-weight: 650;
          line-height: 1.55;
        }

        .source-card {
          padding: 16px 18px;
          margin: 12px 0;
        }

        .score-ring {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          margin: 8px auto 18px;
          background:
            radial-gradient(circle at center, #272822 0 57%, transparent 58%),
            conic-gradient(var(--green) var(--score), rgba(255,255,255,.12) 0);
          box-shadow: inset 0 3px 12px rgba(0,0,0,.42), 0 18px 48px rgba(0,0,0,.34);
        }

        .score-ring span {
          font-size: 2.3rem;
          font-weight: 950;
        }

        .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.18);
          color: #eee7dd;
          font-weight: 750;
        }

        div[data-testid="stTextInput"] input,
        div[data-testid="stTextArea"] textarea,
        div[data-testid="stFileUploader"] section {
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.22);
          background: rgba(6,7,6,.55);
          color: var(--ink);
          box-shadow: inset 0 2px 10px rgba(0,0,0,.34);
        }

        .stButton > button,
        .stDownloadButton > button {
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.24);
          color: #fff7ed;
          background: linear-gradient(145deg, #d49b3a, #875314);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 14px 28px rgba(0,0,0,.28);
          font-weight: 950;
          transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
        }

        .stButton > button:hover,
        .stDownloadButton > button:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.42), 0 22px 38px rgba(0,0,0,.34);
        }

        div[data-testid="stTabs"] button {
          border-radius: 14px 14px 0 0;
          font-weight: 900;
        }

        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(91,170,40,0); }
          50% { transform: scale(1.025); box-shadow: 0 0 32px rgba(91,170,40,.24); }
        }

        @keyframes scan {
          0%, 58% { transform: translateX(-120%); }
          80%, 100% { transform: translateX(120%); }
        }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; }
          .live-chip { justify-self: start; }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


@st.cache_resource(show_spinner=False)
def get_dashboard_service() -> ResumeRagService:
    settings = Settings(index_path=INDEX_PATH)
    return ResumeRagService(
        settings=settings,
        embedding_model=build_embedding_model(settings),
        answer_generator=build_answer_generator(settings),
        vector_store=JsonVectorStore(settings.index_path),
    )


def render_metric(label: str, value: str, foot: str, color_class: str = "") -> None:
    st.markdown(
        f"""
        <div class="metric-card">
          <div class="metric-label">{label}</div>
          <div class="metric-value {color_class}">{value}</div>
          <div class="metric-foot">{foot}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def ingest_uploaded_file(service: ResumeRagService, uploaded_file, doc_type: str) -> None:
    suffix = Path(uploaded_file.name).suffix.lower()
    raw = uploaded_file.getvalue()
    if suffix == ".pdf":
        temp_dir = APP_DIR / "data" / "uploads"
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_path = temp_dir / f"{uuid4()}-{uploaded_file.name}"
        temp_path.write_bytes(raw)
        document = load_document(temp_path, doc_type=doc_type)
    else:
        document = DocumentIn(
            text=raw.decode("utf-8", errors="ignore"),
            source=uploaded_file.name,
            doc_type=doc_type,
            metadata={"file_name": uploaded_file.name, "document_id": str(uuid4())},
        )
    response = service.ingest(document)
    st.success(f"Indexed {response.chunks_added} chunks from {uploaded_file.name}.")


def render_sources(sources) -> None:
    for source in sources:
        st.markdown(
            f"""
            <div class="source-card">
              <strong>{source.source}</strong>
              <span class="pill">{source.doc_type}</span>
              <span class="pill">score {source.score:.3f}</span>
              <p>{source.text[:520]}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )


def main() -> None:
    inject_css()
    service = get_dashboard_service()

    st.markdown(
        """
        <div class="hero-shell">
          <div class="hero-grid">
            <div>
              <h1 class="title">Amogh Samadhiya<br/>Job Command Center</h1>
              <div class="subtitle">
                Resume analysed - live RAG evidence - AI roles - ATS gaps - outreach intelligence
              </div>
            </div>
            <div class="live-chip">LIVE INDEX ONLINE</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.write("")
    col_a, col_b, col_c, col_d = st.columns(4)
    with col_a:
        render_metric("Indexed chunks", str(service.vector_store.count), "local vector memory")
    with col_b:
        render_metric("Biggest gap", "LLM/RAG", "closed by this project", "red")
    with col_c:
        render_metric("Signal boost", "+8 ATS", "LangChain, RAG, eval", "green")
    with col_d:
        render_metric("Demo mode", "No key", "OpenAI optional", "gold")

    st.write("")
    tab_ingest, tab_ask, tab_match, tab_plan = st.tabs(
        ["Ingest", "Ask Resume", "Role Match", "30-Day Plan"]
    )

    with tab_ingest:
        left, right = st.columns([.92, 1.08], gap="large")
        with left:
            st.markdown('<div class="command-card">', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Document Intake</div>', unsafe_allow_html=True)
            uploaded_file = st.file_uploader(
                "Upload resume, portfolio, or job description",
                type=["pdf", "md", "txt"],
            )
            doc_type = st.segmented_control(
                "Document type",
                ["resume", "job", "portfolio", "general"],
                default="resume",
            )
            ingest_clicked = st.button("Index document", use_container_width=True)
            if ingest_clicked:
                if uploaded_file is None:
                    st.warning("Upload a document first.")
                else:
                    ingest_uploaded_file(service, uploaded_file, doc_type)
                    st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)
        with right:
            st.markdown('<div class="command-card">', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Indexed Sources</div>', unsafe_allow_html=True)
            sources = service.sources()
            if not sources:
                st.info("No documents indexed yet. Upload your resume or portfolio to begin.")
            for source in sources:
                st.markdown(
                    f'<span class="pill">{source["doc_type"]}</span> {source["source"]}',
                    unsafe_allow_html=True,
                )
            st.markdown("</div>", unsafe_allow_html=True)

    with tab_ask:
        left, right = st.columns([.9, 1.1], gap="large")
        with left:
            st.markdown('<div class="command-card">', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Grounded Q&A</div>', unsafe_allow_html=True)
            question = st.text_area(
                "Ask about resume evidence",
                value="What evidence proves Amogh can build production RAG systems?",
                height=130,
            )
            top_k = st.slider("Evidence depth", min_value=2, max_value=10, value=5)
            ask_clicked = st.button("Retrieve answer", use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)
        with right:
            if ask_clicked:
                with st.spinner("Retrieving evidence and composing grounded answer..."):
                    response = service.query(question, top_k=top_k)
                st.markdown('<div class="answer-box">', unsafe_allow_html=True)
                st.write(response.answer)
                st.markdown("</div>", unsafe_allow_html=True)
                render_sources(response.sources)
            else:
                st.markdown(
                    (
                        '<div class="answer-box">'
                        "Ask a question to see cited resume evidence here."
                        "</div>"
                    ),
                    unsafe_allow_html=True,
                )

    with tab_match:
        left, right = st.columns([.9, 1.1], gap="large")
        with left:
            st.markdown('<div class="command-card">', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Role Fit Engine</div>', unsafe_allow_html=True)
            role_title = st.text_input("Role title", value="AI Engineering Intern")
            jd = st.text_area(
                "Job description",
                value=DEFAULT_JOB_DESCRIPTION,
                height=260,
            )
            match_clicked = st.button("Score role match", use_container_width=True)
            st.markdown("</div>", unsafe_allow_html=True)
        with right:
            if match_clicked:
                with st.spinner("Comparing role requirements against resume evidence..."):
                    match = service.match_role(role_title, jd, top_k=8)
                strength_pills = "".join(
                    f'<span class="pill">{item[:95]}</span>' for item in match.strengths
                )
                gap_pills = "".join(f'<span class="pill">{item}</span>' for item in match.gaps)
                st.markdown(
                    f"""
                    <div class="command-card">
                      <div class="section-title">Match Score</div>
                      <div class="score-ring" style="--score: {match.match_score}%;">
                        <span>{match.match_score}</span>
                      </div>
                      <div class="section-title">Strengths</div>
                      <div class="pill-row">
                        {strength_pills}
                      </div>
                      <div class="section-title" style="margin-top:18px;">Gaps</div>
                      <div class="pill-row">
                        {gap_pills}
                      </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                render_sources(match.evidence)
            else:
                st.markdown(
                    (
                        '<div class="answer-box">'
                        "Run a role match to see score, strengths, and gaps."
                        "</div>"
                    ),
                    unsafe_allow_html=True,
                )

    with tab_plan:
        st.markdown('<div class="command-card">', unsafe_allow_html=True)
        st.markdown(
            '<div class="section-title">Skill Gap Roadmap - Ordered by ROI</div>',
            unsafe_allow_html=True,
        )
        plan_items = [
            (
                "gap 1",
                "LLM/RAG engineering",
                "Ship this dashboard, add FAISS or pgvector, and record a 90-second demo.",
            ),
            (
                "gap 2",
                "DSA depth",
                "150 focused LeetCode problems across trees, graphs, DP, and binary search.",
            ),
            (
                "gap 3",
                "System design",
                "Prepare 10 designs: rate limiter, URL shortener, cache, search, feature store.",
            ),
            (
                "quick",
                "ATS keywords",
                "Add LangChain, RAG pipelines, vector embeddings, LLM evaluation, OpenTelemetry.",
            ),
        ]
        for badge, title, body in plan_items:
            st.markdown(
                f"""
                <div class="source-card">
                  <span class="pill">{badge}</span>
                  <strong style="font-size:1.1rem;">{title}</strong>
                  <p>{body}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)


if __name__ == "__main__":
    main()
