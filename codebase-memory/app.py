import os
import subprocess
import sys
from datetime import datetime

import chromadb
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="Codebase Memory",
    page_icon="🧠",
    layout="wide",
)

st.markdown(
    """
    <style>
    [data-testid="stAppViewContainer"] { background-color: #0e1117; }
    [data-testid="stSidebar"] { background-color: #161b22; }
    .block-container { padding-top: 2rem; }
    .source-card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
    }
    .answer-box {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 1.25rem 1.5rem;
        margin-top: 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource
def get_collection():
    client = chromadb.PersistentClient(path="./chroma_db")
    return client.get_or_create_collection(
        name="pr_memory",
        metadata={"hnsw:space": "cosine"},
    )


def get_last_ingested(collection):
    if collection.count() == 0:
        return None
    result = collection.get(include=["metadatas"])
    dates = [
        m["merged_at"]
        for m in result["metadatas"]
        if m.get("merged_at")
    ]
    if not dates:
        return None
    return max(dates)[:10]


def run_ingest():
    python = sys.executable
    result = subprocess.run(
        [python, "ingest.py"],
        capture_output=True,
        text=True,
    )
    return result.stdout, result.stderr


# ── Sidebar ──────────────────────────────────────────────────────────────────

repo_name = os.getenv("REPO_NAME", "Not configured")
collection = get_collection()
pr_count = collection.count()
last_ingested = get_last_ingested(collection)

with st.sidebar:
    st.markdown("### Codebase Memory")
    st.divider()
    st.markdown(f"**Repo:** `{repo_name}`")
    st.markdown(f"**PRs indexed:** {pr_count}")
    st.markdown(f"**Last ingested:** {last_ingested or '—'}")
    st.divider()

    if st.button("Re-ingest", use_container_width=True):
        with st.spinner("Running ingest.py..."):
            stdout, stderr = run_ingest()
        st.success("Ingestion complete.")
        if stdout:
            with st.expander("Output"):
                st.code(stdout)
        if stderr:
            with st.expander("Errors"):
                st.code(stderr)
        st.cache_resource.clear()
        st.rerun()

# ── Main ─────────────────────────────────────────────────────────────────────

st.markdown("# 🧠 Codebase Memory")
st.markdown("*Ask why your codebase works the way it does*")
st.divider()

if pr_count == 0:
    st.warning(
        "No PR data found. Run ingestion first to populate the knowledge base."
    )
    st.code("python ingest.py", language="bash")
    st.stop()

question = st.text_input(
    "Ask a question about this codebase...",
    placeholder="e.g. Why did we switch from REST to gRPC?",
    label_visibility="collapsed",
)

ask = st.button("Ask", type="primary")

if "last_result" not in st.session_state:
    st.session_state.last_result = None

if ask and question.strip():
    import query as q

    with st.spinner("Searching PR history..."):
        result = q.query(question.strip())
    st.session_state.last_result = result

if st.session_state.last_result:
    result = st.session_state.last_result

    st.markdown("### Answer")
    st.markdown(
        f'<div class="answer-box">{result["answer"]}</div>',
        unsafe_allow_html=True,
    )

    if result["sources"]:
        st.markdown("### Sources")
        for s in result["sources"]:
            merged = s.get("merged_at", "")
            st.markdown(
                f'<div class="source-card">'
                f'<a href="{s["pr_url"]}" target="_blank" style="color:#58a6ff;text-decoration:none;">'
                f'PR #{s["pr_number"]} — {s["pr_title"]}'
                f'</a>'
                f'<span style="color:#8b949e;font-size:0.85rem;float:right;">{merged}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
