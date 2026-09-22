import re
import tiktoken

def detect_document_type(text: str) -> str:
    """
    Scans for format-specific keywords/patterns to classify the document type:
    - FAQ
    - Policy
    - Research Paper
    - User Manual
    - Blog
    """
    text_lower = text.lower()
    
    # 1. FAQ check
    faq_keywords = ["faq", "frequently asked questions", "q:", "a:", "question:", "answer:", "q&a"]
    faq_matches = sum(1 for kw in faq_keywords if kw in text_lower)
    # Check for patterns like Q: or Question: at the beginning of lines
    qa_pattern_matches = len(re.findall(r'(?i)(?:^|\n)(?:q|question)\s*:', text))
    if faq_matches >= 3 or qa_pattern_matches >= 2:
        return "FAQ"
        
    # 2. Research Paper check
    research_keywords = ["abstract", "survey", "methodology", "references", "conclusions", "cite", "dataset", "framework", "introduction"]
    research_matches = sum(1 for kw in research_keywords if kw in text_lower)
    if research_matches >= 3 or "abstract:" in text_lower:
        return "Research Paper"
        
    # 3. Policy check
    policy_keywords = ["policy", "guidelines", "compliance", "employee", "hr", "procedure", "agreement", "regulation", "pto", "leave policy"]
    policy_matches = sum(1 for kw in policy_keywords if kw in text_lower)
    if policy_matches >= 3:
        return "Policy"
        
    # 4. User Manual check
    manual_keywords = ["manual", "user guide", "installation", "step 1", "instructions", "setup", "troubleshoot", "how to install"]
    manual_matches = sum(1 for kw in manual_keywords if kw in text_lower)
    if manual_matches >= 3:
        return "User Manual"
        
    # 5. Default to Blog
    return "Blog"

def analyze_document(text: str) -> dict:
    """
    Analyzes document readability metrics, tokens, and document type.
    """
    text_clean = text.strip()
    if not text_clean:
        return {
            "avg_sentence_length": 0.0,
            "paragraph_count": 0,
            "longest_paragraph_words": 0,
            "estimated_tokens": 0,
            "context_usage_pct": 0.0,
            "document_type": "Blog"
        }
        
    # Word count
    words = text_clean.split()
    total_words = len(words)
    
    # Sentence split and average sentence length
    # Split on periods, exclamation marks, question marks followed by space or EOF
    sentences = re.split(r'[.!?]+(?:\s+|$)', text_clean)
    sentences = [s for s in sentences if s.strip()]
    sentence_count = len(sentences) or 1
    avg_sentence_len = round(total_words / sentence_count, 1)
    
    # Paragraphs and longest paragraph word count
    paragraphs = re.split(r'\n\s*\n', text_clean)
    paragraphs = [p for p in paragraphs if p.strip()]
    paragraph_count = len(paragraphs) or 1
    
    longest_para_words = 0
    for p in paragraphs:
        p_words = len(p.split())
        if p_words > longest_para_words:
            longest_para_words = p_words
            
    # Estimated tokens
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = len(encoding.encode(text_clean))
    except Exception:
        # Fallback approximation
        tokens = total_words
        
    # Context Usage (against 8192 tokens window)
    context_limit = 8192
    context_usage_pct = round((tokens / context_limit) * 100, 1)
    if context_usage_pct > 100.0:
        context_usage_pct = 100.0
        
    # Document Type Detection
    doc_type = detect_document_type(text_clean)
    
    # Try to load html_structure if text matches session data
    html_metadata = None
    try:
        from session_manager import load_from_json
        session = load_from_json("metadata.json")
        if session and session.get("text") == text_clean:
            html_metadata = session.get("html_structure")
    except Exception:
        pass
        
    structure_analysis = detect_structure_metrics(text_clean, html_metadata)
    
    return {
        "avg_sentence_length": avg_sentence_len,
        "paragraph_count": paragraph_count,
        "longest_paragraph_words": longest_para_words,
        "estimated_tokens": tokens,
        "context_usage_pct": context_usage_pct,
        "document_type": doc_type,
        "structure_analysis": structure_analysis
    }

def detect_structure_metrics(text: str, html_metadata: dict = None) -> dict:
    import re
    # Initialize counts
    title_count = 0
    main_sections_count = 0
    subsections_count = 0
    lists_count = 0
    tables_count = 0
    
    # Priority 1 (from HTML parser if available)
    if html_metadata:
        title_count = html_metadata.get("h1_count", 0)
        main_sections_count = html_metadata.get("h2_count", 0)
        subsections_count = html_metadata.get("h3_count", 0) + html_metadata.get("h4_count", 0)
        lists_count = html_metadata.get("list_count", 0)
        tables_count = html_metadata.get("table_count", 0)
        
    # Standard text analysis heuristics (for Priority 1, 2, 3)
    lines = text.splitlines()
    
    # Heuristics checks
    # 1. Markdown headings (Priority 1)
    md_h1_count = len(re.findall(r'^#\s+\S+', text, re.MULTILINE))
    md_h2_count = len(re.findall(r'^##\s+\S+', text, re.MULTILINE))
    md_h3_h4_count = len(re.findall(r'^###{1,2}\s+\S+', text, re.MULTILINE))
    
    # 2. Numbered sections & title-style (Priority 2)
    numbered_sections = len(re.findall(r'^(?:[0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)\.\s+[A-Z].*', text, re.MULTILINE))
    
    # Bullet lists (Priority 2)
    bullet_lists = len(re.findall(r'^\s*[\-\*\u2022]\s+\S+', text, re.MULTILINE))
    
    # Indentation patterns (Priority 2)
    indented_lines = sum(1 for line in lines if line.startswith(('  ', '\t')) and line.strip())
    
    # Markdown tables (Priority 1 / 2)
    markdown_tables = len(re.findall(r'^\|.+\|$', text, re.MULTILINE))
    # Count how many tables exist. Typically a table has a header and a separator, so at least 3 lines
    table_estimate = markdown_tables // 3
    if table_estimate < 0:
        table_estimate = 0
        
    # Short title lines followed by longer content (Priority 3)
    semantic_headings = 0
    for idx, line in enumerate(lines):
        stripped = line.strip()
        # Short line (5 to 80 chars), starts with uppercase
        if 5 <= len(stripped) <= 80 and stripped and stripped[0].isupper():
            # Followed by a blank line and then a longer text line
            if idx + 2 < len(lines) and lines[idx + 1].strip() == "" and len(lines[idx + 2].strip()) > 100:
                # Make sure it's not already a markdown header or numbered section
                if not stripped.startswith('#') and not re.match(r'^(?:[0-9]+|[IVXLCDM]+)\.', stripped):
                    semantic_headings += 1

    # Merge HTML metadata with text analysis
    title_count = max(title_count, md_h1_count)
    main_sections_count = max(main_sections_count, md_h2_count + numbered_sections)
    subsections_count = max(subsections_count, md_h3_h4_count + semantic_headings)
    lists_count = max(lists_count, bullet_lists // 3 if bullet_lists > 0 else (1 if indented_lines > 5 else 0))
    tables_count = max(tables_count, table_estimate)
    
    # Structure Score & Confidence percentage calculation
    score = 0
    if title_count > 0:
        score += 15
    score += min(40, main_sections_count * 10)
    score += min(25, subsections_count * 5)
    score += min(20, lists_count * 10)
    score += min(20, tables_count * 10)
    
    confidence_pct = min(100, int((score / 90.0) * 100))
    if confidence_pct < 0:
        confidence_pct = 0
        
    # Check boxes indicators
    structure_present = {
        "title_found": title_count > 0,
        "main_sections_found": main_sections_count > 0,
        "subsections_found": subsections_count > 0,
        "lists_found": lists_count > 0 or bullet_lists > 0 or indented_lines > 3,
        "tables_found": tables_count > 0 or table_estimate > 0
    }
    
    # Recommendation Engine Decision Logic
    threshold = 30
    recommended_strategy = "document" if score >= threshold else "recursive"
    
    reasons = []
    if title_count > 0:
        reasons.append(f"{title_count} title{'s' if title_count > 1 else ''} detected")
    if main_sections_count > 0:
        reasons.append(f"{main_sections_count} section{'s' if main_sections_count > 1 else ''} detected")
    if subsections_count > 0:
        reasons.append(f"{subsections_count} subsection{'s' if subsections_count > 1 else ''} detected")
    if lists_count > 0 or bullet_lists > 0:
        reasons.append(f"{lists_count or 1} list{'s' if (lists_count > 1 or bullet_lists > 5) else ''} detected")
    if tables_count > 0:
        reasons.append(f"{tables_count} table{'s' if tables_count > 1 else ''} detected")
        
    reason_str = "No structural elements detected."
    if reasons:
        reason_str = " - " + "\n - ".join(reasons)
        
    return {
        "score": score,
        "confidence_pct": confidence_pct,
        "structure_present": structure_present,
        "recommended_strategy": recommended_strategy,
        "reason": reason_str,
        "counts": {
            "title": title_count,
            "main_sections": main_sections_count,
            "subsections": subsections_count,
            "lists": lists_count,
            "tables": tables_count
        }
    }
