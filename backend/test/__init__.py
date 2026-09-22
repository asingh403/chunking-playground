import os
import sys

# Ensure backend and backend/app are available for all tests
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")

for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)
