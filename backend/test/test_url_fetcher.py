import sys
import os
from html.parser import HTMLParser

# Add backend and backend/app to path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from main import app, WebContentExtractor, FetchUrlRequest

client = TestClient(app)

def test_web_content_extractor():
    print("Testing WebContentExtractor cleaning parser...")
    html = """
    <html>
        <head>
            <title>Test Title</title>
            <style>body { color: red; }</style>
            <script>console.log("hello");</script>
        </head>
        <body>
            <header>
                <nav>
                    <a href="/">Home</a>
                </nav>
            </header>
            <main>
                <h1>Main Heading</h1>
                <p>This is the primary readable content of the webpage.</p>
                <aside>
                    Related links: <a href="/next">Next</a>
                </aside>
            </main>
            <footer>
                <p>&copy; 2026 Test Company</p>
            </footer>
        </body>
    </html>
    """
    extractor = WebContentExtractor()
    extractor.feed(html)
    cleaned_text = extractor.get_text()
    
    assert "Main Heading" in cleaned_text, "Failed to preserve main headings"
    assert "primary readable content" in cleaned_text, "Failed to extract main content"
    # Boilerplate content should be stripped
    assert "Home" not in cleaned_text, "Failed to strip navigation"
    assert "Related links" not in cleaned_text, "Failed to strip aside content"
    assert "Test Company" not in cleaned_text, "Failed to strip footer content"
    assert "console.log" not in cleaned_text, "Failed to strip scripts"
    print(" -> WebContentExtractor passed!")

def test_fetch_url_endpoint_invalid_url():
    print("Testing fetch-url endpoint error cases...")
    # Empty url
    response = client.post("/document/fetch-url", json={"url": ""})
    assert response.status_code == 400
    assert "URL cannot be empty" in response.json()["detail"]

    # Failing URL
    response = client.post("/document/fetch-url", json={"url": "http://invalid-domain-that-should-never-exist.xyz/somepage"})
    assert response.status_code == 400
    assert "Failed to fetch content" in response.json()["detail"]
    print(" -> Fetch URL error handling passed!")

if __name__ == "__main__":
    try:
        test_web_content_extractor()
        test_fetch_url_endpoint_invalid_url()
        print("\nALL URL FETCHER TESTS PASSED!")
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {str(e)}")
        sys.exit(1)
