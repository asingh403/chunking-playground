# 🛠️ GenAI Chunking Playground 🎓

The **Chunking Playground** is an interactive, educational web application designed to visually demonstrate and teach various document chunking strategies used in **Retrieval-Augmented Generation (RAG)** pipelines. Learners can upload files, configure chunking parameters, and visually inspect how documents are segmented, mapped, and queried in real-time.

---

## 📂 Project Structure

This project is structured with a FastAPI Python backend and a vanilla HTML/CSS/JavaScript frontend:

```text
chunking-playground/
│
├── frontend/                 # Web User Interface (Vanilla HTML5/CSS3/JS)
│   ├── index.html            # Main UI layout & containers
│   ├── index.css             # Rich styling, dark mode, HSL themes, animations
│   └── app.js                # Core UI logic, API calls, dynamic renderings
│
├── backend/                  # FastAPI Python Backend
│   ├── app/                  # Application source code
│   │   ├── main.py           # API routing and static file serving
│   │   ├── *_chunker.py      # Core implementations for each chunking strategy
│   │   ├── *_reader.py       # Document readers (PDF, DOCX, TXT)
│   │   ├── utils.py          # Helper functions
│   │   └── data/             # Session cache (metadata.json, chunks.json, etc.)
│   │
│   └── requirements.txt      # Python dependencies
│
└── README.md                 # This documentation
```

---

## ⚡ How to Zip and Send this Project via WhatsApp (Size Reduction)

Normally, this project's folder exceeds **1.5 GB** because the virtual environment (`.venv`) contains heavy libraries like **PyTorch** and **Sentence-Transformers** required for semantic chunking. 

To reduce the folder size to **less than 500 KB** for easy transfer over WhatsApp, follow these steps before zipping:

### 🗑️ Step 1: Delete Large Folders
1. Navigate to the `backend/` directory.
2. **Delete the `.venv` folder** (This contains the virtual environment. **Do not worry**, the recipient will easily recreate it!).
3. **Delete any `__pycache__` folders** if they exist inside `backend/app/` or `backend/`.
4. (Optional) Delete the `backend/app/data/` folder if you want to clear session cache.

### 🤐 Step 2: Zip the Folder
- Right-click on the parent `chunking-playground/` folder.
- Select **Compress to ZIP file** (or use WinRAR/7-Zip).
- The resulting ZIP file will be **under 400 KB**, which is perfect for sending on WhatsApp!

---

## 🚀 Setup & Execution Guide (For the Learner)

Follow these steps to set up and run the Chunking Playground on your local machine:

### 📋 Prerequisites
- **Python 3.8 to 3.11** installed on your system.
- A modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).

### 🛠️ Step-by-Step Installation

1. **Extract the ZIP file** received via WhatsApp to a folder on your computer.
2. **Open your Terminal/Command Prompt** and navigate to the project directory:
   ```bash
   cd path/to/chunking-playground/backend
   ```
3. **Create a new Virtual Environment**:
   ```bash
   python -m venv .venv
   ```
4. **Activate the Virtual Environment**:
   - **On Windows (Command Prompt)**:
     ```cmd
     .venv\Scripts\activate
     ```
   - **On Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\activate
     ```
   - **On macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
5. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: This might take a few minutes as it downloads PyTorch and Sentence-Transformer libraries).*

---

## 🏃 Running the Application

1. Ensure your virtual environment is activated, then run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
2. Once the server starts, you will see output like:
   `INFO: Uvicorn running on http://127.0.0.1:8000`
3. **Open your Web Browser** and navigate to:
   ```text
   http://127.0.0.1:8000
   ```
   *(FastAPI automatically serves the HTML frontend at the root `/` path. Do NOT open the `index.html` file directly in your browser, as API calls will fail).*

---

## 🧠 Educational Features to Explore

Once the application is open in your browser, you can explore the following strategies and visual tools:

1. **Fixed-Size Chunking**: Check how character bounds and overlaps affect token structures. Overlapping text ranges are highlighted in distinct colors.
2. **Recursive Character Chunking**: Observe the hierarchical split decisions (Paragraph -> Line -> Word -> Character) and see structural preservation metrics.
3. **Document-Structure Aware Chunking**: View the detected hierarchy tree of a document (e.g., Markdown headers like H1, H2) and see how sections are cleanly grouped.
4. **Semantic Chunking**: Examine how sentences are grouped based on semantic similarity using embeddings.
5. **Query-Aware Chunking**: Highlight chunks containing information relevant to a target query.
6. **Metadata-Rich Chunking**: Look at how parent headings, page ranges, and section numbers are injected directly into each chunk.
7. **LLM-Agentic Chunking**: Run a simulated agentic model that splits text based on semantic boundaries, mimicking LLM reasoning.
8. **RAG Simulator**: Run a simulated search on your chunks. Enter a search query to retrieve the top $K$ matches using cosine similarity, and view the simulated LLM response generated from those source chunks.
9. **Comparison Dashboard**: Run multiple chunking strategies side-by-side on the same document to compare chunk counts, token distributions, and processing times.
