import os
os.environ["ANONYMIZED_TELEMETRY"] = "false"

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import query as q

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    question: str


def _collection():
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
    demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    ef = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2") if demo_mode else None
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
    return q.query(req.question)
