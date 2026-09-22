import time
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_recursive_service(text: str, chunk_size: int, chunk_overlap: int) -> dict:
    """
    Slices text recursively using LangChain's RecursiveCharacterTextSplitter.
    Constructs a document paragraph-to-chunk hierarchy tree mapping,
    traces recursive traversal paths, boundary decisions, separator choices,
    origin tracking indices, and hierarchy preservation metrics.
    """
    start_time = time.perf_counter()
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    
    global_chunks = splitter.split_text(text)
    
    end_time = time.perf_counter()
    processing_time_ms = round((end_time - start_time) * 1000, 3)
    
    total_chunks = len(global_chunks)
    avg_size = round(sum(len(c) for c in global_chunks) / total_chunks, 1) if total_chunks > 0 else 0
    
    # 1. Chronological search to find start/end offset of each chunk in original text
    current_pos = 0
    chunk_spans = []
    for chunk in global_chunks:
        start = text.find(chunk, current_pos)
        if start == -1:
            start = text.find(chunk)  # Fallback search
        end = start + len(chunk)
        chunk_spans.append((start, end, chunk))
        current_pos = max(0, start + 1)
        
    # 2. Split text by \n\n to find paragraph spans
    paragraphs = text.split("\n\n")
    para_spans = []
    current_pos = 0
    for para in paragraphs:
        if not para.strip():
            continue
        start = text.find(para, current_pos)
        end = start + len(para)
        para_spans.append((p_start := start, p_end := end, para))
        current_pos = max(0, start + 1)
        
    # 3. Split text by \n to find line spans
    lines = text.split("\n")
    line_spans = []
    current_pos = 0
    for l_idx, line in enumerate(lines):
        start = text.find(line, current_pos)
        end = start + len(line)
        line_spans.append((start, end, line, l_idx + 1))
        current_pos = max(0, end)

    # 4. Aligner & Boundary Analyzer Loop
    formatted_chunks = []
    separator_counts = {"paragraph": 0, "line": 0, "word": 0, "character": 0, "document_end": 0}
    
    for idx, (start_char, end_char, chunk) in enumerate(chunk_spans):
        # Word and sentence break detections
        word_broken = False
        sentence_broken = False
        
        if end_char < len(text):
            last_char = text[end_char - 1]
            next_char = text[end_char]
            
            # Word boundary broken
            if last_char.isalnum() and next_char.isalnum():
                word_broken = True
                
            # Sentence boundary broken
            pre_text = text[:end_char]
            is_at_sentence_end = bool(re.search(r'[.!?]\s*$', pre_text)) or last_char in ['\n', '\r'] or next_char in ['\n', '\r']
            if not is_at_sentence_end:
                sentence_broken = True
                
        # Separator split level used
        split_level = "Document End"
        separator = "None"
        reason = "Reached the end of the document."
        
        if end_char < len(text):
            after_text = text[end_char:]
            if after_text.startswith("\n\n"):
                split_level = "Paragraph"
                separator = "\\n\\n"
                reason = "Chunk size reached at paragraph boundary."
                separator_counts["paragraph"] += 1
            elif after_text.startswith("\n"):
                split_level = "Line"
                separator = "\\n"
                reason = "Chunk size reached at line boundary."
                separator_counts["line"] += 1
            elif after_text.startswith(" "):
                split_level = "Word"
                separator = "\" \""
                reason = "Chunk size reached at word boundary."
                separator_counts["word"] += 1
            else:
                split_level = "Character"
                separator = "\"\""
                reason = "Chunk size limit reached. Split forced at character boundary inside a word."
                separator_counts["character"] += 1
        else:
            separator_counts["document_end"] += 1
            
        # Recursive traversal timeline decision path
        decision_path = {
            "paragraph": "Success" if split_level in ["Paragraph", "Document End"] else "Failed",
            "line": "Success" if split_level == "Line" else "Skipped" if split_level in ["Paragraph", "Document End"] else "Failed",
            "word": "Success" if split_level == "Word" else "Skipped" if split_level in ["Paragraph", "Line", "Document End"] else "Failed",
            "character": "Success" if split_level == "Character" else "Skipped"
        }
        
        # Origin Tracking
        c_para_idx = 1
        for p_idx, (p_start, p_end, _) in enumerate(para_spans):
            if p_start <= start_char <= p_end:
                c_para_idx = p_idx + 1
                break
                
        c_line_idx = 1
        for l_start, l_end, _, l_num in line_spans:
            if l_start <= start_char <= l_end:
                c_line_idx = l_num
                break
                
        # Chunk quality indicators
        if word_broken:
            quality = "Poor"
            quality_reason = "Alphanumeric word was split in half across chunks."
        elif sentence_broken:
            quality = "Moderate"
            quality_reason = "Sentence structure was split across chunks."
        elif split_level == "Line":
            quality = "Good"
            quality_reason = "Split occurred at a newline boundary; words and sentences were preserved."
        else:
            quality = "Excellent"
            quality_reason = "Split occurred at a natural paragraph or sentence boundary."
            
        # Chunk statistics
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
            "word_broken": word_broken,
            "sentence_broken": sentence_broken,
            "split_level": split_level,
            "separator": separator,
            "reason": reason,
            "decision_path": decision_path,
            "paragraph_index": c_para_idx,
            "line_index": c_line_idx,
            "quality": quality,
            "quality_reason": quality_reason,
            "stats": {
                "chars": c_chars,
                "words": c_words,
                "sentences": c_sentences,
                "paragraphs": c_paragraphs,
                "tokens": c_tokens
            }
        })

    # 5. Global Metrics & Preservation Calculation
    recursive_metrics = compute_boundaries_and_breaks(text, chunk_spans, para_spans, line_spans)
    
    # 6. Run Fixed Splitting comparison metrics
    fixed_chunk_spans = get_fixed_chunk_spans(text, chunk_size, chunk_overlap)
    fixed_metrics = compute_boundaries_and_breaks(text, fixed_chunk_spans, para_spans, line_spans)
    
    # 7. Construct paragraph sitemap tree
    hierarchy = []
    for p_idx, (p_start, p_end, p_text) in enumerate(para_spans):
        para_chunks = []
        for c_idx, (c_start, c_end, _) in enumerate(chunk_spans):
            if max(p_start, c_start) < min(p_end, c_end):
                para_chunks.append(c_idx + 1)
                
        title_text = p_text.strip().replace('\n', ' ')
        if len(title_text) > 80:
            title_text = title_text[:80] + "..."
            
        hierarchy.append({
            "paragraph_index": p_idx + 1,
            "text": title_text,
            "chunk_indices": para_chunks
        })
        
    return {
        "chunks": formatted_chunks,
        "hierarchy": hierarchy,
        "metrics": {
            "total_chunks": total_chunks,
            "avg_size": avg_size,
            "processing_time_ms": processing_time_ms,
            "paragraph_preservation": recursive_metrics["paragraph_preservation"],
            "line_preservation": recursive_metrics["line_preservation"],
            "word_breaks": recursive_metrics["word_breaks"],
            "character_breaks": recursive_metrics["sentence_breaks"], # Maps to sentence break count in dashboard
            "separator_counts": separator_counts
        },
        "comparison": {
            "fixed": {
                "paragraph_preservation": fixed_metrics["paragraph_preservation"],
                "line_preservation": fixed_metrics["line_preservation"],
                "word_breaks": fixed_metrics["word_breaks"],
                "sentence_breaks": fixed_metrics["sentence_breaks"]
            },
            "recursive": {
                "paragraph_preservation": recursive_metrics["paragraph_preservation"],
                "line_preservation": recursive_metrics["line_preservation"],
                "word_breaks": recursive_metrics["word_breaks"],
                "sentence_breaks": recursive_metrics["sentence_breaks"]
            }
        }
    }

def get_fixed_chunk_spans(text: str, chunk_size: int, chunk_overlap: int) -> list:
    spans = []
    if not text:
        return spans
    step = chunk_size - chunk_overlap
    if step <= 0:
        step = 1
    index = 0
    text_len = len(text)
    while index < text_len:
        end = index + chunk_size
        chunk = text[index:end]
        spans.append((index, min(text_len, end), chunk))
        index += step
        if end >= text_len:
            break
    return spans

def compute_boundaries_and_breaks(text: str, chunk_spans: list, para_spans: list, line_spans: list) -> dict:
    total_paras = len(para_spans)
    total_lines = len(line_spans)
    text_len = len(text)
    
    broken_paras = 0
    for p_start, p_end, _ in para_spans:
        for c_start, c_end, _ in chunk_spans:
            if (p_start < c_start < p_end) or (p_start < c_end < p_end):
                broken_paras += 1
                break
                
    broken_lines = 0
    for l_start, l_end, _, _ in line_spans:
        for c_start, c_end, _ in chunk_spans:
            if (l_start < c_start < l_end) or (l_start < c_end < l_end):
                broken_lines += 1
                break
                
    word_breaks = 0
    sentence_breaks = 0
    
    for c_start, c_end, _ in chunk_spans:
        if c_end < text_len:
            last_char = text[c_end - 1]
            next_char = text[c_end]
            
            # Word break detection
            if last_char.isalnum() and next_char.isalnum():
                word_breaks += 1
                
            # Sentence break detection
            pre_text = text[:c_end]
            is_at_sentence_end = bool(re.search(r'[.!?]\s*$', pre_text)) or last_char in ['\n', '\r'] or next_char in ['\n', '\r']
            if not is_at_sentence_end:
                sentence_breaks += 1
                
    para_preserv = round(((total_paras - broken_paras) / total_paras * 100), 1) if total_paras > 0 else 100.0
    line_preserv = round(((total_lines - broken_lines) / total_lines * 100), 1) if total_lines > 0 else 100.0
    
    return {
        "paragraph_preservation": para_preserv,
        "line_preservation": line_preserv,
        "word_breaks": word_breaks,
        "sentence_breaks": sentence_breaks
    }

