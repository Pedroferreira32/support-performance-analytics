from fastapi import FastAPI

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/api/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "pipeline": "diagnostico-fastapi",
        "persistent": False,
    }
