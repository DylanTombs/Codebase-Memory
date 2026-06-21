import os
import sys
from dotenv import load_dotenv
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

load_dotenv()

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

SYSTEM_PROMPT = (
    "You are an institutional memory assistant for an engineering team. "
    "Given the following pull request history, answer the engineer's question "
    "about why a decision was made. Always cite the specific PR numbers that "
    "informed your answer. If the answer cannot be found in the PR history, "
    "say so honestly rather than guessing."
)


def _get_collection():
    if DEMO_MODE:
        embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    else:
        embedding_fn = None

    client = chromadb.PersistentClient(path="./chroma_db")
    return client.get_or_create_collection(
        name="pr_memory",
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )


def _embed_openai(openai_client, text):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def _build_context(results):
    blocks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        blocks.append(
            f"PR #{meta['pr_number']} ({meta['merged_at'][:10]}): {meta['pr_title']}\n"
            f"URL: {meta['pr_url']}\n"
            f"---\n{doc}"
        )
    return "\n\n".join(blocks)


def _demo_answer():
    return os.getenv(
        "DEMO_ANSWER",
        "Based on the PR history, this decision was made to improve system performance and maintainability. "
        "See the cited PRs below for the full discussion.",
    )


def query(question: str) -> dict:
    collection = _get_collection()

    if collection.count() == 0:
        return {
            "answer": "The knowledge base is empty. Please run `python ingest.py` first.",
            "sources": [],
        }

    n = min(5, collection.count())

    if DEMO_MODE:
        results = collection.query(
            query_texts=[question],
            n_results=n,
            include=["documents", "metadatas"],
        )
    else:
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        question_embedding = _embed_openai(openai_client, question)
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=n,
            include=["documents", "metadatas"],
        )

    sources = [
        {
            "pr_number": meta["pr_number"],
            "pr_title": meta["pr_title"],
            "pr_url": meta["pr_url"],
            "merged_at": meta["merged_at"][:10],
        }
        for meta in results["metadatas"][0]
    ]

    if DEMO_MODE:
        answer = _demo_answer()
    else:
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        context = _build_context(results)
        user_message = f"PR History:\n\n{context}\n\nQuestion: {question}"
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
        )
        answer = completion.choices[0].message.content

    return {"answer": answer, "sources": sources}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query.py \"your question here\"")
        sys.exit(1)

    question = " ".join(sys.argv[1:])
    result = query(question)

    print("\nANSWER:")
    print(result["answer"])
    print("\nSOURCES:")
    for s in result["sources"]:
        print(f"  PR #{s['pr_number']} — {s['pr_title']} ({s['merged_at']})")
        print(f"  {s['pr_url']}")
