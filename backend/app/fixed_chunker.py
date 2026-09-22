import time

def chunk_fixed_size(text: str, chunk_size: int, chunk_overlap: int) -> list:
    """
    Slices text into character-based chunks of exact sizes with specific overlap.
    """
    chunks = []
    if not text:
        return chunks
        
    step = chunk_size - chunk_overlap
    if step <= 0:
        step = 1  # Fallback to avoid infinite loop
        
    index = 0
    while index < len(text):
        end = index + chunk_size
        chunk = text[index:end]
        chunks.append(chunk)
        
        index += step
        if end >= len(text):
            break
            
    return chunks

import re

def chunk_fixed_size_service(text: str, chunk_size: int, chunk_overlap: int) -> dict:
    """
    Service wrapper that slices text and measures performance metrics.
    Additionally computes detailed boundaries, overlap regions, word/sentence breaks,
    and individual chunk statistics for educational visualization.
    """
    start_time = time.perf_counter()
    
    formatted_chunks = []
    total_word_breaks = 0
    total_sentence_breaks = 0
    
    if not text:
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": [],
            "metrics": {
                "total_chunks": 0,
                "avg_size": 0.0,
                "processing_time_ms": processing_time_ms,
                "total_word_breaks": 0,
                "total_sentence_breaks": 0,
                "context_loss_risk": "Low"
            }
        }
        
    step = chunk_size - chunk_overlap
    if step <= 0:
        step = 1  # Fallback to avoid infinite loop
        
    index = 0
    idx = 0
    text_len = len(text)
    
    while index < text_len:
        end = index + chunk_size
        chunk = text[index:end]
        
        start_char = index
        end_char = min(text_len, end)
        
        # Overlap computation
        overlap_size = 0
        overlap_text = ""
        if idx > 0:
            prev_end = (idx - 1) * step + chunk_size
            if start_char < prev_end:
                overlap_size = prev_end - start_char
                overlap_text = text[start_char:prev_end]
                
        # Word boundary detection
        word_broken = False
        if end_char < text_len:
            last_char = text[end_char - 1]
            next_char = text[end_char]
            if last_char.isalnum() and next_char.isalnum():
                word_broken = True
                total_word_breaks += 1
                
        # Sentence boundary detection
        sentence_broken = False
        if end_char < text_len:
            pre_text = text[:end_char]
            last_char = text[end_char - 1]
            next_char = text[end_char]
            # If not at a sentence terminator or space/newline, it is broken
            is_at_sentence_end = bool(re.search(r'[.!?]\s*$', pre_text)) or last_char in ['\n', '\r'] or next_char in ['\n', '\r']
            if not is_at_sentence_end:
                sentence_broken = True
                total_sentence_breaks += 1
                
        # Statistics
        c_chars = len(chunk)
        c_words = len(chunk.split())
        c_sentences = len([s for s in re.split(r'[.!?]+(?:\s+|$)', chunk) if s.strip()])
        c_paragraphs = len([p for p in re.split(r'\n\s*\n', chunk) if p.strip()])
        c_tokens = max(1, round(c_chars / 4))
        
        formatted_chunks.append({
            "index": idx + 1,
            "text": chunk,
            "length": c_chars,
            "start_char": start_char,
            "end_char": end_char,
            "overlap_size": overlap_size,
            "overlap_text": overlap_text,
            "word_broken": word_broken,
            "sentence_broken": sentence_broken,
            "stats": {
                "chars": c_chars,
                "words": c_words,
                "sentences": c_sentences,
                "paragraphs": c_paragraphs,
                "tokens": c_tokens
            }
        })
        
        index += step
        idx += 1
        if end >= text_len:
            break
            
    end_time = time.perf_counter()
    processing_time_ms = round((end_time - start_time) * 1000, 3)
    
    total_chunks = len(formatted_chunks)
    avg_size = round(sum(len(c["text"]) for c in formatted_chunks) / total_chunks, 1) if total_chunks > 0 else 0
    
    # Determine context loss risk
    context_loss_risk = "Low"
    if total_sentence_breaks > 0 or total_word_breaks > 0:
        if (total_sentence_breaks + total_word_breaks) / total_chunks > 0.5:
            context_loss_risk = "High"
        else:
            context_loss_risk = "Medium"
            
    return {
        "chunks": formatted_chunks,
        "metrics": {
            "total_chunks": total_chunks,
            "avg_size": avg_size,
            "processing_time_ms": processing_time_ms,
            "total_word_breaks": total_word_breaks,
            "total_sentence_breaks": total_sentence_breaks,
            "context_loss_risk": context_loss_risk
        }
    }
