import re
import time

# Regex patterns for matching structural headings
HEADING_PATTERNS = [
    # 1. Markdown headings: # Heading or ## Subheading
    r'^#{1,6}\s+(.+)$',
    
    # 2. Numbered sections: 1. Purpose or 2.1 Annual PTO or I. Introduction
    r'^(?:[0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)\.\s+([A-Z].+)$',
    
    # 3. QA headings: Q: What are core hours? or Question: Standard working hours
    r'^(?:Q|Question)\s*:\s*(.+)$',
    
    # 4. Common standard sections (exact case-insensitive match on a standalone line)
    r'^(Abstract|Introduction|Methodology|Results|Conclusion|References|Summary)(?:\s*:)?\s*$',
    
    # 5. All-caps standalone title lines (5 to 80 chars)
    r'^([A-Z\s\d\-\(\)\.,&]{5,80})\s*$'
]

def get_heading_info(stripped: str) -> tuple:
    """
    Parses a heading line and returns a tuple: (heading_name, level_int, level_str)
    """
    # 1. Check Markdown headings
    md_match = re.match(r'^(#{1,6})\s+(.+)$', stripped)
    if md_match:
        hashes = md_match.group(1)
        name = md_match.group(2).strip()
        level = len(hashes)
        return name, level, f"H{level}"
        
    # 2. Check Standard Section Names
    std_match = re.match(r'^(Abstract|Introduction|Methodology|Results|Conclusion|References|Summary)(?:\s*:)?\s*$', stripped, re.IGNORECASE)
    if std_match:
        name = std_match.group(1).strip()
        return name, 1, "H1"
        
    # 3. Check Numbered Sections
    num_match = re.match(r'^((?:[0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)\.)\s+([A-Z].+)$', stripped)
    if num_match:
        num_part = num_match.group(1)
        name = num_match.group(2).strip()
        dots_count = num_part.count('.')
        level = max(1, min(4, dots_count))
        return name, level, f"H{level}"
        
    # 4. Check QA
    qa_match = re.match(r'^(?:Q|Question)\s*:\s*(.+)$', stripped, re.IGNORECASE)
    if qa_match:
        name = qa_match.group(1).strip()
        return name, 2, "H2"
        
    # 5. Check All-caps standalone title lines
    caps_match = re.match(r'^([A-Z\s\d\-\(\)\.,&]{5,80})\s*$', stripped)
    if caps_match:
        name = caps_match.group(1).strip()
        return name, 1, "H1"
        
    return stripped, 1, "H1"

def chunk_document_service(text: str) -> dict:
    """
    Chunks document based on detected structural elements: titles, headings, and sections.
    """
    start_time = time.perf_counter()
    
    if not text.strip():
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": [],
            "hierarchy": [],
            "metrics": {
                "total_chunks": 0,
                "avg_size": 0.0,
                "processing_time_ms": processing_time_ms,
                "analytics": {
                    "total_headings": 0,
                    "total_subheadings": 0,
                    "total_sections": 0,
                    "total_chunks": 0
                },
                "preservation_scores": {
                    "headings_preserved": 100,
                    "sections_preserved": 100,
                    "subsections_preserved": 100,
                    "overall_preservation": 100
                }
            }
        }
        
    lines = text.splitlines()
    compiled_patterns = [re.compile(pat) for pat in HEADING_PATTERNS]
    
    # List of tuple lists/dicts: [{"name": name, "level_int": level, "level": level_str, "line_index": idx}]
    detected_headings = []
    
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
            
        is_heading = False
        
        for pat in compiled_patterns:
            match = pat.match(stripped)
            if match:
                is_heading = True
                break
                
        if is_heading:
            # Prevent false positives on numbered list items inside paragraphs:
            # Heading must be markdown or QA, OR must be preceded by an empty line (or start of doc)
            # and satisfy a reasonable heading length threshold.
            is_valid_heading = True
            
            if not (stripped.startswith('#') or stripped.upper().startswith('Q:') or stripped.upper().startswith('QUESTION:')):
                if idx > 0 and lines[idx - 1].strip() != "":
                    is_valid_heading = False
                if len(stripped) > 100:
                    is_valid_heading = False
            
            if is_valid_heading:
                name, level_int, level_str = get_heading_info(stripped)
                detected_headings.append({
                    "name": name,
                    "level_int": level_int,
                    "level": level_str,
                    "line_index": idx
                })
                
    # If no headings are detected, the whole document is one section
    if not detected_headings:
        detected_headings.append({
            "name": "Document Body",
            "level_int": 1,
            "level": "H1",
            "line_index": 0
        })
    elif detected_headings[0]["line_index"] > 0:
        # If the first heading starts later, insert an Introduction/Header section at the start
        detected_headings.insert(0, {
            "name": "Header",
            "level_int": 1,
            "level": "H1",
            "line_index": 0
        })
        
    # Build hierarchy tree/parents
    headings_data = []
    for i, heading in enumerate(detected_headings):
        parent = "Document"
        for prev in reversed(headings_data):
            if prev["level_int"] < heading["level_int"]:
                parent = prev["name"]
                break
        headings_data.append({
            "name": heading["name"],
            "level_int": heading["level_int"],
            "level": heading["level"],
            "parent": parent,
            "line_index": heading["line_index"]
        })
        
    chunks = []
    num_sections = len(headings_data)
    
    for i in range(num_sections):
        curr_section = headings_data[i]
        start_line_idx = curr_section["line_index"]
        end_line_idx = headings_data[i+1]["line_index"] if i + 1 < num_sections else len(lines)
        
        # Extract section text
        section_lines = lines[start_line_idx:end_line_idx]
        section_text = "\n".join(section_lines).strip()
        
        if section_text:
            chunk_num = len(chunks) + 1
            words = section_text.split()
            sentences = [s for s in re.split(r'(?<=[.!?])\s+', section_text) if s.strip()]
            paragraphs = [p for p in section_text.split('\n\n') if p.strip()]
            tokens = int(len(section_text) / 4)
            chunks.append({
                "index": chunk_num,
                "text": section_text,
                "length": len(section_text),
                "heading": curr_section["name"],
                "metadata": {
                    "section_name": curr_section["name"],
                    "level": curr_section["level"],
                    "parent": curr_section["parent"],
                    "order": i + 1,
                    "chunk_number": chunk_num
                },
                "stats": {
                    "chars": len(section_text),
                    "words": len(words),
                    "sentences": len(sentences),
                    "paragraphs": len(paragraphs),
                    "tokens": tokens
                }
            })
            
    # Format hierarchy array for frontend tree navigation
    hierarchy = []
    for i, h in enumerate(headings_data):
        hierarchy.append({
            "heading": h["name"],
            "level": h["level"],
            "parent": h["parent"],
            "order": i + 1,
            "chunk_index": i + 1  # 1-to-1 mapping in structure chunking
        })

    end_time = time.perf_counter()
    processing_time_ms = round((end_time - start_time) * 1000, 3)
    
    total_chunks = len(chunks)
    avg_size = round(sum(c["length"] for c in chunks) / total_chunks, 1) if total_chunks > 0 else 0.0
    
    # Calculate Analytics
    total_headings = len([h for h in headings_data if h["name"] not in ("Header", "Document Body")])
    total_subheadings = len([h for h in headings_data if h["level_int"] > 1])
    total_sections = len([h for h in headings_data if h["level_int"] == 1])
    
    return {
        "chunks": chunks,
        "hierarchy": hierarchy,
        "metrics": {
            "total_chunks": total_chunks,
            "avg_size": avg_size,
            "processing_time_ms": processing_time_ms,
            "analytics": {
                "total_headings": total_headings,
                "total_subheadings": total_subheadings,
                "total_sections": total_sections,
                "total_chunks": total_chunks
            },
            "preservation_scores": {
                "headings_preserved": 100,
                "sections_preserved": 100,
                "subsections_preserved": 100,
                "overall_preservation": 100
            }
        }
    }

