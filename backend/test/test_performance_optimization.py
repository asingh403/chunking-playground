import os
import sys
import time
import numpy as np
import httpx

# Add backend and backend/app to path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from semantic_chunker import get_embeddings_cached
from session_manager import save_to_json, load_from_json, clear_session_data, DATA_DIR

def test_embedding_cache():
    print("Testing embedding cache latency...")
    test_sentences = ["Caching test sentence A.", "Caching test sentence B."]
    
    # First call: cache miss, runs model encode
    t0 = time.perf_counter()
    embs1 = get_embeddings_cached(test_sentences)
    t1 = time.perf_counter()
    first_duration_ms = (t1 - t0) * 1000
    
    # Second call: cache hit, loads from dict
    t2 = time.perf_counter()
    embs2 = get_embeddings_cached(test_sentences)
    t3 = time.perf_counter()
    second_duration_ms = (t3 - t2) * 1000
    
    print(f"First run duration (encode): {first_duration_ms:.2f} ms")
    print(f"Second run duration (cache hit): {second_duration_ms:.2f} ms")
    
    assert embs1.shape == embs2.shape, "Embedding shapes must match"
    assert np.allclose(embs1, embs2), "Embeddings must be identical"
    assert second_duration_ms < first_duration_ms, "Cached call must be faster than encode call"
    # Usually cache hits take < 0.2ms, while model runs take 10ms+
    assert second_duration_ms < 2.0, f"Cache hit took too long: {second_duration_ms:.2f} ms"
    print("[PASS] Embedding cache works and returns accurate cached arrays instantly.")

def test_session_manager():
    print("Testing session manager operations...")
    clear_session_data()
    
    # Save mock metadata
    metadata = {
        "text": "Hello world from session manager tests",
        "filename": "session_test.txt",
        "file_type": "txt",
        "metadata": {"word_count": 6}
    }
    save_to_json("metadata.json", metadata)
    
    # Load back
    loaded = load_from_json("metadata.json")
    assert loaded == metadata, f"Loaded metadata does not match: {loaded} vs {metadata}"
    
    # Save mock chunks
    chunks_data = {
        "strategy": "fixed",
        "params": {"chunk_size": 20},
        "result": {"chunks": [{"index": 1, "text": "Hello world"}]}
    }
    save_to_json("chunks.json", chunks_data)
    
    loaded_chunks = load_from_json("chunks.json")
    assert loaded_chunks == chunks_data, "Loaded chunks do not match"
    
    # Verify files exist in DATA_DIR
    assert os.path.exists(os.path.join(DATA_DIR, "metadata.json")), "metadata.json file missing"
    assert os.path.exists(os.path.join(DATA_DIR, "chunks.json")), "chunks.json file missing"
    
    # Clear session
    clear_session_data()
    assert not os.path.exists(os.path.join(DATA_DIR, "metadata.json")), "metadata.json should be deleted"
    assert not os.path.exists(os.path.join(DATA_DIR, "chunks.json")), "chunks.json should be deleted"
    
    print("[PASS] Session manager saves, loads, and clears JSON files correctly.")

def test_endpoints():
    print("Testing API session load/clear endpoints...")
    client = httpx.Client(base_url="http://127.0.0.1:8000")
    
    # Clear session first
    res_clear = client.post("/session/clear")
    assert res_clear.status_code == 200
    assert res_clear.json()["status"] == "success"
    
    # Load empty session
    res_load1 = client.get("/session/load")
    assert res_load1.status_code == 200
    assert res_load1.json()["metadata"] is None
    
    # Mock an upload
    upload_payload = {
        "text": "This is a test upload text for session",
        "filename": "upload.txt",
        "file_type": "txt",
        "metadata": {"char_count": 100}
    }
    save_to_json("metadata.json", upload_payload)
    
    # Load filled session
    res_load2 = client.get("/session/load")
    assert res_load2.status_code == 200
    assert res_load2.json()["metadata"] == upload_payload
    
    # Clean up again
    res_clear2 = client.post("/session/clear")
    assert res_clear2.status_code == 200
    
    print("[PASS] API routes for session load and clear operate correctly.")

if __name__ == "__main__":
    try:
        test_embedding_cache()
        print("-" * 50)
        test_session_manager()
        print("-" * 50)
        test_endpoints()
        print("\nALL PERFORMANCE OPTIMIZATION VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    except AssertionError as e:
        print(f"\n[FAIL] Test assertion failed: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error during verification: {str(e)}")
        sys.exit(1)
