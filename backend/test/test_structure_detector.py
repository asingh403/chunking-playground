import sys
import os

# Ensure backend and backend/app are in sys.path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.analyzer import detect_structure_metrics

def test_highly_structured_document():
    # Markdown text with Title, Main Sections, Subsections, Lists, and a Table
    structured_text = """# Technical Guide to Chunking

## 1. Introduction
Chunking is a critical step in RAG.

### 1.1 Fixed Chunks
Fixed size chunking is simple.

- Bullet 1
- Bullet 2
- Bullet 3

| Strategy | Speed | Quality |
| --- | --- | --- |
| Fixed | Fast | Low |
| Semantic | Slower | High |
"""
    result = detect_structure_metrics(structured_text)
    
    assert result["score"] >= 30
    assert result["recommended_strategy"] == "document"
    assert result["confidence_pct"] > 50
    assert result["structure_present"]["title_found"] is True
    assert result["structure_present"]["main_sections_found"] is True
    assert result["structure_present"]["subsections_found"] is True
    assert result["structure_present"]["lists_found"] is True
    assert result["structure_present"]["tables_found"] is True
    assert result["counts"]["title"] == 1
    assert result["counts"]["main_sections"] == 1
    assert result["counts"]["subsections"] == 1
    assert result["counts"]["tables"] == 1
    print("test_highly_structured_document: PASSED")

def test_unstructured_document():
    # Plain text without any markdown or layout structure
    unstructured_text = """This is a completely plain text file.
It contains some general thoughts and notes.
There are no section headers, bullet lists, or tables.
Just random lines of text explaining something simple.
Hopefully, this is classified as low structure.
"""
    result = detect_structure_metrics(unstructured_text)
    
    assert result["score"] < 30
    assert result["recommended_strategy"] == "recursive"
    assert result["structure_present"]["title_found"] is False
    assert result["structure_present"]["main_sections_found"] is False
    assert result["structure_present"]["subsections_found"] is False
    assert result["structure_present"]["lists_found"] is False
    assert result["structure_present"]["tables_found"] is False
    print("test_unstructured_document: PASSED")

def test_html_metadata_integration():
    # Test that HTML metadata overrides/complements text analysis
    text = "Simple text content."
    html_meta = {
        "h1_count": 1,
        "h2_count": 2,
        "h3_count": 0,
        "h4_count": 0,
        "p_count": 5,
        "list_count": 1,
        "table_count": 1
    }
    result = detect_structure_metrics(text, html_metadata=html_meta)
    
    assert result["counts"]["title"] == 1
    assert result["counts"]["main_sections"] == 2
    assert result["counts"]["lists"] == 1
    assert result["counts"]["tables"] == 1
    assert result["structure_present"]["title_found"] is True
    assert result["structure_present"]["main_sections_found"] is True
    assert result["structure_present"]["lists_found"] is True
    assert result["structure_present"]["tables_found"] is True
    assert result["score"] >= 30
    assert result["recommended_strategy"] == "document"
    print("test_html_metadata_integration: PASSED")

if __name__ == "__main__":
    print("==========================================")
    print("RUNNING STRUCTURE DETECTOR UNIT TESTS")
    print("==========================================")
    test_highly_structured_document()
    test_unstructured_document()
    test_html_metadata_integration()
    print("==========================================")
    print("ALL STRUCTURE DETECTOR TESTS PASSED SUCCESS!")
    print("==========================================")
