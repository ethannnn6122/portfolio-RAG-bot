import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

DATA_FOLDER = "data"
DB_PATH = "db"

def main():
    print("Starting ingestion process...")

    # Check if data folder exists
    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)
        print(f"Created data folder: {DATA_FOLDER}. Please add PDF files to this folder and rerun the script.")
        return
    
    # Load documents
    documents = []
    for file in os.listdir(DATA_FOLDER):
        if file.endswith(".pdf"):
            file_path = os.path.join(DATA_FOLDER, file)
            print(f"Loading document: {file_path}")
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
            print(f"   Loaded: {file}")

    if not documents:
        print("No documents found. Add PDFs to the data folder.")
        return
    
    # Split Text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(documents)
    print(f" Split into {len(chunks)} chunks.")

    # Create embeddings and store in ChromaDB
    print(" Creating embeddings... (This may take a while)")
    embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        persist_directory=DB_PATH
    )

    print(f"Success! DB created at: {DB_PATH}")
    
if __name__ == "__main__":
    main()