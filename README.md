# 🤖 Local-First Portfolio RAG Bot

A privacy-focused, AI-powered portfolio assistant that answers questions about my skills and experience. This project demonstrates a **Hybrid RAG (Retrieval-Augmented Generation)** architecture where the "brain" (LLM) runs entirely in the user's browser using WebGPU, while the "memory" (context retrieval) is handled by a lightweight Python backend.

**Key Features:**
* **Client-Side Inference:** Runs **Llama 3 8B** locally in the browser using [WebLLM](https://webllm.mlc.ai/). No API keys or per-token costs.
* **RAG Architecture:** Retains a custom knowledge base (Resume, CV, Project details) using vector similarity search.
* **Privacy First:** User questions and generated answers never leave the local machine; only non-sensitive context retrieval queries are sent to the backend.
* **Modern Stack:** React (Vite), TypeScript, FastAPI, LangChain, ChromaDB.

---

## 🏗️ Architecture

1.  **Backend (Memory):** A FastAPI service that indexes PDF documents into a **ChromaDB** vector store. It exposes a single endpoint `/retrieve-context` that returns relevant text chunks based on user queries.
2.  **Frontend (Brain):** A React application that downloads and caches the quantized LLM weights ($\approx$4GB). It constructs the final prompt (System Prompt + Retrieved Context + User Question) and generates the response using the device's GPU.

---

## 🛠️ Prerequisites

* **Node.js** (v18+)
* **Python** (v3.10+)
* **WebGPU Compatible Browser:** Chrome (v113+), Edge, or browsers with explicit WebGPU support.
* **Hardware:** A device with a decent GPU (NVIDIA RTX series recommended) and at least 8GB of VRAM/Unified Memory.

---

# 🚀 Setup & Installation

## Backend Setup (The Retrieval Service)

The backend handles document parsing and vector search.

### Navigate to backend directory
cd portfolio-rag-backend

### Create virtual environment
python -m venv venv

### Activate environment
### Windows:
.\venv\Scripts\activate
### Mac/Linux:
source venv/bin/activate

### Install dependencies
pip install fastapi uvicorn python-dotenv langchain langchain-community chromadb pypdf sentence-transformers

### ⚠️ IMPORTANT: Add Data
# Place your PDF files (Resume.pdf, Projects.pdf) into the `data/` folder.

### Run Ingestion (Creates the Database)
python ingest.py
### You should see: "Success! DB created at: db"

### Start the API Server
uvicorn app.main:app --reload

### The backend runs on port 8000

## FRONTEND Setup
# Open a new terminal and navigate to frontend
cd qa-bot-frontend

### Install dependencies
npm install

### Start the Development Server
npm run dev
### The frontend runs on port 5173

## ⚠️ Important: GPU Performance on Laptops

If you are running this on a laptop with a dedicated GPU (e.g., NVIDIA RTX 30xx/40xx/50xx), Windows will often default the browser to the power-saving Integrated Graphics (iGPU). **This will cause the AI to be extremely slow or fail to load.**

### How to Fix:
1.  Close your browser completely.
2.  Open Windows **Settings** > **System** > **Display** > **Graphics**.
3.  Under "Custom options for apps", ensure **Desktop app** is selected.
4.  Click **Browse** and locate your browser executable (e.g., `C:\Program Files\Google\Chrome\Application\chrome.exe`).
5.  Click on the browser icon in the list > **Options**.
6.  Select **High performance** (Ensure it lists your NVIDIA GPU).
7.  Save and restart your browser.

## Technologies Used
1. LLM Engine: WebLLM (MLC AI)
2. Model: Mistral-7B-Instruct (4-bit Quantized)
3. Vector DB: ChromaDB
4. Frameworks: FastAPI (Python), React (Vite)
5. Orchestration: LangChain
