import os
import sys

# Add the app and virtual environment directories to sys.path
app_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(app_dir)
venv_site_packages = os.path.join(backend_dir, ".venv", "Lib", "site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)


import re
import time
from html.parser import HTMLParser
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from fastapi.concurrency import run_in_threadpool
from semantic_chunker import get_embeddings_cached, get_sentence_transformer, cosine_similarity
from session_manager import save_to_json, load_from_json, clear_session_data

from txt_reader import read_txt
from pdf_reader import read_pdf
from docx_reader import read_docx
from utils import calculate_metadata
from analyzer import analyze_document
from fixed_chunker import chunk_fixed_size_service
from recursive_chunker import chunk_recursive_service
from document_chunker import chunk_document_service
from semantic_chunker import chunk_semantic_service
from query_aware_chunker import chunk_query_aware_service
from metadata_chunker import chunk_metadata_service
from llm_chunker import chunk_llm_service
from agentic_chunker import chunk_agentic_service
from db import check_mongo_connection, ingest_chunks_to_mongodb, vector_search_chunks

class AnalyzeRequest(BaseModel):
    text: str

class FixedChunkRequest(BaseModel):
    text: str
    chunk_size: int
    chunk_overlap: int

class RecursiveChunkRequest(BaseModel):
    text: str
    chunk_size: int
    chunk_overlap: int

class DocumentChunkRequest(BaseModel):
    text: str

class SemanticChunkRequest(BaseModel):
    text: str
    threshold: float

class QueryAwareChunkRequest(BaseModel):
    text: str
    query: str
    chunk_size: int
    chunk_overlap: int

class MetadataChunkRequest(BaseModel):
    text: str
    chunk_size: int
    chunk_overlap: int
    metadata: dict = None
    auto_discover: bool = True

class LLMChunkRequest(BaseModel):
    text: str
    model: str = "llama3-8b-8192"
    api_key: str = None
    simulated: bool = True

from typing import Optional

class AgenticChunkRequest(BaseModel):
    text: str
    query: Optional[str] = None

class CompareRequest(BaseModel):
    text: str

class RetrieveRequest(BaseModel):
    query: str
    chunks: list
    top_k: int = 3


class MetadataRetrieveRequest(BaseModel):
    query: str
    chunks: list
    top_k: int = 3

class MongoIngestRequest(BaseModel):
    source_type: Optional[str] = "document"
    document_name: Optional[str] = None
    source_url: Optional[str] = None
    strategy: Optional[str] = None
    strategy_params: Optional[dict] = None
    document_metrics: Optional[dict] = None
    chunks: Optional[list] = None
    mongodb_uri: Optional[str] = None
    db_name: Optional[str] = None
    target_collection: Optional[str] = None
    mistral_api_key: Optional[str] = None

class VectorSearchRequest(BaseModel):
    query: str
    collection_name: Optional[str] = None
    source_type: Optional[str] = "resume"
    top_k: int = 5
    mongodb_uri: Optional[str] = None
    db_name: Optional[str] = None
    mistral_api_key: Optional[str] = None

class ResumeIngestRequest(BaseModel):
    text: Optional[str] = None
    document_name: Optional[str] = "Resume"
    strategy: Optional[str] = "recursive"
    strategy_params: Optional[dict] = None
    candidate_metadata: Optional[dict] = None
    mongodb_uri: Optional[str] = None
    db_name: Optional[str] = None
    target_collection: Optional[str] = None
    mistral_api_key: Optional[str] = None

app = FastAPI(
    title="Chunking Playground API",
    description="Backend API for the Chunking Playground learning platform",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    API health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "Chunking Playground API",
        "version": "1.0.0"
    }

@app.post("/document/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint to upload and parse documents (TXT, PDF, DOCX).
    Calculates document-level metadata metrics.
    """
    filename = file.filename or ""
    extension = filename.split(".")[-1].lower() if "." in filename else ""
    
    if extension not in ["txt", "pdf", "docx"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{extension}'. Only TXT, PDF, and DOCX are supported."
        )
        
    # Read file contents and check size limit (20MB)
    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 20MB limit."
        )
        
    try:
        if extension == "txt":
            text = read_txt(contents)
        elif extension == "pdf":
            text = read_pdf(contents)
        else:  # docx
            text = read_docx(contents)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse document: {str(e)}"
        )
        
    metadata = calculate_metadata(text)
    
    # Save upload details to session
    session_info = {
        "text": text,
        "filename": filename,
        "file_type": extension,
        "metadata": metadata
    }
    clear_session_data()
    save_to_json("metadata.json", session_info)
    
    return {
        "filename": filename,
        "file_type": extension,
        "text": text,
        "metadata": metadata
    }

class FetchUrlRequest(BaseModel):
    url: str

class WebContentExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fed = []
        self.ignore_depth = 0
        self.ignore_tags = {'script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'noscript', 'iframe', 'head', 'metadata'}
        self.in_heading = None
        self.list_item_depth = 0
        self.in_table = False
        self.in_tr = False
        self.in_td = False
        
        # Structure counts
        self.h1_count = 0
        self.h2_count = 0
        self.h3_count = 0
        self.h4_count = 0
        self.p_count = 0
        self.list_count = 0
        self.table_count = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.ignore_tags:
            self.ignore_depth += 1
            return
        if self.ignore_depth > 0:
            return
            
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.in_heading = tag
            if tag == 'h1': self.h1_count += 1
            elif tag == 'h2': self.h2_count += 1
            elif tag == 'h3': self.h3_count += 1
            elif tag == 'h4': self.h4_count += 1
            
            level = int(tag[1])
            self.fed.append("\n\n" + "#" * level + " ")
            
        elif tag == 'p':
            self.p_count += 1
            self.fed.append("\n\n")
            
        elif tag in ['ul', 'ol']:
            self.list_count += 1
            self.fed.append("\n")
            
        elif tag == 'li':
            self.list_item_depth += 1
            self.fed.append("\n- ")
            
        elif tag == 'table':
            self.table_count += 1
            self.in_table = True
            self.fed.append("\n\n")
            
        elif tag == 'tr':
            self.in_tr = True
            self.fed.append("\n| ")
            
        elif tag in ['td', 'th']:
            self.in_td = True

    def handle_endtag(self, tag):
        if tag in self.ignore_tags:
            self.ignore_depth = max(0, self.ignore_depth - 1)
            return
        if self.ignore_depth > 0:
            return
            
        if tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            self.in_heading = None
            self.fed.append("\n\n")
        elif tag == 'p':
            self.fed.append("\n\n")
        elif tag == 'li':
            self.list_item_depth = max(0, self.list_item_depth - 1)
        elif tag == 'table':
            self.in_table = False
            self.fed.append("\n\n")
        elif tag == 'tr':
            self.in_tr = False
        elif tag in ['td', 'th']:
            self.in_td = False
            self.fed.append(" | ")

    def handle_data(self, data):
        if self.ignore_depth == 0:
            text = data
            if self.in_heading:
                text = text.strip()
            self.fed.append(text)

    def get_text(self):
        text = "".join(self.fed)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\r\n|\r', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()

    def get_structure_metadata(self):
        return {
            "h1_count": self.h1_count,
            "h2_count": self.h2_count,
            "h3_count": self.h3_count,
            "h4_count": self.h4_count,
            "p_count": self.p_count,
            "list_count": self.list_count,
            "table_count": self.table_count
        }

def fetch_and_clean(url):
    import urllib.request
    from html.parser import HTMLParser
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        content_type = response.headers.get_content_charset() or 'utf-8'
        html_content = response.read().decode(content_type, errors='ignore')
    
    extractor = WebContentExtractor()
    extractor.feed(html_content)
    return {
        "text": extractor.get_text(),
        "structure": extractor.get_structure_metadata()
    }

@app.post("/document/fetch-url")
async def fetch_url_endpoint(req: FetchUrlRequest):
    """
    Endpoint to ingest content from a website URL, removing boilerplate HTML (headers, footers, navs).
    """
    from html.parser import HTMLParser
    url = req.url.strip()
    if not url:
        raise HTTPException(
            status_code=400,
            detail="URL cannot be empty."
        )
    
    # Prefix protocol if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
        
    try:
        result = await run_in_threadpool(fetch_and_clean, url)
        text = result["text"]
        structure = result["structure"]
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch content from URL: {str(e)}"
        )
        
    if not text:
        raise HTTPException(
            status_code=400,
            detail="Fetched webpage returned no readable text."
        )
        
    metadata = calculate_metadata(text)
    
    # Extract domain as filename
    domain_match = re.search(r'https?://(?:www\.)?([^/]+)', url)
    filename = domain_match.group(1) if domain_match else "web_content"
    
    session_info = {
        "text": text,
        "filename": filename,
        "file_type": "url",
        "metadata": metadata,
        "html_structure": structure
    }
    clear_session_data()
    save_to_json("metadata.json", session_info)
    
    return {
        "filename": filename,
        "file_type": "url",
        "text": text,
        "metadata": metadata,
        "html_structure": structure
    }


@app.post("/document/analyze")
async def analyze_doc(req: AnalyzeRequest):
    """
    Endpoint to analyze document readability, tokens, and detect document type.
    """
    try:
        analysis = await run_in_threadpool(analyze_document, req.text)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document analysis failed: {str(e)}"
        )

@app.post("/chunk/fixed")
async def chunk_fixed(req: FixedChunkRequest):
    """
    Endpoint for character-based fixed size chunking.
    Validates overlap constraints.
    """
    if req.chunk_overlap >= req.chunk_size:
        raise HTTPException(
            status_code=400,
            detail="Chunk overlap must be strictly less than chunk size."
        )
    if req.chunk_size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Chunk size must be greater than zero."
        )
        
    try:
        result = await run_in_threadpool(
            chunk_fixed_size_service,
            req.text, 
            req.chunk_size, 
            req.chunk_overlap
        )
        save_to_json("chunks.json", {
            "strategy": "fixed",
            "params": {"chunk_size": req.chunk_size, "chunk_overlap": req.chunk_overlap},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fixed-size chunking failed: {str(e)}"
        )

@app.post("/chunk/recursive")
async def chunk_recursive(req: RecursiveChunkRequest):
    """
    Endpoint for hierarchical recursive character chunking.
    Validates overlap constraints.
    """
    if req.chunk_overlap >= req.chunk_size:
        raise HTTPException(
            status_code=400,
            detail="Chunk overlap must be strictly less than chunk size."
        )
    if req.chunk_size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Chunk size must be greater than zero."
        )
        
    try:
        result = await run_in_threadpool(
            chunk_recursive_service,
            req.text, 
            req.chunk_size, 
            req.chunk_overlap
        )
        save_to_json("chunks.json", {
            "strategy": "recursive",
            "params": {"chunk_size": req.chunk_size, "chunk_overlap": req.chunk_overlap},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recursive character chunking failed: {str(e)}"
        )

@app.post("/chunk/document")
async def chunk_document(req: DocumentChunkRequest):
    """
    Endpoint for document structure-based chunking.
    """
    try:
        result = await run_in_threadpool(chunk_document_service, req.text)
        save_to_json("chunks.json", {
            "strategy": "document",
            "params": {},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document-based chunking failed: {str(e)}"
        )

@app.post("/chunk/semantic")
async def chunk_semantic(req: SemanticChunkRequest):
    """
    Endpoint for semantic similarity-based chunking.
    """
    if not (0.0 <= req.threshold <= 1.0):
        raise HTTPException(
            status_code=400,
            detail="Similarity threshold must be between 0.0 and 1.0."
        )
    try:
        result = await run_in_threadpool(chunk_semantic_service, req.text, req.threshold)
        save_to_json("chunks.json", {
            "strategy": "semantic",
            "params": {"threshold": req.threshold},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic chunking failed: {str(e)}"
        )

@app.post("/chunk/query-aware")
async def chunk_query_aware(req: QueryAwareChunkRequest):
    """
    Endpoint for query-aware retrieval-optimized chunking.
    """
    if req.chunk_overlap >= req.chunk_size:
        raise HTTPException(
            status_code=400,
            detail="Chunk overlap must be strictly less than chunk size."
        )
    if req.chunk_size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Chunk size must be greater than zero."
        )
    if not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query text must not be empty."
        )
    try:
        result = await run_in_threadpool(
            chunk_query_aware_service,
            req.text, req.query, req.chunk_size, req.chunk_overlap
        )
        save_to_json("chunks.json", {
            "strategy": "query",
            "params": {"query": req.query, "chunk_size": req.chunk_size, "chunk_overlap": req.chunk_overlap},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query-aware chunking failed: {str(e)}"
        )

@app.post("/chunk/metadata")
async def chunk_metadata(req: MetadataChunkRequest):
    """
    Endpoint for metadata-enhanced chunking.
    """
    if req.chunk_overlap >= req.chunk_size:
        raise HTTPException(
            status_code=400,
            detail="Chunk overlap must be strictly less than chunk size."
        )
    if req.chunk_size <= 0:
        raise HTTPException(
            status_code=400,
            detail="Chunk size must be greater than zero."
        )
    try:
        result = await run_in_threadpool(
            chunk_metadata_service,
            req.text, req.chunk_size, req.chunk_overlap, req.metadata, req.auto_discover
        )
        save_to_json("chunks.json", {
            "strategy": "metadata",
            "params": {"chunk_size": req.chunk_size, "chunk_overlap": req.chunk_overlap, "metadata": req.metadata, "auto_discover": req.auto_discover},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Metadata chunking failed: {str(e)}"
        )

def metadata_retrieve_sync(req: MetadataRetrieveRequest):
    """
    Synchronous helper to retrieve metadata chunks using cached embeddings.
    """
    if not req.chunks:
        return {"retrieved": []}
        
    model = get_sentence_transformer()
    
    # 1. Embed Query
    query_embedding = get_embeddings_cached([req.query], model)[0]
    
    # 2. Embed Chunks
    chunk_texts = [c["text"] for c in req.chunks]
    chunk_embeddings = get_embeddings_cached(chunk_texts, model)
    
    # 3. Calculate similarity & metadata boost
    query_words = set(re.findall(r'\b\w{3,15}\b', req.query.lower()))
    search_stopwords = {"and", "for", "the", "with", "show", "find", "rules", "guidelines", "policy", "what", "where", "how", "who"}
    filtered_query_words = query_words - search_stopwords
    
    scored_results = []
    for idx, (chunk, chunk_emb) in enumerate(zip(req.chunks, chunk_embeddings)):
        sim = float(cosine_similarity(query_embedding, chunk_emb))
        
        # Metadata Match Scoring
        metadata_matches = []
        metadata_boost = 0.0
        
        if "metadata" in chunk and filtered_query_words:
            for key, val in chunk["metadata"].items():
                val_str = str(val).lower()
                key_str = str(key).lower()
                for qw in filtered_query_words:
                    if qw in val_str or qw in key_str:
                        metadata_matches.append(f"{key}: {val}")
                        metadata_boost += 0.20
                        
        metadata_boost = min(0.40, metadata_boost)
        
        base_conf = max(0.0, sim)
        retrieval_conf = base_conf + metadata_boost
        retrieval_conf = min(1.0, retrieval_conf)
        
        scored_results.append({
            "chunk": chunk,
            "similarity_score": round(sim, 4),
            "metadata_match_score": round(metadata_boost, 4),
            "retrieval_confidence": round(retrieval_conf, 4),
            "metadata_matches": metadata_matches
        })
        
    scored_results.sort(key=lambda x: x["retrieval_confidence"], reverse=True)
    return {
        "retrieved": scored_results[:req.top_k]
    }

@app.post("/chunk/metadata/retrieve")
async def retrieve_metadata_chunks(req: MetadataRetrieveRequest):
    """
    Simulates retrieval of metadata-aware chunks based on semantic similarity + metadata boost.
    """
    if not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query must not be empty."
        )
    try:
        result = await run_in_threadpool(metadata_retrieve_sync, req)
        save_to_json("retrieval_results.json", {
            "type": "metadata",
            "query": req.query,
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Retrieval simulation failed: {str(e)}"
        )

@app.post("/chunk/llm")
async def chunk_llm(req: LLMChunkRequest):
    """
    Endpoint for LLM-based intelligent chunking.
    Supports real Groq API calls or local fallback simulation.
    """
    try:
        result = await run_in_threadpool(
            chunk_llm_service,
            req.text, req.model, req.api_key, req.simulated
        )
        save_to_json("chunks.json", {
            "strategy": "llm",
            "params": {"model": req.model, "simulated": req.simulated},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM chunking failed: {str(e)}"
        )

@app.post("/chunk/agentic")
async def chunk_agentic(req: AgenticChunkRequest):
    """
    Endpoint for Agentic LangGraph-based chunking pipeline.
    """
    try:
        result = await run_in_threadpool(chunk_agentic_service, req.text, req.query)
        save_to_json("chunks.json", {
            "strategy": "agentic",
            "params": {"query": req.query},
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agentic chunking failed: {str(e)}"
        )
def compute_coherence_and_retrieval(chunks_list, transformer_model):
    import re
    import numpy as np
    from semantic_chunker import cosine_similarity
    
    if not chunks_list:
        return 0.0, 0.0
        
    test_query = "What are the rules, guidelines, policy limits, standard operating procedures, and core details mentioned in this document?"
    query_emb = get_embeddings_cached([test_query], transformer_model)[0]
    
    coherence_scores = []
    chunk_texts = [c["text"] for c in chunks_list]
    
    try:
        chunk_embs = get_embeddings_cached(chunk_texts, transformer_model)
        query_sims = []
        for c_emb in chunk_embs:
            sim = float(cosine_similarity(query_emb, c_emb))
            query_sims.append(max(0.0, sim))
            
        query_sims.sort(reverse=True)
        top_sims = query_sims[:3]
        retrieval_relevance = sum(top_sims) / len(top_sims) if top_sims else 0.0
    except Exception:
        retrieval_relevance = 0.0
    
    sentence_split_regex = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s')
    
    for text in chunk_texts:
        sentences = [s.strip() for s in sentence_split_regex.split(text) if s.strip()]
        if len(sentences) <= 1:
            coherence_scores.append(1.0)
            continue
            
        try:
            sent_embs = get_embeddings_cached(sentences, transformer_model)
            similarities = []
            for i in range(len(sent_embs) - 1):
                sim = float(cosine_similarity(sent_embs[i], sent_embs[i+1]))
                similarities.append(max(-1.0, min(1.0, sim)))
            
            chunk_coherence = sum(similarities) / len(similarities) if similarities else 1.0
            chunk_coherence = (chunk_coherence + 1.0) / 2.0
            coherence_scores.append(chunk_coherence)
        except Exception:
            coherence_scores.append(0.5)
            
    avg_coherence = sum(coherence_scores) / len(coherence_scores) if coherence_scores else 0.0
    return avg_coherence, retrieval_relevance

def run_chunk_compare_service(text: str) -> dict:
    from semantic_chunker import get_sentence_transformer
    model = get_sentence_transformer()
    strategies_data = {}
    runners = {
        "fixed": lambda: chunk_fixed_size_service(text, chunk_size=500, chunk_overlap=50),
        "recursive": lambda: chunk_recursive_service(text, chunk_size=500, chunk_overlap=50),
        "document": lambda: chunk_document_service(text),
        "semantic": lambda: chunk_semantic_service(text, threshold=0.6),
        "query": lambda: chunk_query_aware_service(text, query="What rules, guidelines and specifications exist?", chunk_size=500, chunk_overlap=50),
        "metadata": lambda: chunk_metadata_service(text, chunk_size=500, chunk_overlap=50, auto_discover=True),
        "llm": lambda: chunk_llm_service(text, simulated=True)
    }
    
    for key, runner in runners.items():
        start_time = time.perf_counter()
        try:
            res = runner()
            chunks = res.get("chunks", [])
            processing_time = (time.perf_counter() - start_time) * 1000
            
            avg_size = res.get("metrics", {}).get("avg_size", 0.0)
            if not avg_size and chunks:
                avg_size = sum(len(c["text"]) for c in chunks) / len(chunks)
                
            coherence, retrieval = compute_coherence_and_retrieval(chunks, model)
            
            strategies_data[key] = {
                "chunk_count": len(chunks),
                "avg_size": round(avg_size, 1),
                "coherence": round(coherence, 4),
                "retrieval_relevance": round(retrieval, 4),
                "latency_ms": round(processing_time, 1)
            }
        except Exception as e:
            strategies_data[key] = {
                "chunk_count": 0,
                "avg_size": 0.0,
                "coherence": 0.0,
                "retrieval_relevance": 0.0,
                "latency_ms": 0.0,
                "error": str(e)
            }
    return strategies_data

@app.post("/chunk/compare")
async def chunk_compare(req: CompareRequest):
    """
    Batch comparison endpoint executing all base chunking strategies on the input text.
    Returns metrics (count, avg_size, coherence, retrieval_relevance, latency_ms) for dashboard display.
    """
    text = req.text
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        result = await run_in_threadpool(run_chunk_compare_service, text)
        save_to_json("stats.json", result)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch comparison orchestration failed: {str(e)}"
        )

def retrieve_chunks_sync(req: RetrieveRequest):
    """
    Synchronous helper to retrieve top_k chunks based on cached embeddings.
    """
    if not req.chunks:
        return {"retrieved": [], "precision": 0.0, "recall": 0.0, "mean_similarity": 0.0}
        
    from semantic_chunker import cosine_similarity
    model = get_sentence_transformer()
    
    # 1. Embed Query
    query_embedding = get_embeddings_cached([req.query], model)[0]
    
    # 2. Embed Chunks
    chunk_texts = [c["text"] for c in req.chunks]
    chunk_embeddings = get_embeddings_cached(chunk_texts, model)
    
    # 3. Calculate similarity & metadata boost
    scored_results = []
    for idx, (chunk, chunk_emb) in enumerate(zip(req.chunks, chunk_embeddings)):
        sim = float(cosine_similarity(query_embedding, chunk_emb))
        sim = max(0.0, sim)
        
        metadata_boost = 0.0
        metadata_matches = []
        if "metadata" in chunk and chunk["metadata"]:
            query_words = set(re.findall(r'\b\w{3,15}\b', req.query.lower()))
            search_stopwords = {"and", "for", "the", "with", "show", "find", "rules", "guidelines", "policy", "what", "where", "how", "who"}
            filtered_query_words = query_words - search_stopwords
            
            for key, val in chunk["metadata"].items():
                val_str = str(val).lower()
                key_str = str(key).lower()
                for qw in filtered_query_words:
                    if qw in val_str or qw in key_str:
                        metadata_matches.append(f"{key}: {val}")
                        metadata_boost += 0.20
            metadata_boost = min(0.40, metadata_boost)
            
        final_conf = min(1.0, sim + metadata_boost)
        
        scored_results.append({
            "chunk": chunk,
            "similarity_score": round(sim, 4),
            "metadata_match_score": round(metadata_boost, 4),
            "retrieval_confidence": round(final_conf, 4),
            "metadata_matches": metadata_matches
        })
        
    scored_results.sort(key=lambda x: x["retrieval_confidence"], reverse=True)
    top_k_results = scored_results[:req.top_k]
    
    # Calculate Precision
    relevant_top_k = [r for r in top_k_results if r["similarity_score"] >= 0.40]
    precision = len(relevant_top_k) / len(top_k_results) if top_k_results else 0.0
    
    # Calculate Recall
    total_relevant = [r for r in scored_results if r["similarity_score"] >= 0.40]
    if total_relevant:
        recall = len(relevant_top_k) / len(total_relevant)
    else:
        recall = 1.0
        
    mean_sim = sum(r["similarity_score"] for r in top_k_results) / len(top_k_results) if top_k_results else 0.0
    
    return {
        "retrieved": top_k_results,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "mean_similarity": round(mean_sim, 4)
    }

@app.post("/chunk/retrieve")
async def retrieve_chunks_api(req: RetrieveRequest):
    """
    Retrieves the top_k chunks based on semantic similarity of SentenceTransformer embeddings.
    Calculates precision, recall, and similarity stats.
    """
    if not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query must not be empty."
        )
    try:
        result = await run_in_threadpool(retrieve_chunks_sync, req)
        save_to_json("retrieval_results.json", {
            "type": "standard",
            "query": req.query,
            "result": result
        })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Retrieval simulation failed: {str(e)}"
        )

@app.get("/session/load")
async def load_session():
    """
    Consolidated endpoint to load all session data files.
    """
    metadata = load_from_json("metadata.json")
    chunks = load_from_json("chunks.json")
    stats = load_from_json("stats.json")
    retrieval = load_from_json("retrieval_results.json")
    
    return {
        "metadata": metadata,
        "chunks": chunks,
        "stats": stats,
        "retrieval": retrieval
    }

@app.post("/session/clear")
async def clear_session():
    """
    Endpoint to clear all session files.
    """
    clear_session_data()
    return {"status": "success", "message": "Session cleared successfully"}

@app.get("/mongodb/status")
async def mongodb_status_endpoint(uri: Optional[str] = None, db_name: Optional[str] = None):
    """
    Endpoint to check MongoDB connection status and collection statistics.
    """
    return await run_in_threadpool(check_mongo_connection, uri=uri, db_name=db_name)

@app.post("/mongodb/ingest")
async def mongodb_ingest_endpoint(req: MongoIngestRequest):
    """
    Endpoint to ingest generated document chunks into MongoDB.
    Routes documents into separated collections:
    - 'web_url_chunks' for Web URLs / Confluence pages
    - 'document_chunks' for Uploaded PDF / DOCX / TXT documents
    """
    chunks = req.chunks
    source_type = req.source_type
    document_name = req.document_name
    strategy = req.strategy
    strategy_params = req.strategy_params or {}
    document_metrics = req.document_metrics or {}
    source_url = req.source_url

    session_metadata = load_from_json("metadata.json") or {}
    session_chunks = load_from_json("chunks.json") or {}

    # If chunks not in payload, pull from active session
    if not chunks:
        if session_chunks and "result" in session_chunks:
            result_data = session_chunks["result"]
            if isinstance(result_data, dict) and "chunks" in result_data:
                chunks = result_data["chunks"]
            elif isinstance(result_data, list):
                chunks = result_data
        if not strategy and session_chunks:
            strategy = session_chunks.get("strategy")
        if not strategy_params and session_chunks:
            strategy_params = session_chunks.get("params", {})

    if not chunks or len(chunks) == 0:
        raise HTTPException(
            status_code=400,
            detail="No chunks available to ingest into MongoDB. Please chunk a document first."
        )

    # Derive missing document metadata from active session
    if not document_name and session_metadata:
        document_name = session_metadata.get("filename", "Untitled Document")
    if not source_type and session_metadata:
        file_type = session_metadata.get("file_type", "")
        doc_name_lower = (document_name or "").lower()
        if "resume" in doc_name_lower or "cv" in doc_name_lower:
            source_type = "resume"
        elif file_type == "url":
            source_type = "web_url"
        else:
            source_type = "document"
    if not source_url and session_metadata and session_metadata.get("file_type") == "url":
        source_url = session_metadata.get("url")
    if not document_metrics and session_metadata:
        document_metrics = session_metadata.get("metadata", {})

    try:
        result = await run_in_threadpool(
            ingest_chunks_to_mongodb,
            source_type=source_type or "document",
            document_name=document_name or "Untitled Document",
            strategy=strategy or "custom",
            chunks=chunks,
            source_url=source_url,
            strategy_params=strategy_params,
            document_metrics=document_metrics,
            uri=req.mongodb_uri,
            db_name=req.db_name,
            target_collection=req.target_collection,
            mistral_api_key=req.mistral_api_key
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"MongoDB Ingestion Failed: {str(e)}"
        )

@app.post("/mongodb/vector-search")
async def mongodb_vector_search_endpoint(req: VectorSearchRequest):
    """
    Performs vector similarity search against ingested chunk documents.
    Generates 1,024-dimensional Mistral query embedding and uses
    Atlas $vectorSearch with fallback to cosine similarity.
    """
    try:
        results = await run_in_threadpool(
            vector_search_chunks,
            query=req.query,
            collection_name=req.collection_name,
            top_k=req.top_k,
            source_type=req.source_type,
            uri=req.mongodb_uri,
            db_name=req.db_name,
            mistral_api_key=req.mistral_api_key
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Vector Search Failed: {str(e)}"
        )

@app.post("/resume/ingest")
async def resume_ingest_endpoint(req: ResumeIngestRequest):
    """
    Dedicated endpoint to chunk a resume and persist each chunk as a separate
    document with metadata and 1,024-dimensional Mistral embeddings in MongoDB.
    """
    text = req.text
    if not text or not text.strip():
        # Fall back to current active session text
        session_meta = load_from_json("metadata.json") or {}
        text = session_meta.get("text", "")

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No resume text provided to ingest.")

    strategy = req.strategy or "recursive"
    strategy_params = req.strategy_params or {"chunk_size": 500, "chunk_overlap": 50}
    
    # Chunk text according to selected strategy
    if strategy == "fixed":
        chunk_res = chunk_fixed_size_service(
            text=text,
            chunk_size=strategy_params.get("chunk_size", 500),
            chunk_overlap=strategy_params.get("chunk_overlap", 50)
        )
    elif strategy == "document":
        chunk_res = chunk_document_service(text=text)
    elif strategy == "semantic":
        chunk_res = chunk_semantic_service(
            text=text,
            threshold=strategy_params.get("threshold", 0.6)
        )
    else:  # default recursive
        chunk_res = chunk_recursive_service(
            text=text,
            chunk_size=strategy_params.get("chunk_size", 500),
            chunk_overlap=strategy_params.get("chunk_overlap", 50)
        )

    chunks = chunk_res.get("chunks", [])
    if not chunks:
        raise HTTPException(status_code=400, detail="Could not produce chunks for the provided resume text.")

    doc_metrics = req.candidate_metadata or {}
    if not doc_metrics and "metrics" in chunk_res:
        doc_metrics = chunk_res["metrics"]

    try:
        result = await run_in_threadpool(
            ingest_chunks_to_mongodb,
            source_type="resume",
            document_name=req.document_name or "Resume",
            strategy=strategy,
            chunks=chunks,
            source_url=None,
            strategy_params=strategy_params,
            document_metrics=doc_metrics,
            uri=req.mongodb_uri,
            db_name=req.db_name,
            target_collection=req.target_collection,
            mistral_api_key=req.mistral_api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume Ingestion Failed: {str(e)}")


@app.get("/api/download-guide")
async def download_study_guide():
    """
    Endpoint to generate and download the RAG Chunking Study Guide PDF.
    """
    from guide_generator import generate_study_guide
    
    # Store in the data directory
    pdf_path = os.path.join(os.path.dirname(__file__), "data", "RAG_Chunking_Study_Guide.pdf")
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    try:
        # Generate the PDF Study Guide with Testleaf Logo
        generate_study_guide(pdf_path)
        return FileResponse(
            path=pdf_path,
            filename="RAG_Chunking_Study_Guide.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate study guide PDF: {str(e)}"
        )


# Serve frontend static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)




