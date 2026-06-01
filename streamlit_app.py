from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

import streamlit as st

# ---------------------------------------------------------
# Dynamic Zero-State RAG Backend Mock
# ---------------------------------------------------------
class DocumentIn:
    def __init__(self, text: str, source: str, doc_type: str):
        self.text = text
        self.source = source
        self.doc_type = doc_type

class DocumentSource:
    def __init__(self, source: str, doc_type: str, score: float, text: str):
        self.source = source
        self.doc_type = doc_type
        self.score = score
        self.text = text

class RAGQueryResponse:
    def __init__(self, answer: str, sources: list[DocumentSource]):
        self.answer = answer
        self.sources = sources

class RoleMatchResponse:
    def __init__(self, match_score: int, strengths: list[str], gaps: list[str], evidence: list[DocumentSource]):
        self.match_score = match_score
        self.strengths = strengths
        self.gaps = gaps
        self.evidence = evidence

class SaaSIntelligenceEngine:
    """A zero-state backend that only responds to uploaded document payloads."""
    def __init__(self):
        if "vector_db" not in st.session_state:
            st.session_state.vector_db = []

    def count(self) -> int:
        return len(st.session_state.vector_db)

    def sources(self) -> list[dict]:
        return st.session_state.vector_db

    def ingest(self, doc: DocumentIn) -> dict:
        # Simulate processing the specific uploaded document
        chunks = max(12, len(doc.text) // 250)
        st.session_state.vector_db.append({
            "id": str(uuid4())[:8],
            "source": doc.source,
            "doc_type": doc.doc_type,
            "chunks": chunks
        })
        return {"chunks_added": chunks}

    def query(self, text: str, top_k: int = 5) -> RAGQueryResponse:
        if not st.session_state.vector_db:
            raise ValueError("Empty Vector Index")
        
        primary_doc = st.session_state.vector_db[-1]["source"]
        ans = f"Based on the analysis of **{primary_doc}**, the system has extracted relevant semantic clusters matching your query parameters. The artifact demonstrates concrete evidence aligning with the requested domain, mapped across high-density vector chunks."
        srcs = [
            DocumentSource(doc["source"], doc["doc_type"], 0.92 - (i * 0.04), f"Extracted semantic chunk from {doc['source']} aligning with query space.")
            for i, doc in enumerate(reversed(st.session_state.vector_db))
        ][:top_k]
        return RAGQueryResponse(ans, srcs)

    def match_role(self, jd: str) -> RoleMatchResponse:
        if not st.session_state.vector_db:
            raise ValueError("Empty Vector Index")
            
        primary_doc = st.session_state.vector_db[-1]["source"]
        score = 82  
        strengths = [f"Direct alignment found in {primary_doc}", "Semantic overlap with Core Requirements", "Experience metrics verified"]
        gaps = ["Missing explicit timeline data", "Secondary domain expertise lacks depth"]
        evs = [DocumentSource(primary_doc, "artifact", 0.88, "Relevant compliance block extracted.")]
        
        return RoleMatchResponse(score, strengths, gaps, evs)

st.set_page_config(page_title="Intelligence Engine", layout="wide", initial_sidebar_state="collapsed")

if "theme" not in st.session_state:
    st.session_state.theme = "dark"
if "chunk_size" not in st.session_state:
    st.session_state.chunk_size = 512
if "chunk_overlap" not in st.session_state:
    st.session_state.chunk_overlap = 64

def inject_premium_css(theme: str) -> None:
    # Hyper-smooth cinematic and spring curves
    ease_cinematic = "cubic-bezier(0.19, 1, 0.22, 1)"
    ease_spring = "cubic-bezier(0.175, 0.885, 0.32, 1.1)"
    ease_liquid = "cubic-bezier(0.4, 0, 0.2, 1)"

    if theme == "dark":
        bg_base = "#030305"
        bg_radial = "radial-gradient(circle at 50% 0%, #11111a 0%, #030305 100%)"
        surface = "rgba(18, 18, 22, 0.45)"
        surface_hover = "rgba(255, 255, 255, 0.05)"
        border = "rgba(255, 255, 255, 0.08)"
        border_hover = "rgba(255, 255, 255, 0.25)"
        shadow = "0 24px 48px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        text_main = "#f4f4f5"
        text_muted = "#8a8a93"
        accent = "#38bdf8"
        icon_svg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23f4f4f5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3Cline x1='12' y1='2' x2='12' y2='4'/%3E%3Cline x1='12' y1='20' x2='12' y2='22'/%3E%3Cline x1='4.93' y1='4.93' x2='6.34' y2='6.34'/%3E%3Cline x1='17.66' y1='17.66' x2='19.07' y2='19.07'/%3E%3Cline x1='2' y1='12' x2='4' y2='12'/%3E%3Cline x1='20' y1='12' x2='22' y2='12'/%3E%3Cline x1='4.93' y1='19.07' x2='6.34' y2='17.66'/%3E%3Cline x1='17.66' y1='6.34' x2='19.07' y2='4.93'/%3E%3C/svg%3E\")"
    else:
        bg_base = "#f7f7f9"
        bg_radial = "radial-gradient(circle at 50% 0%, #ffffff 0%, #ececf1 100%)"
        surface = "rgba(255, 255, 255, 0.65)"
        surface_hover = "rgba(0, 0, 0, 0.03)"
        border = "rgba(0, 0, 0, 0.08)"
        border_hover = "rgba(0, 0, 0, 0.25)"
        shadow = "0 24px 48px -12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)"
        text_main = "#111112"
        text_muted = "#6b6b72"
        accent = "#0284c7"
        icon_svg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23111112' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/%3E%3C/svg%3E\")"

    css = f"""
    <style>
    :root {{
        --bg-base: {bg_base};
        --bg-radial: {bg_radial};
        --surface: {surface};
        --surface-hover: {surface_hover};
        --border: {border};
        --border-hover: {border_hover};
        --shadow: {shadow};
        --text-main: {text_main};
        --text-muted: {text_muted};
        --accent: {accent};
        --icon-svg: {icon_svg};
        --ease-cinematic: {ease_cinematic};
        --ease-spring: {ease_spring};
        --ease-liquid: {ease_liquid};
    }}

    .stApp {{
        background-color: var(--bg-base);
        background-image: var(--bg-radial);
        background-attachment: fixed;
        color: var(--text-main);
        font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-font-smoothing: antialiased;
    }}

    header[data-testid="stHeader"], footer {{ display: none !important; }}
    
    .block-container {{
        padding-top: 1rem !important;
        padding-bottom: 6rem !important;
        max-width: 1050px !important;
    }}

    @keyframes blur-reveal {{
        0% {{ opacity: 0; transform: translateY(20px) scale(0.98); filter: blur(12px); }}
        100% {{ opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }}
    }}

    /* Global Typography */
    .h1-main {{
        font-size: clamp(3rem, 6vw, 4.5rem);
        font-weight: 800;
        letter-spacing: -0.04em;
        line-height: 1.05;
        margin-bottom: 1.5rem;
        color: var(--text-main);
        text-align: center;
        animation: blur-reveal 1.2s var(--ease-cinematic) both;
    }}
    .h-sub {{
        font-size: 1.1rem;
        font-weight: 400;
        color: var(--text-muted);
        margin: 0 auto 3.5rem auto;
        max-width: 650px;
        line-height: 1.6;
        text-align: center;
        animation: blur-reveal 1.2s var(--ease-cinematic) both;
        animation-delay: 0.15s;
    }}

    /* Top Navigation & Liquid Toggle */
    .top-nav {{
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 1rem;
        padding: 1rem 0;
        position: sticky;
        top: 0;
        z-index: 100;
    }}
    
    .theme-toggle-btn {{
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--surface);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.5s var(--ease-spring);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }}
    .theme-toggle-btn:hover {{
        transform: scale(1.15) translateY(-2px);
        background: var(--surface-hover);
        border-color: var(--border-hover);
        box-shadow: 0 12px 24px rgba(0,0,0,0.2), inset 0 0 12px rgba(255,255,255,0.1);
    }}
    .theme-toggle-btn:active {{
        transform: scale(0.95);
        filter: brightness(1.2);
    }}
    .theme-toggle-btn [data-testid="stButton"] button {{
        position: absolute !important; inset: 0 !important; opacity: 0 !important; cursor: pointer !important; width: 100% !important; height: 100% !important;
    }}
    .theme-toggle-btn::after {{
        content: ''; position: absolute; width: 18px; height: 18px;
        background-image: var(--icon-svg); background-size: contain; background-repeat: no-repeat; background-position: center;
        transition: transform 0.8s var(--ease-spring); pointer-events: none;
    }}
    .theme-toggle-btn:hover::after {{ transform: rotate(90deg) scale(1.1); }}

    /* SaaS Routing Tabs */
    div[data-testid="stTabs"] {{ display: flex; flex-direction: column; align-items: center; width: 100%; }}
    div[data-baseweb="tab-list"] {{
        gap: 6px !important;
        padding: 6px !important;
        background: var(--surface) !important;
        backdrop-filter: blur(32px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(32px) saturate(200%) !important;
        border: 1px solid var(--border) !important;
        border-radius: 999px !important;
        margin-bottom: 4rem !important;
        display: inline-flex !important;
        box-shadow: var(--shadow) !important;
        animation: blur-reveal 1.2s var(--ease-cinematic) both;
        animation-delay: 0.3s;
    }}
    div[data-testid="stTabs"] button {{
        background: transparent !important;
        border: 1px solid transparent !important;
        color: var(--text-muted) !important;
        font-weight: 600 !important;
        font-size: 0.85rem !important;
        padding: 10px 24px !important;
        border-radius: 999px !important;
        transition: all 0.4s var(--ease-liquid) !important;
    }}
    div[data-testid="stTabs"] button:hover:not([aria-selected="true"]) {{
        color: var(--text-main) !important;
        background: var(--surface-hover) !important;
    }}
    div[data-testid="stTabs"] button[aria-selected="true"] {{
        color: var(--bg-base) !important;
        background: var(--text-main) !important;
        box-shadow: 0 4px 16px rgba(255,255,255,0.1) !important;
    }}
    div[data-testid="stTabs"] > div[role="tabpanel"] {{
        width: 100%;
        animation: blur-reveal 0.8s var(--ease-cinematic) both;
    }}

    /* =========================================================
       DOM HIJACKING: THE TRUE GLASSMORPHISM CARD HACK
       ========================================================= */
    /* Target the exact internal wrapper of columns to make them seamless cards */
    div[data-testid="stHorizontalBlock"] > div[data-testid="column"] > div[data-testid="stVerticalBlock"] {{
        background: var(--surface) !important;
        backdrop-filter: blur(40px) saturate(200%) !important;
        -webkit-backdrop-filter: blur(40px) saturate(200%) !important;
        border: 1px solid var(--border) !important;
        border-radius: 20px !important;
        padding: 2.5rem !important;
        box-shadow: var(--shadow) !important;
        transition: all 0.5s var(--ease-spring) !important;
        height: 100%;
        position: relative;
        overflow: hidden;
    }}
    
    div[data-testid="stHorizontalBlock"] > div[data-testid="column"] > div[data-testid="stVerticalBlock"]:hover {{
        border-color: var(--border-hover) !important;
        transform: translateY(-4px) scale(1.01) !important;
        box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.9) !important;
    }}

    /* Card Content Styling */
    .card-label {{
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: var(--accent);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }}
    .card-title {{
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text-main);
        margin-bottom: 12px;
        letter-spacing: -0.02em;
    }}
    .card-desc {{
        font-size: 0.95rem;
        color: var(--text-muted);
        line-height: 1.6;
        margin-bottom: 24px;
    }}

    /* Streamlit Overrides */
    div[data-testid="stTextInput"] input,
    div[data-testid="stTextArea"] textarea,
    div[data-testid="stFileUploader"] section {{
        background: rgba(0,0,0,0.15) !important;
        border: 1px solid var(--border) !important;
        color: var(--text-main) !important;
        border-radius: 12px !important;
        padding: 16px !important;
        font-size: 0.95rem !important;
        transition: all 0.4s var(--ease-liquid) !important;
    }}
    div[data-testid="stTextInput"] input:focus,
    div[data-testid="stTextArea"] textarea:focus {{
        border-color: var(--accent) !important;
        background: rgba(0,0,0,0.3) !important;
        box-shadow: 0 0 0 1px var(--accent) !important;
    }}
    
    .stButton > button {{
        background: var(--text-main) !important;
        color: var(--bg-base) !important;
        border: none !important;
        border-radius: 12px !important;
        font-weight: 700 !important;
        font-size: 0.9rem !important;
        letter-spacing: 0.02em !important;
        padding: 0.8rem 1.5rem !important;
        transition: all 0.4s var(--ease-spring) !important;
        width: 100% !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
    }}
    .stButton > button:hover {{
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 16px 32px rgba(255,255,255,0.1) !important;
    }}

    /* Settings Expander */
    div[data-testid="stExpander"] {{
        background: var(--surface); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 2rem;
        backdrop-filter: blur(20px); box-shadow: var(--shadow);
    }}
    div[data-testid="stExpander"] summary {{ color: var(--text-main) !important; font-weight: 600 !important; padding: 16px 20px !important; }}
    
    /* Architecture Graph Node Styling */
    .arch-node {{
        padding: 16px;
        background: var(--surface-hover);
        border: 1px solid var(--border);
        border-radius: 12px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease;
    }}
    .arch-node:hover {{
        border-color: var(--accent);
        transform: translateX(4px);
    }}
    .arch-node-title {{ font-weight: 700; color: var(--text-main); font-size: 0.95rem; }}
    .arch-node-tech {{ font-size: 0.75rem; color: var(--accent); font-weight: 800; letter-spacing: 0.1em; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 99px; }}

    .sys-pill {{
        padding: 6px 14px; border-radius: 99px; background: var(--surface-hover); border: 1px solid var(--border);
        font-size: 0.8rem; font-weight: 600; color: var(--text-main); display: inline-block; margin: 4px;
    }}
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)

def inject_interactive_bg() -> None:
    # Organic, liquid bezier curve background with spring physics
    js = """
    <canvas id="kinetic-bg" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none;"></canvas>
    <script>
    (function() {
        const canvas = document.getElementById('kinetic-bg');
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
        
        const isDark = document.body.classList.contains('dark') || window.getComputedStyle(document.body).backgroundColor !== 'rgb(250, 250, 250)';
        const color = isDark ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,'; 

        const nodes = [];
        const symbols = ['+', '-', '*', '/', 'Σ', 'λ', '∫', 'μ', 'f(x)', '∇'];
        for (let i = 0; i < 45; i++) {
            nodes.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 2 + 1, char: Math.random() > 0.65 ? symbols[Math.floor(Math.random() * symbols.length)] : null,
                alpha: Math.random() * 0.15 + 0.05
            });
        }

        let mouse = { x: -1000, y: -1000, r: 160 };
        window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('mouseout', () => { mouse.x = -1000; mouse.y = -1000; });

        function draw() {
            ctx.clearRect(0, 0, w, h);
            
            nodes.forEach((n, i) => {
                n.x += n.vx; n.y += n.vy;
                if(n.x < 0) n.x = w; if(n.x > w) n.x = 0;
                if(n.y < 0) n.y = h; if(n.y > h) n.y = 0;

                // Liquid Magnetic Spring Physics
                const dx = mouse.x - n.x, dy = mouse.y - n.y, dist = Math.hypot(dx, dy);
                if (dist < mouse.r) {
                    const force = (mouse.r - dist) / mouse.r;
                    n.x -= (dx / dist) * force * 1.8; 
                    n.y -= (dy / dist) * force * 1.8;
                }

                // Bezier Curve Connections (Organic Liquid Look)
                for (let j = i + 1; j < nodes.length; j++) {
                    const d = Math.hypot(n.x - nodes[j].x, n.y - nodes[j].y);
                    if (d < 110) {
                        ctx.beginPath(); 
                        ctx.strokeStyle = color + (0.1 - d/1100) + ')';
                        ctx.lineWidth = 0.6; 
                        ctx.moveTo(n.x, n.y); 
                        // Control points for bezier fluid connections
                        ctx.bezierCurveTo(n.x + (nodes[j].x - n.x)/2, n.y, nodes[j].x - (nodes[j].x - n.x)/2, nodes[j].y, nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }

                ctx.fillStyle = color + n.alpha + ')';
                if (n.char) {
                    ctx.font = '11px "Inter"'; ctx.fillText(n.char, n.x, n.y);
                } else {
                    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
                }
            });
            requestAnimationFrame(draw);
        }
        draw();
    })();
    </script>
    """
    st.markdown(js, unsafe_allow_html=True)

def main() -> None:
    inject_premium_css(st.session_state.theme)
    inject_interactive_bg()
    service = SaaSIntelligenceEngine()

    # --- TOP NAV (Floating Toggle) ---
    st.markdown('<div class="top-nav"><div class="theme-toggle-btn" title="Toggle Theme">', unsafe_allow_html=True)
    if st.button(" ", key="theme_sw"):
        st.session_state.theme = "light" if st.session_state.theme == "dark" else "dark"
        st.rerun()
    st.markdown('</div></div>', unsafe_allow_html=True)

    # --- HERO ---
    st.markdown('<div class="h1-main">Intelligence Engine</div>', unsafe_allow_html=True)
    st.markdown('<div class="h-sub">Upload an artifact payload to extract semantic context, calculate vector embeddings, and map objective framework alignments.</div>', unsafe_allow_html=True)

    # --- WEBPAGE ROUTING ---
    tab_ingest, tab_ask, tab_match, tab_arch = st.tabs(["DATA INGESTION", "SEMANTIC SEARCH", "ROLE ALIGNMENT", "ENGINE ARCHITECTURE"])

    with tab_ingest:
        c1, c2 = st.columns([1, 1], gap="large")
        # Column 1 - Replaces broken HTML with perfect Streamlit Column DOM hijacking
        with c1:
            st.markdown('<div class="card-label">Input Stream</div><div class="card-title">Upload Artifacts</div><div class="card-desc">Inject raw document schemas into the vector memory graph for semantic analysis.</div>', unsafe_allow_html=True)
            uploaded_file = st.file_uploader("", type=["pdf", "md", "txt", "csv"], label_visibility="collapsed")
            if st.button("EXECUTE EMBEDDING"):
                if uploaded_file is None:
                    st.warning("Payload required to initialize pipeline.")
                else:
                    doc = DocumentIn(text=uploaded_file.getvalue().decode("utf-8", errors="ignore"), source=uploaded_file.name, doc_type="artifact")
                    res = service.ingest(doc)
                    st.success(f"Synthesized and indexed {res['chunks_added']} multidimensional blocks.")
            
        with c2:
            count = service.count()
            st.markdown(f'<div class="card-label">Database Telemetry</div><div class="card-title">Indexed Nodes: <span style="color: var(--accent); font-size: 2rem; float: right; line-height: 0.5;">{count}</span></div><div class="card-desc">Current state of the local knowledge graph structure.</div>', unsafe_allow_html=True)
            
            if count == 0:
                st.markdown('<div style="text-align: center; padding: 2rem; border: 1px dashed var(--border); border-radius: 12px;"><span style="color: var(--text-muted); font-weight: 700; letter-spacing: 0.1em; font-size: 0.8rem;">INDEX EMPTY</span></div>', unsafe_allow_html=True)
            else:
                for source in service.sources():
                    st.markdown(f'<div style="padding: 14px; border: 1px solid var(--border); background: var(--surface-hover); border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;"><span style="font-size:0.9rem; font-weight: 600;">{source["source"]}</span><span class="sys-pill" style="margin:0;">{source["chunks"]} chunks</span></div>', unsafe_allow_html=True)

    with tab_ask:
        c1, c2 = st.columns([1, 1], gap="large")
        with c1:
            st.markdown('<div class="card-label">Contextual Query</div><div class="card-title">Interrogate Artifacts</div><div class="card-desc">Traverse the ingested vector memory using natural language algorithms.</div>', unsafe_allow_html=True)
            question = st.text_area("Query String", value="Summarize the core competencies and technical metrics extracted from the payload.", height=130, label_visibility="collapsed")
            ask_clicked = st.button("EXECUTE SEARCH")
            
        with c2:
            st.markdown('<div class="card-label">Output Synthesis</div><div class="card-title">Engine Response</div>', unsafe_allow_html=True)
            if ask_clicked:
                try:
                    response = service.query(question)
                    st.markdown(f"<div class='card-desc' style='color: var(--text-main); font-weight: 500;'>{response.answer}</div>", unsafe_allow_html=True)
                    for src in response.sources:
                        st.markdown(f'<div style="font-size:0.8rem; color:var(--text-muted); border-top: 1px solid var(--border); padding-top: 12px; margin-top: 12px;">↳ {src.source} <span style="float:right; color: var(--accent); font-weight: 600;">Score: {src.score:.2f}</span></div>', unsafe_allow_html=True)
                except ValueError:
                    st.markdown('<div style="text-align: center; padding: 2rem; border: 1px dashed var(--border); border-radius: 12px;"><span style="color: var(--text-muted); font-weight: 700; letter-spacing: 0.1em; font-size: 0.8rem;">AWAITING PAYLOAD</span></div>', unsafe_allow_html=True)
            else:
                st.markdown("<div class='card-desc'>Awaiting similarity traversal protocol.</div>", unsafe_allow_html=True)

    with tab_match:
        c1, c2 = st.columns([1, 1], gap="large")
        with c1:
            st.markdown('<div class="card-label">Validation Engine</div><div class="card-title">Role Framework</div><div class="card-desc">Define structural requirements to measure document compliance against.</div>', unsafe_allow_html=True)
            jd = st.text_area("Requirements", value="Example: Requires 5+ years of software engineering, system design, and API scaling experience.", height=150, label_visibility="collapsed")
            match_clicked = st.button("CALCULATE ALIGNMENT")
            
        with c2:
            st.markdown('<div class="card-label">Metrics Matrix</div><div class="card-title">Computed Proximity</div>', unsafe_allow_html=True)
            if match_clicked:
                try:
                    res = service.match_role(jd)
                    st.markdown(f"<div style='font-size: 4.5rem; font-weight: 800; color: var(--text-main); line-height: 1; margin-bottom: 1.5rem;'>{res.match_score}%</div>", unsafe_allow_html=True)
                    st.markdown("<div style='font-size: 0.8rem; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; color: var(--text-muted);'>Detected Alignments</div>", unsafe_allow_html=True)
                    st.markdown('<div>', unsafe_allow_html=True)
                    for s in res.strengths: st.markdown(f'<span class="sys-pill" style="border-color: rgba(16,185,129,0.4);">{s}</span>', unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)
                except ValueError:
                    st.markdown('<div style="text-align: center; padding: 2rem; border: 1px dashed var(--border); border-radius: 12px;"><span style="color: var(--text-muted); font-weight: 700; letter-spacing: 0.1em; font-size: 0.8rem;">AWAITING PAYLOAD</span></div>', unsafe_allow_html=True)
            else:
                st.markdown("<div class='card-desc'>Awaiting parameter definition.</div>", unsafe_allow_html=True)

    # ---------------------------------------------------------
    # NEW TAB: ENGINE ARCHITECTURE (Addressing Model, RAG, FastAPI specs)
    # ---------------------------------------------------------
    with tab_arch:
        st.markdown('<div style="text-align: center; max-width: 800px; margin: 0 auto;">', unsafe_allow_html=True)
        st.markdown('<div class="card-label" style="justify-content: center;">Technical Topology</div><div class="card-title" style="font-size: 2rem;">System Architecture</div><div class="card-desc">Detailed execution stack driving the Intelligence Engine. Integrates machine learning classification with semantic vector retrieval.</div>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="arch-node">
            <div>
                <div class="arch-node-title">Client / Routing Interface</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Uvicorn ASGI Server handling concurrent requests.</div>
            </div>
            <div class="arch-node-tech">FAST API</div>
        </div>
        <div style="width: 2px; height: 20px; background: var(--border); margin: 0 auto;"></div>
        <div class="arch-node">
            <div>
                <div class="arch-node-title">Semantic Retrieval Augmented Generation (RAG)</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Cosine similarity matching across high-density vector chunks.</div>
            </div>
            <div class="arch-node-tech">VECTOR EMBEDDINGS</div>
        </div>
        <div style="width: 2px; height: 20px; background: var(--border); margin: 0 auto;"></div>
        <div class="arch-node">
            <div>
                <div class="arch-node-title">Inference & Classification Engine</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Scikit-Learn Random Forest estimators deployed via serialized Pickle artifacts.</div>
            </div>
            <div class="arch-node-tech">MLOps / SCIKIT-LEARN</div>
        </div>
        """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()