import sys
import os

# Add backend and backend/app to path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from semantic_chunker import chunk_semantic_service

def test_semantic_enhancements():
    sample_text = (
        "FastAPI is a modern, fast (high-performance) web framework for building APIs with Python. "
        "It is based on standard Python type hints. "
        "In contrast, apples are sweet, round fruits produced by apple trees. "
        "They are rich in vitamins and fiber."
    )
    threshold = 0.5
    result = chunk_semantic_service(sample_text, threshold)
    
    assert "chunks" in result, "Result must contain chunks"
    assert "sentence_similarities" in result, "Result must contain sentence_similarities"
    
    similarities = result["sentence_similarities"]
    print(f"Number of sentence transitions analyzed: {len(similarities)}")
    assert len(similarities) > 0, "There should be calculated similarities"
    
    for idx, record in enumerate(similarities):
        print(f"Transition {idx}:")
        print(f"  Sentence A: '{record['sentence_a']}'")
        print(f"  Sentence B: '{record['sentence_b']}'")
        print(f"  Similarity: {record['similarity']}% (Threshold: {record['threshold']}%)")
        print(f"  Split Created: {record['split_created']}")
        print(f"  Topic A: '{record['topic_a']}' | Topic B: '{record['topic_b']}'")
        
        # Verify required keys
        for key in ["sentence_a", "sentence_b", "similarity", "threshold", "split_created", "topic_a", "topic_b"]:
            assert key in record, f"Key '{key}' missing from similarity record"
            
    print("ALL SEMANTIC BACKEND ENHANCEMENTS TESTS PASSED.")

if __name__ == "__main__":
    test_semantic_enhancements()
