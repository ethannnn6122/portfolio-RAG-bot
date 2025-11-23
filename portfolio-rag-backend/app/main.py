from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

app = FastAPI()

DB_PATH = "db"
embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

db = Chroma(persist_directory=DB_PATH, embedding_function=embedding_function)

# CORS middleware setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://www.milehighcoding.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def read_root():
    return {"status": "Portfolio RAG Backend is running."}

@app.post("/retrieve-context")
def retrieve_context(request: QueryRequest):
    print(f"Received query: {request.query}")
    results = db.similarity_search(request.query, k=10)
    context_text = [doc.page_content for doc in results]
    return {"context": context_text}