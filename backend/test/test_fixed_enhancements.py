import os
import sys
import httpx

# Add backend and backend/app to path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

def verify_fixed_enhancements():
    print("Testing Fixed-Size Educational Enhancements API response...")
    client = httpx.Client(base_url="http://127.0.0.1:8000")
    
    sample_text = (
        "This is sentence one. This is sentence two. "
        "Here is a very long sentence that has some words split up."
    )
    
    payload = {
        "text": sample_text,
        "chunk_size": 25,
        "chunk_overlap": 10
    }
    
    res = client.post("/chunk/fixed", json=payload)
    assert res.status_code == 200, f"API failed with status {res.status_code}"
    
    data = res.json()
    chunks = data["chunks"]
    metrics = data["metrics"]
    
    print(f"Total chunks generated: {len(chunks)}")
    assert len(chunks) > 0, "Should generate chunks"
    
    # Verify first chunk keys
    first_chunk = chunks[0]
    required_chunk_keys = [
        "start_char", "end_char", "overlap_size", 
        "overlap_text", "word_broken", "sentence_broken", "stats"
    ]
    for key in required_chunk_keys:
        assert key in first_chunk, f"Missing required chunk key: {key}"
        print(f" [PASS] Found chunk key: {key} (value: {first_chunk[key]})")
        
    # Verify stats keys
    stats = first_chunk["stats"]
    required_stats_keys = ["chars", "words", "sentences", "paragraphs", "tokens"]
    for key in required_stats_keys:
        assert key in stats, f"Missing stats key: {key}"
        print(f" [PASS] Found stats key: {key} (value: {stats[key]})")
        
    # Verify metrics keys
    required_metrics_keys = ["total_word_breaks", "total_sentence_breaks", "context_loss_risk"]
    for key in required_metrics_keys:
        assert key in metrics, f"Missing metrics key: {key}"
        print(f" [PASS] Found metrics key: {key} (value: {metrics[key]})")
        
    print("\nALL FIXED-SIZE CHARACTER CHUNKING ENHANCEMENTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        verify_fixed_enhancements()
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {str(e)}")
        sys.exit(1)
