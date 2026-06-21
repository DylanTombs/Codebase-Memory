import os
import sys
from dotenv import load_dotenv
from github import Github, GithubException
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

load_dotenv()

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
REQUIRED_ENV = ["GITHUB_TOKEN", "REPO_NAME"]
if not DEMO_MODE:
    REQUIRED_ENV.append("OPENAI_API_KEY")


def validate_env():
    missing = [k for k in REQUIRED_ENV if not os.getenv(k)]
    if missing:
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        print("Copy .env.template to .env and fill in the values.")
        sys.exit(1)


def build_chunk(pr, comments, commit_messages):
    labels = ", ".join(l.name for l in pr.labels) if pr.labels else "none"
    discussion = "\n".join(comments) if comments else "none"
    commits = "\n".join(commit_messages) if commit_messages else "none"
    body = (pr.body or "").strip() or "No description provided."

    return (
        f"PR #{pr.number}: {pr.title}\n"
        f"Description: {body}\n"
        f"Labels: {labels}\n"
        f"Review discussions: {discussion}\n"
        f"Commits: {commits}"
    )


@retry(
    retry=retry_if_exception_type(GithubException),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(5),
    reraise=True,
)
def fetch_pr_data(pr):
    review_comments = [
        f"[{c.user.login}]: {c.body}"
        for c in pr.get_review_comments()
        if c.body
    ]
    issue_comments = [
        f"[{c.user.login}]: {c.body}"
        for c in pr.get_issue_comments()
        if c.body
    ]
    commit_messages = [
        c.commit.message.strip()
        for c in pr.get_commits()
    ]
    return review_comments + issue_comments, commit_messages


def get_existing_ids(collection):
    result = collection.get(include=[])
    return set(result["ids"])


def make_collection(chroma_client, embedding_fn):
    return chroma_client.get_or_create_collection(
        name="pr_memory",
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )


def main():
    validate_env()

    if DEMO_MODE:
        print("DEMO MODE: using local sentence-transformers (no OpenAI API calls)")
        embedding_fn = SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        embed = None
    else:
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        embedding_fn = None

        def embed(text):
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding

    github_token = os.getenv("GITHUB_TOKEN")
    repo_name = os.getenv("REPO_NAME")

    gh = Github(github_token)
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    collection = make_collection(chroma_client, embedding_fn)

    print(f"Connecting to repo: {repo_name}")
    repo = gh.get_repo(repo_name)

    all_prs = [pr for pr in repo.get_pulls(state="closed") if pr.merged_at]
    total = len(all_prs)
    print(f"Found {total} merged PRs. Starting ingestion...\n")

    existing_ids = get_existing_ids(collection)
    skipped = 0

    for i, pr in enumerate(all_prs, 1):
        pr_id = f"pr-{pr.number}"
        prefix = f"[{i}/{total}]"

        if pr_id in existing_ids:
            print(f"{prefix} Skipping PR #{pr.number} (already ingested)")
            skipped += 1
            continue

        print(f"{prefix} PR #{pr.number}: {pr.title}")

        try:
            comments, commit_messages = fetch_pr_data(pr)
        except GithubException as e:
            print(f"  WARNING: Could not fetch data for PR #{pr.number}: {e}")
            continue

        chunk = build_chunk(pr, comments, commit_messages)

        if DEMO_MODE:
            # embedding_fn is attached to collection; pass document text directly
            collection.upsert(
                ids=[pr_id],
                documents=[chunk],
                metadatas=[{
                    "pr_number": pr.number,
                    "pr_title": pr.title,
                    "pr_url": pr.html_url,
                    "merged_at": pr.merged_at.isoformat(),
                }],
            )
        else:
            collection.upsert(
                ids=[pr_id],
                embeddings=[embed(chunk)],
                documents=[chunk],
                metadatas=[{
                    "pr_number": pr.number,
                    "pr_title": pr.title,
                    "pr_url": pr.html_url,
                    "merged_at": pr.merged_at.isoformat(),
                }],
            )

    ingested = total - skipped
    print(f"\nDone. {ingested} PRs ingested, {skipped} skipped (already in DB).")
    print(f"ChromaDB collection 'pr_memory' now has {collection.count()} documents.")


if __name__ == "__main__":
    main()
