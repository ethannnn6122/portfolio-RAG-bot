import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

load_dotenv()

app = FastAPI()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("AI_MODEL_NAME", "gpt-5-nano")

DB_PATH = "db"
embedding_function = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    check_embedding_ctx_length=False
)
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

class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    print(f"☁️ Cloud Query: {request.query}")
    
    # A. RAG Retrieval (Get the Context)
    results = db.similarity_search(request.query, k=5)
    context_text = "\n\n".join([doc.page_content for doc in results])
    
    # B. System Prompt construction
    system_prompt = f"""You are a helpful assistant for Ethan's portfolio.
    Use ONLY the context below to answer the user.
    If the answer is not in the context, say "I don't have that information."
    
    Context:
    {context_text}
    """
    # C. Generator function for Streaming
    def event_stream():
        try:
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.query}
                ],
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error: {str(e)}"

    # D. Return the stream
    return StreamingResponse(event_stream(), media_type="text/plain")