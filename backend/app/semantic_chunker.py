import re
import time
import numpy as np
from sentence_transformers import SentenceTransformer

import threading

# Global model instance for caching
_model_instance = None
_cache_lock = threading.Lock()
_embedding_cache = {}

def get_sentence_transformer():
    """
    Returns the cached SentenceTransformer model instance.
    Loads it once on-demand.
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer('all-MiniLM-L6-v2')
    return _model_instance

def get_embeddings_cached(texts: list, model=None) -> np.ndarray:
    """
    Computes sentence/text embeddings with caching.
    Only encodes texts that are not already present in _embedding_cache.
    Thread-safe implementation.
    """
    global _embedding_cache
    if not texts:
        return np.empty((0, 384))
        
    if model is None:
        model = get_sentence_transformer()
        
    results = []
    missing_texts = []
    missing_indices = []
    
    with _cache_lock:
        for idx, t in enumerate(texts):
            if t in _embedding_cache:
                results.append(_embedding_cache[t])
            else:
                results.append(None)
                missing_texts.append(t)
                missing_indices.append(idx)
                
    if missing_texts:
        encoded = model.encode(missing_texts, convert_to_numpy=True)
        with _cache_lock:
            for idx, t, emb in zip(missing_indices, missing_texts, encoded):
                if t not in _embedding_cache:
                    if len(_embedding_cache) > 10000:
                        first_key = next(iter(_embedding_cache))
                        del _embedding_cache[first_key]
                    _embedding_cache[t] = emb
                results[idx] = _embedding_cache[t]
                
    return np.array(results)

def split_sentences(text: str) -> list:
    """
    Splits input text into individual sentences based on standard sentence delimiters.
    """
    # Regex splits by periods, questions, or exclamations followed by whitespace
    raw_sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in raw_sentences if s.strip()]

def cosine_similarity(u: np.ndarray, v: np.ndarray) -> float:
    """
    Computes cosine similarity between two 1D vectors.
    """
    dot = np.dot(u, v)
    norm_u = np.linalg.norm(u)
    norm_v = np.linalg.norm(v)
    if norm_u == 0.0 or norm_v == 0.0:
        return 0.0
    return float(dot / (norm_u * norm_v))

# Basic stop words list for keyword extraction
STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "at", 
    "by", "for", "with", "about", "against", "between", "into", "through", 
    "during", "before", "after", "above", "below", "to", "from", "up", "down", 
    "in", "out", "on", "off", "over", "under", "again", "further", "once", 
    "here", "there", "all", "any", "both", "each", "few", "more", "most", 
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", 
    "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", 
    "should", "now", "i", "me", "my", "myself", "we", "our", "ours", "ourselves", 
    "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", 
    "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", 
    "them", "their", "theirs", "themselves", "what", "which", "who", "whom", 
    "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", 
    "been", "being", "have", "has", "had", "having", "do", "does", "did", 
    "doing", "would", "should", "could", "ought", "also", "would", "outline", 
    "guidelines", "procedures", "various", "management"
}

def extract_keywords(text: str, num_words: int = 3) -> str:
    """
    Extracts the most frequent non-stopwords from a text string to act as a topic label.
    """
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    filtered = [w for w in words if w not in STOP_WORDS]
    if not filtered:
        return "General"
    from collections import Counter
    counts = Counter(filtered)
    common = counts.most_common(num_words)
    return ", ".join(w[0].capitalize() for w in common)

def chunk_semantic_service(text: str, threshold: float) -> dict:
    """
    Segments text semantically by splitting where the cosine similarity between
    consecutive sentence embeddings drops below a specified similarity threshold.
    """
    start_time = time.perf_counter()
    
    if not text.strip():
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": [],
            "metrics": {
                "total_chunks": 0,
                "avg_size": 0.0,
                "processing_time_ms": processing_time_ms
            }
        }
        
    sentences = split_sentences(text)
    
    if len(sentences) <= 1:
        # Single sentence or edge case
        chunk_text = text.strip()
        topic = extract_keywords(chunk_text)
        chunks = [{
            "index": 1,
            "text": chunk_text,
            "length": len(chunk_text),
            "topic": topic
        }]
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": chunks,
            "metrics": {
                "total_chunks": 1,
                "avg_size": float(len(chunk_text)),
                "processing_time_ms": processing_time_ms
            }
        }
        
    # Get model and calculate cached embeddings
    model = get_sentence_transformer()
    embeddings = get_embeddings_cached(sentences, model)
    
    # Calculate similarities between consecutive sentence embeddings
    similarities = []
    for i in range(len(embeddings) - 1):
        sim = cosine_similarity(embeddings[i], embeddings[i+1])
        similarities.append(sim)
        
    # Build semantic chunks
    chunks_list = []
    current_sentences = []
    sentence_records = []
    
    for idx, sentence in enumerate(sentences):
        current_sentences.append(sentence)
        
        # If it's not the last sentence and similarity to the next is below threshold, create chunk boundary
        if idx < len(sentences) - 1:
            sim_to_next = similarities[idx]
            split_created = sim_to_next < threshold
            
            # Extract topics for visual context
            current_topic = extract_keywords(" ".join(current_sentences))
            next_topic = extract_keywords(sentences[idx+1]) if split_created else current_topic
            
            sentence_records.append({
                "index": idx,
                "sentence_a": sentence,
                "sentence_b": sentences[idx+1],
                "similarity": round(float(sim_to_next) * 100, 1),
                "threshold": round(float(threshold) * 100, 1),
                "split_created": split_created,
                "topic_a": current_topic,
                "topic_b": next_topic
            })
            
            if split_created:
                chunk_text = " ".join(current_sentences).strip()
                chunks_list.append(chunk_text)
                current_sentences = []
                
    # Add final chunk
    if current_sentences:
        chunk_text = " ".join(current_sentences).strip()
        chunks_list.append(chunk_text)
        
    # Format return payload chunks list
    formatted_chunks = []
    for idx, chunk_text in enumerate(chunks_list):
        topic = extract_keywords(chunk_text)
        formatted_chunks.append({
            "index": idx + 1,
            "text": chunk_text,
            "length": len(chunk_text),
            "topic": topic
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
        },
        "sentence_similarities": sentence_records
    }
