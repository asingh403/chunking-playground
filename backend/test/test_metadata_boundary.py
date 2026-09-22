"""
Unit tests for boundary-driven metadata-aware chunking and domain discovery.
"""
import os
import sys

# Ensure backend and backend/app are in sys.path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from metadata_chunker import chunk_metadata_service, MetadataDiscoveryEngine, BoundaryDetector

def test_metadata_discovery_heuristics():
    print("Test 1: Verifying domain classification heuristics...")
    
    banking_text = "Interest rates on our personal loan products are set by credit score tiers. Home mortgage rates are fixed."
    legal_text = "This RESIDENTIAL LEASE AGREEMENT is made between Landlord and Tenant for the leased premises."
    medical_text = "Patient presents with acute appendicitis. Treatment: schedule emergency appendectomy immediately."
    
    bank_meta = MetadataDiscoveryEngine.discover(banking_text)
    legal_meta = MetadataDiscoveryEngine.discover(legal_text)
    med_meta = MetadataDiscoveryEngine.discover(medical_text)
    
    assert bank_meta["Document"]["Doc Type"] == "Banking", f"Expected Banking, got {bank_meta['Document']['Doc Type']}"
    assert legal_meta["Document"]["Doc Type"] == "Legal", f"Expected Legal, got {legal_meta['Document']['Doc Type']}"
    assert med_meta["Document"]["Doc Type"] == "Healthcare", f"Expected Healthcare, got {med_meta['Document']['Doc Type']}"
    
    # Check confidences
    assert bank_meta["Confidences"]["Doc Type"] > 0.8
    assert legal_meta["Confidences"]["Doc Type"] > 0.8
    assert med_meta["Confidences"]["Doc Type"] > 0.8
    
    print("[PASS] Domain classification heuristics verified successfully!")


def test_boundary_detection():
    print("Test 2: Verifying boundary detection scanning...")
    
    structured_text = (
        "BANKING LOAN POLICY AND ELIGIBILITY GUIDELINES\n\n"
        "1. Personal Loan Eligibility\n"
        "All personal loan applicants must have a minimum credit score of 650.\n\n"
        "2. Home Loan Policy\n"
        "Home loans require a minimum down payment of 10% of the purchase price."
    )
    
    boundaries = BoundaryDetector.detect_boundaries(structured_text)
    assert len(boundaries) >= 2, f"Expected at least 2 boundaries, got {len(boundaries)}"
    
    titles = [b["title"] for b in boundaries]
    assert "Personal Loan Eligibility" in titles
    assert "Home Loan Policy" in titles
    
    print("[PASS] Boundary detection scanner verified successfully!")


def test_boundary_aware_segmentation():
    print("Test 3: Verifying boundary-aware splitting in service...")
    
    structured_text = (
        "BANKING LOAN POLICY AND ELIGIBILITY GUIDELINES\n\n"
        "1. Personal Loan Eligibility\n"
        "All personal loan applicants must have a minimum credit score of 650.\n\n"
        "2. Home Loan Policy\n"
        "Home loans require a minimum down payment of 10% of the purchase price."
    )
    
    # Size 200 should keep sections separate as they are small, splitting at boundaries
    result = chunk_metadata_service(structured_text, chunk_size=300, chunk_overlap=20, auto_discover=True)
    
    assert "chunks" in result
    assert "timeline" in result
    assert "comparison" in result
    
    chunks = result["chunks"]
    # Should split at section boundaries
    sections_found = [c["metadata"]["Section"] for c in chunks]
    assert "Personal Loan Eligibility" in sections_found
    assert "Home Loan Policy" in sections_found
    
    # Boundary reason should be Metadata Boundary Transition
    found_transition = False
    for chunk in chunks:
        reason = chunk["boundary_reason"]
        if reason["type"] == "Metadata Boundary Transition":
            found_transition = True
            
    assert found_transition, "Expected at least one chunk to be split due to metadata transition boundary"
    
    print("[PASS] Boundary-aware segmentation in service verified successfully!")


if __name__ == "__main__":
    test_metadata_discovery_heuristics()
    test_boundary_detection()
    test_boundary_aware_segmentation()
    print("\n[ALL PASSED] All metadata boundary unit tests passed successfully!")
