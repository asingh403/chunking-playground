import os
import json

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))

def save_to_json(filename: str, data: dict):
    """
    Saves a dictionary as a JSON file in backend/data/.
    Creates the directory on demand.
    """
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving to {filename}: {str(e)}")

def load_from_json(filename: str) -> dict:
    """
    Loads a JSON file from backend/data/ if it exists.
    """
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading from {filename}: {str(e)}")
    return None

def clear_session_data():
    """
    Clears all saved JSON session files in backend/data/.
    """
    if os.path.exists(DATA_DIR):
        for f in os.listdir(DATA_DIR):
            if f.endswith(".json"):
                try:
                    os.remove(os.path.join(DATA_DIR, f))
                except Exception as e:
                    print(f"Error deleting session file {f}: {str(e)}")
