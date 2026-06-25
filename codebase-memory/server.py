import os
import json
os.environ["ANONYMIZED_TELEMETRY"] = "false"

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import query as q

load_dotenv()

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Sequential demo answer state
_demo_index = 0
_demo_qa: list = []

if DEMO_MODE:
    qa_path = os.path.join(os.path.dirname(__file__), "demo_qa.json")
    with open(qa_path) as f:
        _demo_qa = json.load(f)


class QueryRequest(BaseModel):
    question: str


def _collection():
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2") if DEMO_MODE else None
    client = chromadb.PersistentClient(path="./chroma_db")
    return client.get_or_create_collection(
        name="pr_memory",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )


@app.get("/status")
def status():
    try:
        col = _collection()
        count = col.count()
        repo = os.getenv("REPO_NAME", "unknown")
        return {"ok": count > 0, "repo": repo, "pr_count": count}
    except Exception as e:
        return {"ok": False, "repo": None, "pr_count": 0, "error": str(e)}


@app.post("/query")
def run_query(req: QueryRequest):
    global _demo_index
    if DEMO_MODE and _demo_qa:
        entry = _demo_qa[_demo_index % len(_demo_qa)]
        _demo_index += 1
        return {"answer": entry["answer"], "sources": entry["sources"]}
    return q.query(req.question)


@app.post("/reset")
def reset_demo():
    global _demo_index
    _demo_index = 0
    return {"reset": True, "total_questions": len(_demo_qa)}
