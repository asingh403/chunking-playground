import time
# pyrefly: ignore [missing-import]
import numpy as np
from fixed_chunker import chunk_fixed_size
from semantic_chunker import get_sentence_transformer, cosine_similarity, get_embeddings_cached

def chunk_query_aware_service(text: str, query: str, chunk_size: int, chunk_overlap: int) -> dict:
    """
    Generates candidate chunks from the document using fixed-size splitting,
    then ranks them by cosine similarity to the user's query embedding.
    """
    start_time = time.perf_counter()
    
    if not text.strip() or not query.strip():
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": [],
            "metrics": {
                "total_chunks": 0,
                "avg_size": 0.0,
                "processing_time_ms": processing_time_ms
            }
        }
    
    # 1. Generate candidate chunks using fixed-size splitting
    raw_chunks = chunk_fixed_size(text, chunk_size, chunk_overlap)
    
    if not raw_chunks:
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": [],
            "metrics": {
                "total_chunks": 0,
                "avg_size": 0.0,
                "processing_time_ms": processing_time_ms
            }
        }
    
    # 2. Get sentence transformer model and compute cached embeddings
    model = get_sentence_transformer()
    
    # Embed the query
    query_embedding = get_embeddings_cached([query], model)[0]
    
    # Embed all candidate chunks
    chunk_embeddings = get_embeddings_cached(raw_chunks, model)
    
    # 3. Compute cosine similarity between query and each chunk
    scored_chunks = []
    for idx, (chunk_text, chunk_emb) in enumerate(zip(raw_chunks, chunk_embeddings)):
        sim = cosine_similarity(query_embedding, chunk_emb)
        scored_chunks.append({
            "original_index": idx + 1,
            "text": chunk_text,
            "length": len(chunk_text),
            "score": round(sim, 4)
        })
    
    # 4. Sort by similarity score descending (most relevant first)
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    
    # Re-index after sorting
    formatted_chunks = []
    for rank, chunk in enumerate(scored_chunks):
        formatted_chunks.append({
            "index": rank + 1,
            "text": chunk["text"],
            "length": chunk["length"],
            "score": chunk["score"],
            "original_index": chunk["original_index"]
        })
    
    end_time = time.perf_counter()
    processing_time_ms = round((end_time - start_time) * 1000, 3)
    
    total_chunks = len(formatted_chunks)
    avg_size = round(sum(c["length"] for c in formatted_chunks) / total_chunks, 1) if total_chunks > 0 else 0.0
    
    return {
        "chunks": formatted_chunks,
        "metrics": {
            "total_chunks": total_chunks,
            "avg_size": avg_size,
            "processing_time_ms": processing_time_ms
        }
    }
