# Chunking Playground – Complete Phase-Wise Implementation Guide

## Project Overview

Chunking Playground is an educational GenAI platform that demonstrates how different chunking strategies work in RAG systems.

### Goals
- Learn chunking concepts visually
- Compare chunking strategies
- Understand retrieval impact
- Demonstrate LangChain and LangGraph workflows
- Provide a classroom-ready training application

---

# Final Architecture

## Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js

## Backend
- FastAPI
- Uvicorn

## AI Layer
- LangChain
- LangGraph
- Sentence Transformers

## LLM
- Groq
  - Llama 3 70B
  - Llama 3 8B
  - DeepSeek
  - Gemma

## Storage
- JSON Files

## Database
- Not Required

## Vector Database
- Not Required Initially
- Optional FAISS Demo Later

---

# Implementation Rules

Before starting:

1. Complete one phase fully before moving to the next.
2. Every phase must be executable and testable.
3. Commit code after each phase.
4. Maintain separate services for every chunking strategy.
5. Keep UI and API loosely coupled.
6. Store demo data in JSON.
7. Avoid introducing databases in v1.

---

# Phase 0 – Project Setup

## Objective

Create a clean project structure.

## Deliverables

### Backend

- FastAPI project
- Virtual environment
- Requirements file

### Frontend

- HTML skeleton
- CSS structure
- JavaScript modules

### Folder Structure

```text
chunking-playground/
│
├── frontend/
├── backend/
├── docs/
├── screenshots/
├── sample_documents/
└── README.md
```

### Install Dependencies

```bash
pip install fastapi
pip install uvicorn
pip install langchain
pip install langgraph
pip install sentence-transformers
pip install pypdf
pip install python-docx
pip install tiktoken
pip install numpy
pip install scikit-learn
```

### Success Criteria

- FastAPI starts successfully
- Frontend opens in browser
- API health endpoint works

---

# Phase 1 – UI Skeleton

## Objective

Build the complete layout without backend integration.

## Components

### Header

```text
Chunking Playground
```

### Left Panel

- Upload Area
- Sample Documents
- Chunking Strategy Selector

### Center Panel

- Document Preview

### Right Panel

- Statistics
- Teaching Mode

### Bottom Section

- Chunk Output Area

## Deliverables

- Responsive layout
- Navigation structure
- Placeholder cards

## Success Criteria

- UI resembles final application
- All sections visible

---

# Phase 2 – Document Upload Engine

## Objective

Support multiple document formats.

## Supported Files

- TXT
- PDF
- DOCX

## Backend Services

### txt_reader.py

Responsible for TXT extraction.

### pdf_reader.py

Responsible for PDF extraction.

### docx_reader.py

Responsible for DOCX extraction.

## API

```http
POST /document/upload
```

## Metadata Calculation

Calculate:

- Word Count
- Character Count
- Sentence Count
- Paragraph Count
- Estimated Tokens

## Success Criteria

Document content displayed in preview section.

---

# Phase 3 – Document Analysis Engine

## Objective

Generate analytics before chunking.

## Features

### Readability Metrics

- Average Sentence Length
- Paragraph Count
- Longest Paragraph

### Token Analysis

- Estimated Tokens
- Context Window Usage

### Document Type Detection

Identify:

- FAQ
- Policy
- Research Paper
- User Manual
- Blog

## API

```http
POST /document/analyze
```

---

# Phase 4 – Fixed Size Chunking

## Objective

Implement simplest chunking strategy.

## Inputs

- Chunk Size
- Overlap

## Processing

```text
Text
 ↓
Split by Characters
 ↓
Create Chunks
```

## Display

For every chunk show:

- Chunk Number
- Chunk Text
- Chunk Length

## Metrics

- Total Chunks
- Avg Size
- Processing Time

## API

```http
POST /chunk/fixed
```

---

# Phase 5 – Recursive Chunking

## Objective

Implement hierarchical chunking.

## Tool

```python
RecursiveCharacterTextSplitter
```

## Processing Order

```text
Paragraph
↓
Sentence
↓
Word
↓
Character
```

## Visualization

Display hierarchy tree.

## API

```http
POST /chunk/recursive
```

---

# Phase 6 – Document Based Chunking

## Objective

Chunk based on document structure.

## Detect

- Titles
- Headings
- Subheadings
- Sections

## Examples

### Research Paper

Abstract

Introduction

Methodology

Results

Conclusion

## API

```http
POST /chunk/document
```

## Success Criteria

Chunks align with section boundaries.

---

# Phase 7 – Semantic Chunking

## Objective

Chunk based on meaning.

## Model

```text
all-MiniLM-L6-v2
```

## Pipeline

```text
Text
↓
Sentence Split
↓
Embeddings
↓
Similarity
↓
Topic Shift Detection
↓
Chunk Creation
```

## Additional Metrics

- Similarity Score
- Topic Labels

## API

```http
POST /chunk/semantic
```

---

# Phase 8 – Query Aware Chunking

## Objective

Create chunks optimized for retrieval.

## User Input

```text
Question:
What is leave policy?
```

## Pipeline

```text
Document
↓
Generate Candidate Chunks
↓
Embed Query
↓
Compare Similarity
↓
Rank Chunks
```

## Output

- Relevant Chunks
- Relevance Score

## API

```http
POST /chunk/query-aware
```

---

# Phase 9 – Metadata Aware Chunking

## Objective

Attach business metadata.

## Sample Metadata

```json
{
  "department": "HR",
  "author": "Admin",
  "version": "1.0"
}
```

## Features

- Metadata Filtering
- Metadata Search
- Metadata Display

## API

```http
POST /chunk/metadata
```

---

# Phase 10 – LLM Based Chunking

## Objective

Use Groq models to create intelligent chunks.

## Prompt Strategy

Request:

- Chunk Title
- Topic
- Chunk
- Reason

## Output Card

### Chunk

Chunk content

### Topic

Detected topic

### Reason

Why chunk boundary exists

## API

```http
POST /chunk/llm
```

## Success Criteria

Human-readable chunk groups.

---

# Phase 11 – Agentic Chunking Using LangGraph

## Objective

Automatically choose best chunking strategy.

## LangGraph Workflow

```text
Document
↓
Classifier Node
↓
Decision Node
↓
Chunking Node
↓
Evaluation Node
↓
Output
```

## Examples

### FAQ

Query Aware

### Research Paper

Document Based

### Policy Document

Semantic

## Output

- Selected Strategy
- Confidence Score
- Explanation

## API

```http
POST /chunk/agentic
```

---

# Phase 12 – Chunk Comparison Dashboard

## Objective

Compare all chunking strategies.

## Metrics

- Chunk Count
- Chunk Size
- Similarity Score
- Retrieval Score
- Processing Time

## Visualization

Chart.js

### Charts

- Bar Chart
- Radar Chart
- Comparison Table

## Success Criteria

Student can visually compare strategies.

---

# Phase 13 – Retrieval Simulation

## Objective

Demonstrate RAG retrieval quality.

## Workflow

```text
Question
↓
Retrieve Chunks
↓
Rank Chunks
↓
Display Results
```

## Metrics

- Recall
- Precision
- Similarity

This phase dramatically improves learning value.

---

# Phase 14 – Teaching Mode

## Objective

Trainer Mode.

Every strategy should include:

### Definition

### Advantages

### Disadvantages

### Real World Use Cases

### Industry Examples

### Interview Questions

### Best Practices

### Common Mistakes

---

# Phase 15 – LangGraph Visualization

## Objective

Help students understand workflow orchestration.

## Display

Nodes

Edges

Decision Paths

Execution Order

## Example

```text
Upload
↓
Analyze
↓
Choose Strategy
↓
Chunk
↓
Evaluate
↓
Display
```

---

# Phase 16 – Sample Dataset Library

## Objective

Ship with demo documents.

## Include

### HR Policy

### Employee Handbook

### FAQ

### Research Paper

### Banking Terms

### Insurance Document

### Medical Report

### Technical Documentation

---

# Phase 17 – Performance Optimization

## Improvements

### Caching

Cache embeddings.

### Async APIs

Use FastAPI async endpoints.

### Lazy Loading

Load chunks only when needed.

### Session Storage

Store results in JSON.

---

# Phase 18 – Demo Readiness Checklist

## Verify

- Upload works
- All chunkers work
- Charts render
- Agentic workflow works
- Teaching mode works
- Error handling works

---

# Recommended JSON Files

```text
999
├── stats.json
├── retrieval_results.json
├── metadata.json
└── teaching_content.json
```

---

# Future Enhancements (Version 2)

## Optional

### FAISS

Vector Search Demo

### ChromaDB

Vector Storage Demo

### Multi Document Comparison

### Evaluation Framework

### DeepEval Integration

### RAGAS Integration

### Export Reports

PDF Export

### User Progress Tracking

Training Analytics

---

# Final Demo Flow

```text
Upload Document
↓
Analyze Document
↓
Select Strategy
↓
Generate Chunks
↓
View Statistics
↓
Compare Outputs
↓
Run Retrieval Simulation
↓
Open Teaching Mode
↓
Explore LangGraph Workflow
↓
Understand Industry Usage
```

# Completion Order

```text
Phase 0
Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
Phase 6
Phase 7
Phase 8
Phase 9
Phase 10
Phase 11
Phase 12
Phase 13
Phase 14
Phase 15
Phase 16
Phase 17
Phase 18
Phase 19
Phase 20
Phase 21
Phase 22
Phase 23
Phase 24
Phase 25
Phase 26
Phase 27
```

Follow the phases strictly in order. Do not skip a phase. Each phase becomes the foundation for the next phase.

---

# Phase 19 – Fixed-Size Chunking Educational Enhancements

## Objective
Enhance Fixed-Size chunking visual feedback to display split boundary issues.

## Features
- **Boundary Checker Heuristics**: Detects and highlights Word Boundaries Broken (splitting mid-word) or Sentence Boundaries Broken (splitting mid-sentence).
- **Chunk Statistics**: Displays characters, words, sentences, paragraphs, and estimated tokens for every card.
- **Context Loss Risk Analysis**: Calculates global split metrics and rates the RAG context loss risk (Low / Medium / High).

---

# Phase 20 – Document Preview Scrollable Height Constraint Layout Fix

## Objective
Prevent parent viewport stretching when loading large multi-page files.

## Layout Rules
- Restrict center preview panel to `680px` height.
- Set flexbox sizing on wrapper (`overflow: hidden`) and scroll container (`overflow-y: auto`).
- Keep sidebars sticky without page-level scrolling.

---

# Phase 21 – Chunk List Pagination & "Load More" Render Fix

## Objective
Support paginated lazy loading for large numbers of generated segments.

## Deliverables
- Render initial 20 chunks.
- Append a dynamic `.load-more-container` holding the **Load More Chunks** button.
- Click listener appends subsequent batches without viewport reset.

---

# Phase 22 – Recursive Chunking Educational Enhancements

## Objective
Visualize the recursive character splitting hierarchy.

## Features
- **Separator Decision Disclosures**: Displays the separator used (e.g. `\n\n`, `\n`, space, character) and its splitting level.
- **Traversal Flow Timeline**: Visualizes the decision sequence (`Paragraph -> Line -> Word -> Character`).
- **Origin Tracking Breadcrumbs**: Renders collapsible parent tracking links.
- **Interactive Walking Simulator**: Animates step-by-step separator scanning.

---

# Phase 23 – Document-Structure Aware Chunking Educational Enhancements

## Objective
Preserve layout hierarchies and structure statistics.

## Features
- **Collapsible Hierarchy Tree**: Folders tree sitemap representing headings. Clickable nodes automatically focus the target chunk.
- **Structure Analytics**: Stats panel counting headings, subheadings, and sections.
- **Preservation Scores**: Visual progress meters showing the percentages of layouts preserved.
- **Section-to-Chunk Mapping**: Arrow diagrams connecting source lines to output segments.

---

# Phase 24 – PDF Study Guide Generation & Integration

## Objective
Generate compile-ready RAG training guides.

## Features
- **guide_generator.py**: ReportLab layout generator with a double-pass `NumberedCanvas` for dynamic page calculations and Testleaf header/footer drawing.
- **API Endpoint**: `GET /api/download-guide` returning guide files.
- **Frontend Integration**: Download button on the header panel actions.

---

# Phase 25 – Semantic Similarity Chunking Educational Enhancements

## Objective
Visualize sentence similarity scores and boundary thresholds.

## Features
- **Sentence Similarity Flow**: Nodes displaying text connected by similarity score arrows (colored keep vs split).
- **Topic Boundary Tracker**: Cards listing details of keep/split decisions.
- **Concept Lab**: Visualizations explaining embeddings, vector spaces, and threshold metrics.

---

# Phase 26 – Query-Aware Chunking Educational Enhancements

## Objective
Optimize RAG indexing and search simulation.

## Features
- **Interactive Query Simulator**: Textbox to test search inputs against candidate chunks in real-time.
- **Relevance Metrics**: Cosine similarity rankings for retrieved chunks.
- **Concept Lab**: Mappings comparing Semantic vs Query-Aware retrieval.

---

# Phase 27 – Agentic Workflow (LangGraph) Educational Enhancements

## Objective
Build a comprehensive training dashboard for stateful LLM orchestrators.

## Features
- **Educational Flowchart Tooltips**: Hover text explaining Classifier, Decision, Chunking, and Evaluation nodes.
- **Confidence Score Visualizer**: Color-coded badges (High, Medium, Low) and progress meters.
- **Thinking Timeline Checklist**: Traces the 6 states of the agent execution pipeline.
- **Learner Insight Panel**: Summarizes document properties in plain language.
- **Strategy Selection Analysis**: suitability score charts for all strategies.
- **Why Other Strategies Were Not Selected**: Instructive reasons alternative routes were bypassed.

