import os
import sys
import argparse
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.knowledge_service import KnowledgeService

def ingest_text_file(filepath: str, title: str | None = None):
    file_path = Path(filepath)
    if not file_path.exists():
        print(f"Error: File {filepath} not found.")
        sys.exit(1)
        
    text_content = file_path.read_text(encoding="utf-8")
    doc_title = title or file_path.stem.replace("_", " ")
    
    print(f"Ingesting file: {file_path.name}", flush=True)
    print(f"Title: {doc_title}", flush=True)
    print(f"Content length: {len(text_content)} characters", flush=True)
    
    # 1. Prepare manual text entry
    upload = KnowledgeService.prepare_manual_text(title=doc_title, text=text_content)
    document_id = upload["document_id"]
    print(f"Created knowledge document with ID: {document_id}", flush=True)
    
    # 2. Process text content (chunking, embedding generation, entity extraction, and db storage)
    print("Processing document, generating embeddings & entity indexing...", flush=True)
    KnowledgeService.process_manual_text(
        document_id=document_id,
        document_title=upload["title"],
        text=upload["text"],
    )
    print("SUCCESS: Knowledge document processed & ingested successfully into Supabase!", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest manual text file into RAG Knowledge Base")
    parser.add_argument("filepath", help="Path to the text file to ingest")
    parser.add_argument("--title", help="Custom title for the document", default=None)
    args = parser.parse_args()
    
    ingest_text_file(args.filepath, args.title)
