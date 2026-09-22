import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
venv_site_packages = os.path.join(backend_dir, ".venv", "Lib", "site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

# pyrefly: ignore [missing-import]
import numpy as np

try:
    # pyrefly: ignore [missing-import]
    from pymongo import MongoClient
    # pyrefly: ignore [missing-import]
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure
    # pyrefly: ignore [missing-import]
    from pymongo.operations import SearchIndexModel
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

try:
    # pyrefly: ignore [missing-import]
    from dotenv import load_dotenv
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    load_dotenv(dotenv_path)
except ImportError:
    pass

try:
    from embedding_service import get_mistral_embeddings
except ImportError:
    from app.embedding_service import get_mistral_embeddings

# MongoDB Configuration from Environment or Defaults (Initial fallbacks)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "chunking_playground")
MONGODB_WEB_COLLECTION = os.getenv("MONGODB_WEB_COLLECTION", "web_url_chunks")
MONGODB_DOC_COLLECTION = os.getenv("MONGODB_DOC_COLLECTION", "document_chunks")
MONGODB_RESUME_COLLECTION = os.getenv("MONGODB_RESUME_COLLECTION", "resume_chunks")
MONGODB_INDEX_NAME = os.getenv("MONGODB_INDEX_NAME", "vector_index")
MISTRAL_EMBED_MODEL = os.getenv("MISTRAL_EMBED_MODEL", "mistral-embed")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "1024"))

_mongo_clients: Dict[str, Any] = {}

def reload_env_vars():
    """Reloads .env variables dynamically so configuration changes take effect without server restart."""
    try:
        # pyrefly: ignore [missing-import]
        from dotenv import load_dotenv
        dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        load_dotenv(dotenv_path, override=True)
    except Exception:
        pass

def get_mongodb_config() -> Dict[str, Any]:
    """Returns the latest MongoDB and Mistral configuration directly from the environment / .env."""
    reload_env_vars()
    return {
        "uri": os.getenv("MONGODB_URI", MONGODB_URI),
        "db_name": os.getenv("MONGODB_DB_NAME", MONGODB_DB_NAME),
        "web_collection": os.getenv("MONGODB_WEB_COLLECTION", MONGODB_WEB_COLLECTION),
        "doc_collection": os.getenv("MONGODB_DOC_COLLECTION", MONGODB_DOC_COLLECTION),
        "resume_collection": os.getenv("MONGODB_RESUME_COLLECTION", MONGODB_RESUME_COLLECTION),
        "index_name": os.getenv("MONGODB_INDEX_NAME", MONGODB_INDEX_NAME),
        "mistral_model": os.getenv("MISTRAL_EMBED_MODEL", MISTRAL_EMBED_MODEL),
        "dimensions": int(os.getenv("EMBEDDING_DIMENSION", str(EMBEDDING_DIMENSION))),
    }

def get_mongo_client(uri: Optional[str] = None):
    """
    Returns a cached MongoDB client with serverSelectionTimeoutMS=3000
    to ensure rapid fallback/error handling when MongoDB is unreachable.
    """
    global _mongo_clients
    if not PYMONGO_AVAILABLE:
        raise RuntimeError("pymongo package is not installed. Please run 'pip install pymongo'.")
        
    cfg = get_mongodb_config()
    connection_uri = uri or cfg["uri"]
    if connection_uri not in _mongo_clients:
        _mongo_clients[connection_uri] = MongoClient(
            connection_uri,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000
        )
    return _mongo_clients[connection_uri]

def get_database(uri: Optional[str] = None, db_name: Optional[str] = None):
    """
    Returns the target database instance.
    """
    cfg = get_mongodb_config()
    client = get_mongo_client(uri)
    target_db = db_name or cfg["db_name"]
    return client[target_db]

def get_target_collection_name(source_type: Optional[str] = None) -> str:
    """
    Determines the appropriate MongoDB collection based on source type:
    - 'resume' / 'resumes' / 'cv' -> 'resume_chunks'
    - 'web_url' / 'url' / 'confluence' / 'web' -> 'web_url_chunks'
    - 'document' / 'upload' / 'pdf' / 'docx' / 'txt' / 'sample' -> 'document_chunks'
    """
    cfg = get_mongodb_config()
    if not source_type:
        return cfg["doc_collection"]
        
    st = str(source_type).lower().strip()
    if st in ["resume", "resumes", "cv"]:
        return cfg["resume_collection"]
    if st in ["web_url", "url", "confluence", "web", "web page", "webpage"]:
        return cfg["web_collection"]
    return cfg["doc_collection"]

def ensure_vector_search_index(
    collection: Any,
    index_name: str = MONGODB_INDEX_NAME,
    dimensions: int = EMBEDDING_DIMENSION
) -> Dict[str, Any]:
    """
    Ensures that a MongoDB Atlas Vector Search index exists for the collection.
    If the index does not exist, registers the vectorSearch index model.
    """
    try:
        if not hasattr(collection, "list_search_indexes") or not hasattr(collection, "create_search_index"):
            return {"status": "skipped", "message": "Search index operations not supported in this client environment."}
            
        existing = list(collection.list_search_indexes())
        existing_names = [idx.get("name") for idx in existing if isinstance(idx, dict)]
        if index_name in existing_names:
            return {"status": "exists", "index_name": index_name}

        index_model = SearchIndexModel(
            definition={
                "fields": [
                    {
                        "type": "vector",
                        "path": "embedding",
                        "numDimensions": dimensions,
                        "similarity": "cosine"
                    },
                    {
                        "type": "filter",
                        "path": "document_name"
                    },
                    {
                        "type": "filter",
                        "path": "source_type"
                    },
                    {
                        "type": "filter",
                        "path": "chunk_id"
                    }
                ]
            },
            name=index_name,
            type="vectorSearch"
        )
        created_name = collection.create_search_index(model=index_model)
        return {"status": "created", "index_name": created_name}
    except Exception as e:
        # Atlas might be in local mongomock or non-Atlas cluster, which is non-fatal
        return {"status": "skipped", "error": str(e)}

def check_mongo_connection(uri: Optional[str] = None, db_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Pings the MongoDB server to verify health and connectivity.
    Returns status and current document counts for each collection.
    """
    cfg = get_mongodb_config()
    connection_uri = uri or cfg["uri"]
    target_db = db_name or cfg["db_name"]
    web_coll = cfg["web_collection"]
    doc_coll = cfg["doc_collection"]
    resume_coll = cfg["resume_collection"]
    idx_name = cfg["index_name"]

    if not PYMONGO_AVAILABLE:
        return {
            "connected": False,
            "error": "pymongo library is not installed in the environment.",
            "database": target_db,
            "uri": connection_uri
        }
        
    try:
        client = get_mongo_client(connection_uri)
        client.admin.command('ping')
        db = client[target_db]
        
        # Gather collection stats
        web_count = db[web_coll].count_documents({}) if web_coll in db.list_collection_names() else 0
        doc_count = db[doc_coll].count_documents({}) if doc_coll in db.list_collection_names() else 0
        resume_count = db[resume_coll].count_documents({}) if resume_coll in db.list_collection_names() else 0
        
        return {
            "connected": True,
            "database": target_db,
            "uri": connection_uri,
            "collections": {
                "web_url": web_coll,
                "document": doc_coll,
                "resume": resume_coll
            },
            "index_name": idx_name,
            "counts": {
                web_coll: web_count,
                doc_coll: doc_count,
                resume_coll: resume_count
            }
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        return {
            "connected": False,
            "error": f"Unable to reach MongoDB at {connection_uri}. Ensure MongoDB service is running.",
            "detail": str(e),
            "database": target_db,
            "uri": connection_uri
        }
    except Exception as e:
        return {
            "connected": False,
            "error": f"MongoDB connection error: {str(e)}",
            "database": target_db,
            "uri": connection_uri
        }

def ingest_chunks_to_mongodb(
    source_type: str,
    document_name: str,
    strategy: str,
    chunks: List[Any],
    source_url: Optional[str] = None,
    strategy_params: Optional[Dict[str, Any]] = None,
    document_metrics: Optional[Dict[str, Any]] = None,
    uri: Optional[str] = None,
    db_name: Optional[str] = None,
    target_collection: Optional[str] = None,
    mistral_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Persists document chunks into MongoDB as SEPARATE individual documents.
    Every chunk document contains:
    - Text & boundaries
    - Document and candidate metadata
    - 1,024-dimensional Mistral embedding vector ('mistral-embed')
    - Vector search readiness metadata
    """
    if not PYMONGO_AVAILABLE:
        raise RuntimeError("pymongo library is not installed.")
        
    if not chunks or len(chunks) == 0:
        raise ValueError("No chunks provided to ingest into MongoDB.")
        
    cfg = get_mongodb_config()
    connection_uri = uri or cfg["uri"]
    target_db = db_name or cfg["db_name"]
    client = get_mongo_client(connection_uri)
    try:
        client.admin.command('ping')
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        raise RuntimeError(f"Cannot connect to MongoDB at {connection_uri}. Please verify that MongoDB is running.") from e

    db = client[target_db]
    collection_name = target_collection or get_target_collection_name(source_type)
    collection = db[collection_name]
    
    # Extract clean text and normalize chunk objects
    normalized_chunks = []
    chunk_texts = []
    for idx, c in enumerate(chunks, 1):
        if isinstance(c, dict):
            chunk_copy = dict(c)
            cid = chunk_copy.get("chunk_id") or chunk_copy.get("index") or chunk_copy.get("id") or idx
            chunk_copy["chunk_id"] = cid
            chunk_text = str(chunk_copy.get("text", "")).strip()
            chunk_copy["text"] = chunk_text
            normalized_chunks.append(chunk_copy)
            chunk_texts.append(chunk_text)
        elif isinstance(c, str):
            c_clean = c.strip()
            normalized_chunks.append({
                "chunk_id": idx,
                "text": c_clean,
                "char_count": len(c_clean)
            })
            chunk_texts.append(c_clean)
        else:
            c_str = str(c).strip()
            normalized_chunks.append({
                "chunk_id": idx,
                "text": c_str,
                "char_count": len(c_str)
            })
            chunk_texts.append(c_str)

    # Generate 1,024-dimensional Mistral embeddings for each chunk
    embeddings = get_mistral_embeddings(
        texts=chunk_texts,
        model=cfg["mistral_model"],
        api_key=mistral_api_key,
        dimensions=cfg["dimensions"]
    )

    ingestion_time = datetime.now(timezone.utc).isoformat()
    doc_id = str(uuid.uuid4())
    
    # Build individual MongoDB documents for each chunk
    chunk_documents = []
    for idx, (chunk_item, emb) in enumerate(zip(normalized_chunks, embeddings), 1):
        chunk_text = chunk_item.get("text", "")
        
        # Build metadata dictionary preserving document metrics, candidate details, and chunk properties
        meta = dict(document_metrics or {})
        meta["total_chunks"] = len(normalized_chunks)
        meta["chunk_index"] = idx
        
        # Add chunk-specific metadata tags if present
        for key in ["section", "topic", "stats", "overlap_size", "overlap_text", "relevance_score", "reason", "title"]:
            if key in chunk_item and chunk_item[key] is not None:
                meta[key] = chunk_item[key]

        doc = {
            "document_id": doc_id,
            "document_name": document_name or "Untitled Document",
            "source_type": source_type or "document",
            "source_url": source_url,
            "strategy": strategy or "unknown",
            "strategy_params": strategy_params or {},
            "chunk_id": chunk_item.get("chunk_id", idx),
            "chunk_index": idx,
            "total_chunks": len(normalized_chunks),
            "text": chunk_text,
            "char_count": len(chunk_text),
            "start_char": chunk_item.get("start_char"),
            "end_char": chunk_item.get("end_char"),
            "overlap_size": chunk_item.get("overlap_size", 0),
            "metadata": meta,
            "embedding": emb,  # Exactly 1,024 dimensions
            "embedding_model": cfg["mistral_model"],
            "embedding_dimensions": len(emb),
            "ingested_at": ingestion_time
        }
        chunk_documents.append(doc)

    # Insert individual chunk documents into MongoDB
    insert_result = collection.insert_many(chunk_documents)
    inserted_ids_str = [str(_id) for _id in insert_result.inserted_ids]

    # Ensure/register Atlas vector search index definition on the collection
    index_info = ensure_vector_search_index(collection, index_name=cfg["index_name"], dimensions=cfg["dimensions"])

    return {
        "success": True,
        "message": f"Successfully ingested {len(chunk_documents)} separate chunk documents with 1,024-dim Mistral embeddings into collection '{collection_name}'",
        "inserted_id": inserted_ids_str[0] if inserted_ids_str else "",
        "inserted_ids": inserted_ids_str,
        "collection": collection_name,
        "chunk_count": len(chunk_documents),
        "document_id": doc_id,
        "document_name": document_name or "Untitled Document",
        "source_type": source_type or "document",
        "strategy": strategy or "unknown",
        "embedding_model": cfg["mistral_model"],
        "embedding_dimensions": cfg["dimensions"],
        "vector_search_ready": True,
        "index_info": index_info,
        "ingested_at": ingestion_time
    }

def vector_search_chunks(
    query: str,
    collection_name: Optional[str] = None,
    top_k: int = 5,
    source_type: Optional[str] = None,
    uri: Optional[str] = None,
    db_name: Optional[str] = None,
    mistral_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs vector similarity search over individual chunk documents.
    Uses MongoDB Atlas $vectorSearch pipeline with fallback to client-side
    cosine similarity when search indexes are still building or in local mocks.
    """
    if not query.strip():
        return {"chunks": [], "query": query, "total_found": 0}

    cfg = get_mongodb_config()
    connection_uri = uri or cfg["uri"]
    target_db = db_name or cfg["db_name"]
    client = get_mongo_client(connection_uri)
    db = client[target_db]
    coll_name = collection_name or get_target_collection_name(source_type)
    collection = db[coll_name]

    # Generate 1,024-dimensional Mistral embedding for user query
    query_embs = get_mistral_embeddings(
        texts=[query],
        model=cfg["mistral_model"],
        api_key=mistral_api_key,
        dimensions=cfg["dimensions"]
    )
    query_vec = query_embs[0]

    # 1. Attempt Atlas $vectorSearch
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": cfg["index_name"],
                    "path": "embedding",
                    "queryVector": query_vec,
                    "numCandidates": max(top_k * 5, 20),
                    "limit": top_k
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "chunk_id": 1,
                    "chunk_index": 1,
                    "document_name": 1,
                    "source_type": 1,
                    "strategy": 1,
                    "text": 1,
                    "char_count": 1,
                    "metadata": 1,
                    "embedding_model": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        results = list(collection.aggregate(pipeline))
        if results and len(results) > 0:
            for r in results:
                r["_id"] = str(r["_id"])
                if "score" in r:
                    r["score"] = round(float(r["score"]), 4)
            return {
                "success": True,
                "mode": "atlas_vector_search",
                "query": query,
                "collection": coll_name,
                "total_found": len(results),
                "chunks": results
            }
    except Exception as atlas_err:
        pass

    # 2. Client-side Cosine Similarity Fallback
    # (guarantees instantaneous results while Atlas Search index is building or in local test environments)
    docs = list(collection.find({"embedding": {"$exists": True}}).limit(200))
    scored = []
    q_norm = np.linalg.norm(query_vec)
    for doc in docs:
        d_emb = doc.get("embedding", [])
        if len(d_emb) == len(query_vec):
            dot = np.dot(query_vec, d_emb)
            d_norm = np.linalg.norm(d_emb)
            sim = float(dot / (q_norm * d_norm)) if (q_norm > 0 and d_norm > 0) else 0.0
            doc_clean = {
                "_id": str(doc["_id"]),
                "chunk_id": doc.get("chunk_id"),
                "chunk_index": doc.get("chunk_index"),
                "document_name": doc.get("document_name"),
                "source_type": doc.get("source_type"),
                "strategy": doc.get("strategy"),
                "text": doc.get("text"),
                "char_count": doc.get("char_count"),
                "metadata": doc.get("metadata", {}),
                "embedding_model": doc.get("embedding_model", cfg["mistral_model"]),
                "score": round(sim, 4)
            }
            scored.append(doc_clean)
    
    scored.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored[:top_k]
    return {
        "success": True,
        "mode": "cosine_similarity_direct",
        "query": query,
        "collection": coll_name,
        "total_found": len(top_results),
        "chunks": top_results
    }

