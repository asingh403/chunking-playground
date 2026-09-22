/**
 * Chunking Playground Frontend Application
 * Main Entry Module
 */

const BACKEND_URL = window.location.origin && window.location.origin.startsWith('http')
    ? window.location.origin
    : 'http://127.0.0.1:8000';


// DOM Elements
const apiStatusEl = document.getElementById('api-status');
const apiStatusLabelEl = apiStatusEl.querySelector('.status-label');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const strategySelect = document.getElementById('strategy-select');
const processBtn = document.getElementById('process-chunk-btn');
const chunksOutputGrid = document.getElementById('chunks-output-grid');
const toggleViewBtn = document.getElementById('btn-toggle-view');
const toggleTreeBtn = document.getElementById('btn-toggle-tree');

// Parameter inputs
const paramChunkSize = document.getElementById('param-chunk-size');
const valChunkSize = document.getElementById('val-chunk-size');
const paramOverlap = document.getElementById('param-overlap');
const valOverlap = document.getElementById('val-overlap');

// Document info
const docPreviewText = document.getElementById('doc-preview-text');
const previewWordCount = document.getElementById('preview-word-count');
const previewCharCount = document.getElementById('preview-char-count');
const previewSentenceCount = document.getElementById('preview-sentence-count');
const previewParagraphCount = document.getElementById('preview-paragraph-count');
const previewTokenCount = document.getElementById('preview-token-count');

// Tab Elements
const tabAnalysis = document.getElementById('tab-analysis');
const tabStats = document.getElementById('tab-stats');
const analysisTabContent = document.getElementById('analysis-tab-content');
const statsTabContent = document.getElementById('stats-tab-content');

// Analysis Elements
const btnAnalyzeDoc = document.getElementById('btn-analyze-doc');
const analysisDocType = document.getElementById('analysis-doc-type');
const analysisAvgSentenceLen = document.getElementById('analysis-avg-sentence-len');
const analysisLongestPara = document.getElementById('analysis-longest-para');
const analysisContextPct = document.getElementById('analysis-context-pct');
const analysisContextBar = document.getElementById('analysis-context-bar');

// Teaching Mode Info
const strategyDetailsEl = document.getElementById('strategy-details');
const teachingIntroEl = document.querySelector('.teaching-intro');
const teachTitle = document.getElementById('teach-title');
const teachDefinition = document.getElementById('teach-definition');
const teachAdvantages = document.getElementById('teach-advantages');
const teachDisadvantages = document.getElementById('teach-disadvantages');

// App state
let isGridView = false;
let currentChunkData = null; // Store last chunk results
let activeDocumentOrigin = {
    type: 'document', // 'web_url' or 'document'
    name: 'HR Leave Policy',
    url: null
};
let activeView = 'list';     // 'list', 'grid', or 'tree'
let barChartInstance = null; // Chart.js metrics instance
let radarChartInstance = null; // Chart.js radar instance

// Lazy loading pagination state
const PAGE_SIZE = 20;
let currentLoadedChunksCount = 0;
let activeChunksArray = [];
let activeChunksStrategy = '';

// Sample documents content helper
const samples = {
    'hr-policy': {
        title: 'HR Leave Policy',
        type: 'Policy',
        text: `EMPLOYEE LEAVE POLICY AND GUIDELINES

1. Purpose and Scope
This policy outlines the guidelines and procedures governing various types of leave available to all full-time employees. The company believes that balance between professional and personal life is essential for productivity and well-being.

2. Annual Paid Time Off (PTO)
All full-time employees accumulate PTO at a rate of 1.67 days per month, resulting in a total of 20 days per calendar year. 
- PTO requests must be submitted at least 5 business days in advance for approval by the department manager.
- A maximum of 5 unused PTO days may be carried over to the next calendar year. Any additional unused days will expire.

3. Sick Leave
Employees receive 10 paid sick days per year on January 1st. Sick leave is intended for personal illness, medical appointments, or caring for immediate family members.
- If sick leave exceeds 3 consecutive days, a certified medical note from a qualified physician is required.

4. Parental Leave
The company provides up to 12 weeks of paid parental leave to eligible employees following the birth, adoption, or foster placement of a child. Employees must have completed at least one year of continuous service to qualify.
- Parental leave runs concurrently with FMLA guidelines where applicable.`
    },
    'faq': {
        title: 'Company FAQ',
        type: 'FAQ',
        text: `FREQUENTLY ASKED QUESTIONS (FAQ)

Q: What are the standard working hours?
A: Our core business hours are Monday through Friday, 9:00 AM to 5:00 PM local time. We offer flexible start times between 8:00 AM and 10:00 AM, subject to manager approval.

Q: How do I access the corporate VPN?
A: You can request VPN access through the IT Service Portal. Once approved, download the GlobalProtect client, enter the portal address 'vpn.corp.company.com', and authenticate using your Single Sign-On (SSO) credentials.

Q: When do we get paid?
A: Salaries are paid bi-weekly on alternating Fridays via direct deposit. If a pay day falls on a national holiday, payment is processed on the preceding business day.

Q: Is remote work allowed?
A: Yes, our hybrid policy allows employees to work remotely up to 3 days per week. Tuesdays and Thursdays are designated as core collaborative in-office days for all teams.

Q: How do I submit expense reports?
A: All business expenses must be submitted through the Concur platform by the last day of each month. Receipts are required for any individual expense item exceeding $25.`
    },
    'research': {
        title: 'RAG Research Abstract',
        type: 'Paper',
        text: `Retrieval-Augmented Generation (RAG) in Large Language Models: A Survey

Abstract:
Large Language Models (LLMs) have demonstrated remarkable capabilities in natural language understanding and generation. However, they continue to suffer from inherent limitations such as hallucinations, outdated knowledge, and lack of domain-specific context. Retrieval-Augmented Generation (RAG) has emerged as a promising paradigm to address these challenges by retrieving relevant documents from an external corpus to aid the LLM in generating more accurate, contextually grounded, and verifiable responses. 

This paper provides a comprehensive survey of modern RAG architectures. We categorize RAG techniques into three developmental stages: Naive RAG, Advanced RAG, and Agentic RAG. Naive RAG follows a simple retrieve-then-read pipeline. Advanced RAG refines this by incorporating pre-retrieval optimization (e.g., query rewriting, routing) and post-retrieval strategies (e.g., reranking, compression). Agentic RAG introduces autonomous agents to iteratively verify information, fetch multi-hop documents, and evaluate reasoning paths. We examine the critical role of document chunking strategies, vector database selection, embedding models, and evaluation frameworks (such as RAGAS and DeepEval) in dictating overall system performance.`
    },
    'banking-loan': {
        title: 'Banking Loan Policy',
        type: 'Banking',
        text: `BANKING LOAN POLICY AND ELIGIBILITY GUIDELINES

1. Personal Loan Eligibility
All personal loan applicants must have a minimum credit score of 650. Interest rates are determined by credit score tiers:
- Tier 1 (750+): 5.5% APR
- Tier 2 (680-749): 7.2% APR
- Tier 3 (650-679): 9.5% APR
Applicants must provide their most recent 3 months of pay stubs and tax statements.

2. Home Loan Policy
Home loans require a minimum down payment of 10% of the purchase price.
- Mortgage rates are fixed for 15 or 30 years.
- Borrowers must maintain debt-to-income (DTI) ratios under 43% to qualify.
- Co-signers are permitted for applicants with insufficient income but good credit.

3. Credit Card Guidelines
Credit cards are offered to customers with established banking history of at least 6 months.
- Classic Card: Credit limit up to $5,000, 18.9% APR.
- Gold Card: Credit limit up to $15,000, 14.9% APR.
- Platinum Card: Credit limit up to $50,000, 11.9% APR, requires $100k minimum annual income.`
    },
    'insurance-health': {
        title: 'Insurance Health Policy',
        type: 'Insurance',
        text: `HEALTH INSURANCE POLICY AND COVERAGE DETAILS

1. General APAC Terms
This policy covers APAC regional employees. Standard medical checkups are covered 100% at network hospitals.
- Out-of-network consults are subject to a 20% co-payment.
- Pre-authorization is mandatory for all elective surgeries at least 7 business days prior.

2. Life Insurance Coverage
Life insurance benefit pays a lump sum equal to 2x the employee's annual salary to registered beneficiaries.
- Coverage starts on the first day of employment.
- Suicide or self-inflicted injury is excluded from payouts during the first 24 months of coverage.`
    },
    'employee-handbook': {
        title: 'Employee Handbook',
        type: 'Handbook',
        text: `EMPLOYEE HANDBOOK AND CODE OF CONDUCT

1. Professional Conduct
All employees are expected to maintain the highest standards of professional conduct, integrity, and respect in their daily interactions. The company values a diverse and inclusive workplace environment.

2. Dress Code and Professional Appearance
The company maintains a business-casual dress code. Employees are expected to dress appropriately for their role, particularly when representing the company in client meetings or external events.

3. Acceptable Use of Technology
Company laptops, networks, and communication tools (such as Slack and Email) are provided strictly for business purposes.
- All communication must remain professional and respectful.
- Sensitive company data must never be shared on unauthorized public channels or personal storage devices.
- Personal internet browsing is permitted in moderation, provided it does not impact productivity.

4. Core Hours and Workplace Attendance
Our standard work week is 40 hours. Core collaborative hours are between 10:00 AM and 4:00 PM, during which all employees are expected to be available for team meetings and client requests.`
    },
    'medical-chart': {
        title: 'Patient Medical Chart',
        type: 'Medical',
        text: `PATIENT CLINICAL REPORT

Patient Section:
Name: Jane Smith
Age: 34
Gender: Female
Admitted: June 8, 2026

Diagnosis Section:
Patient presents with severe acute abdominal pain localized in the lower right quadrant.
- Ultrasound indicates inflamed appendix.
- White blood cell count elevated at 14,500/mcL, confirming acute appendicitis.

Treatment Section:
Schedule emergency laparoscopic appendectomy immediately.
- Post-operative care includes IV fluids, pain management (Morphine), and antibiotics (Cefazolin).
- Patient is expected to be discharged within 24-48 hours post-op.`
    },
    'technical-doc': {
        title: 'Workers API Gateway',
        type: 'Tech Doc',
        text: `CLOUDFLARE WORKERS API DOCUMENTATION

1. Overview
The Workers API allows developers to deploy serverless JavaScript functions at the edge. This document specifies the routing, headers, and response formats for edge service gateways.

2. Authentication
All requests to the Workers API gateway must include an OAuth 2.0 bearer token in the headers:
Header Name: Authorization
Format: Bearer <token_string>
Invalid or expired tokens will return an HTTP 401 Unauthorized response.

3. Endpoint Reference
- GET /v1/services: Lists all active services deployed at the edge.
- POST /v1/services/deploy: Deploys a new version bundle to the specified zone.
  Payload Format: JSON object containing service name, script body, and route bindings.

4. Rate Limiting and Quotas
The edge gateway enforces a rate limit of 1000 requests per minute per client IP address. Exceeding this limit will trigger an HTTP 429 Too Many Requests response.`
    }
};

const websiteSamples = {
    'cloudflare': {
        title: "Cloudflare Workers Documentation",
        type: "Technical Documentation",
        text: `# Cloudflare Workers API Gateway Specification

## 1. Executive Overview
Cloudflare Workers provides a serverless execution environment that allows developers to run JavaScript, Rust, C, and C++ code at the edge of the Cloudflare network. Running code at the edge minimizes latency by executing code closer to the end user compared to centralized cloud servers.

## 2. API Router Implementation
The edge gateway router matches incoming requests to worker scripts based on defined routes and zone bindings:
- **Route Matcher**: Evaluates host, path patterns, and wildcards.
- **Failover Routing**: Automatically redirects request paths to origin servers if a worker fails.

## 3. Authentication & Access Control
Security tokens must be passed via standard Authorization headers:
- Header Key: \`Authorization\`
- Header Value: \`Bearer <secret_jwt_token>\`
- Failure Action: HTTP 401 Unauthorized returned to client.

## 4. Rate Limiting Guidelines
All edge endpoints enforce a rate limit quota:
- Threshold: Max 10,000 requests per sliding 10-minute window per IP.
- Overflow Action: HTTP 429 Too Many Requests response with a Retry-After header.`,
        structure: "High",
        strategy: "document",
        reason: "Technical documentation follows standard markdown structure with clear headers (H1, H2, H3) dividing distinct components and APIs. Document-Structure Aware chunking aligns splits with headings, ensuring that each API endpoint or deployment guideline stays grouped with its detailed specification, preventing context dilution in downstream RAG retrieval."
    },
    'python': {
        title: "Python Tutorial",
        type: "Technical Guide",
        text: `# Python Tutorial: Data Structures & Core Types

## 1. List Comprehensions
List comprehensions provide a concise way to create lists. Common applications are to make new lists where each element is the result of some operations applied to each member of another sequence:
\`\`\`python
squares = [x**2 for x in range(10)]
# Result: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
\`\`\`
This method is more readable and faster than traditional for-loops.

## 2. Dictionaries and Key-Value Mapping
Dictionaries are indexed by keys, which can be any immutable type; strings and numbers can always be keys:
\`\`\`python
user_roles = {'admin': 'all_access', 'editor': 'edit_access'}
# Query key
print(user_roles['admin'])
\`\`\`
Key search has O(1) average time complexity.

## 3. Tuples vs Lists
Tuples are immutable sequences, typically used to store collections of heterogeneous data (such as 2-tuples returning from a function). Lists are mutable, and their elements are usually homogeneous:
- Tuple: \`point = (10.0, 20.0)\`
- List: \`names = ["Alice", "Bob", "Charlie"]\``,
        structure: "High",
        strategy: "document",
        reason: "Highly structured coding tutorial containing step-by-step code blocks, section headers, and usage lists. Document-Structure Aware chunking partitions segments along section headings to preserve the sequence of code blocks and matching explanations together."
    },
    'kubernetes': {
        title: "Kubernetes Architecture",
        type: "Concept Documentation",
        text: `# Kubernetes Architecture: Core Concepts & Node Orchestration

## 1. Control Plane Components
The Control Plane makes global decisions about the cluster (for example, scheduling), as well as detecting and responding to cluster events:
- **kube-apiserver**: Exposes the Kubernetes API, acting as the entry point for all control operations.
- **etcd**: Consistent and highly-available key-value store used as Kubernetes' backing store for cluster data.
- **kube-scheduler**: Watches for newly created Pods with no assigned node, and selects a node for them to run on.

## 2. Node Components
Node components run on every node, maintaining running pods and providing the Kubernetes runtime environment:
- **kubelet**: An agent that runs on each node in the cluster. It makes sure that containers are running in a Pod.
- **kube-proxy**: A network proxy that runs on each node, maintaining network rules on host.

## 3. Pod Lifecycle & Scheduling
Pods are the smallest deployable units of computing that you can create and manage in Kubernetes. The Control Plane scheduler places Pods based on resource constraints and node selector matches.`,
        structure: "High",
        strategy: "document",
        reason: "Architecture concept document utilizing clear headings (Master Node, Worker Node, Kubelet) to categorize sub-systems. Document-Structure Aware splitting is recommended to segment by component topics, preserving architectural maps inside individual retrieval boundaries."
    },
    'wikipedia': {
        title: "Wikipedia: Deep Learning",
        type: "Reference Article",
        text: `Deep Learning Overview and Historical Context

Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised. Deep-learning architectures such as deep neural networks, deep belief networks, deep reinforcement learning, recurrent neural networks, convolutional neural networks and transformers have been applied to fields including computer vision, speech recognition, natural language processing, machine translation, and bioinformatics, where they have produced results comparable to and in some cases surpassing human expert performance.

Artificial neural networks (ANNs) were inspired by information processing and distributed communication nodes in biological systems. ANNs have various differences from biological brains. Specifically, artificial neural networks tend to be static and symbolic, while the biological brain of most living organisms is dynamic and analog.

The term "Deep Learning" was introduced to the machine learning community by Rina Dechter in 1986, and to artificial neural networks by Igor Aizenberg and colleagues in 2000, in the context of Boolean threshold neurons. The first general, working learning algorithm for supervised, deep, feedforward, multilayer perceptrons was published by Alexey Ivakhnenko and Lapa in 1965. A paper from 1971 described a deep network with 8 layers trained by the group method of data handling.

In the 2010s, advances in both algorithms and hardware (particularly graphics processing units or GPUs) led to a massive resurgence of deep learning. Transformers, introduced in 2017, revolutionized natural language processing by using self-attention mechanisms to model relationships between words globally across a document.`,
        structure: "Medium",
        strategy: "semantic",
        reason: "Wikipedia articles contain long prose with smooth thematic transitions. While headings are present, the dense paragraphs of background information and historical context are best segmented using Semantic Similarity chunking, which dynamically splits when the cosine similarity of consecutive sentence vectors drops below the statistical threshold, keeping related concepts together."
    },
    'blog': {
        title: "Technical Blog Post",
        type: "Blog Article",
        text: `Designing RAG: Why Chunking Strategy is the Most Important Choice

When building a Retrieval-Augmented Generation (RAG) system, developers spend days tuning LLM prompts and selecting vector databases. However, after building dozens of systems, I've realized that the most critical bottleneck for retrieval quality is actually your chunking strategy.

If your chunks are too large, the vector search returns irrelevant noise along with the answer. This dilutes the context, making the LLM generate generic or incorrect answers. If your chunks are too small, the key idea gets cut off in the middle, and the LLM lacks the background context to formulate a complete answer.

Many default tutorials tell you to use fixed-size chunking (e.g., 500 characters with 50 overlap). This is a mistake. Fixed splitting slices paragraphs and sentences right in the middle, breaking logical arguments. You should always start with Recursive Character Chunking, which keeps paragraphs and sentences whole by falling back through double newlines, single newlines, and spaces.

If your documents have explicit structural divisions like headers, structure-aware chunking is even better. For raw, unstructured text files, semantic similarity chunking using sentence embeddings represents the state-of-the-art approach to keeping coherent concepts grouped together.`,
        structure: "Low",
        strategy: "recursive",
        reason: "Informal blog posts have loose formatting, casual writing style, and sparse headings. Recursive Character Chunking is recommended to split hierarchically on paragraph and sentence boundaries, providing a fast, predictable baseline that preserves word and sentence boundaries."
    }
};

// Teaching content for strategies
// Teaching content for strategies
const teachingContent = {
    'fixed': {
        title: "Fixed-Size Character Chunking",
        definition: "Splits text into chunks of exact character lengths with a specific overlap. It is the most basic, straightforward strategy.",
        advantages: [
            "Extremely fast to compute and implement.",
            "Guarantees predictability in token consumption.",
            "No dependencies on external NLP libraries or models."
        ],
        disadvantages: [
            "Completely ignores natural language structures (words, sentences, paragraphs).",
            "Often breaks sentences and words in half, leading to semantic fragmentation.",
            "Can cause significant context loss if overlap is set too low."
        ],
        useCases: [
            "Splitting a large PDF into smaller pieces before sending it to an AI model.",
            "Breaking long policy documents into equal-sized chunks for quick testing.",
            "Processing large text files where speed is more important than accuracy.",
            "Creating a simple prototype to understand how chunking works before using advanced methods."
        ],
        industryExamples: [
            "Company HR policy documents.",
            "Bank terms and conditions documents.",
            "Insurance policy documents.",
            "Large text reports exported from business systems.",
            "Log files generated by applications and servers."
        ],
        whyCompaniesUseIt: [
            "Very easy to implement.",
            "Fast processing for large documents.",
            "Good starting point before trying advanced chunking methods.",
            "Useful for learning and comparing chunking strategies."
        ],
        bestPractices: [
            "Configure an overlap of 10% to 20% of the chunk size to capture split context.",
            "Use larger chunk sizes (e.g., 1000+ characters) to lower the risk of word breaking."
        ],
        commonMistakes: [
            "Setting overlap to 0, which guarantees truncated sentences at chunk boundaries.",
            "Using small chunks (<200 characters) on highly structured documents like contracts."
        ],
        interviewQuestions: [
            {
                q: "Why is fixed-size chunking considered a fallback strategy in production RAG?",
                a: "It does not respect semantic boundaries (like sentences or paragraphs), meaning words are cut off mid-character or key ideas are split, degrading the quality of generated vector embeddings."
            },
            {
                q: "How does setting the overlap help in fixed-size chunking?",
                a: "It acts as a safety margin, ensuring that any sentence or semantic idea cut off at the edge of one chunk is fully present and captured in the neighboring chunk."
            }
        ]
    },
    'recursive': {
        title: "Recursive Character Chunking",
        definition: "Splits text by a hierarchical list of characters (typically paragraphs '\\n\\n', single newlines '\\n', spaces ' ', and empty strings ''). It aims to keep paragraphs and sentences intact as much as possible.",
        advantages: [
            "Maintains natural reading structures like paragraphs and sentences.",
            "Highly customizable splitting hierarchies.",
            "Industry standard baseline for text document preprocessing."
        ],
        disadvantages: [
            "Chunk size can fluctuate based on text formatting.",
            "Still limited to character/token limits without evaluating meaning.",
            "Struggles with heavily structured tabular data."
        ],
        useCases: [
            "Standard PDF, DOCX, and Markdown textual reports.",
            "Knowledge bases containing standard paragraph formatting.",
            "Blogs, articles, and documentation pages."
        ],
        industryExamples: [
            "The default splitter of choice in LangChain (RecursiveCharacterTextSplitter).",
            "LlamaIndex default NodeParsers."
        ],
        whyCompaniesUseIt: [
            "The standard default choice for most text documents.",
            "Keeps paragraphs and sentences whole to preserve natural reading flow.",
            "Requires zero machine learning setup or API keys."
        ],
        bestPractices: [
            "Place double newlines '\\n\\n' first in the separator list to keep paragraphs whole.",
            "Choose a chunk size based on your document.\n\nIf chunks are too small, important context may be split.\nIf chunks are too large, retrieval may become less accurate."
        ],
        commonMistakes: [
            "Forgetting to verify if the file has non-standard newline encodings (like '\\r\\n').",
            "Assuming recursive character splitting will correctly parse and group tables."
        ],
        interviewQuestions: [
            {
                q: "Explain how Recursive Character Chunking sequentially uses separators.",
                a: "It checks separator 1 ('\\n\\n'). If splitting results in chunks smaller than the chunk size, it splits there. If a chunk is still too large, it sequentially falls back to '\\n', then ' ', and finally '' to reach target limits."
            },
            {
                q: "What is the primary benefit of recursive over fixed-size chunking?",
                a: "It preserves logical units. By splitting on paragraphs or sentence boundaries first, it maintains the structural coherence of the text, leading to better search embeddings."
            }
        ]
    },
    'document': {
        title: "Document-Structure Aware Chunking",
        definition: "Identifies document layout elements (e.g., markdown headings, PDF section titles, HTML tables) and aligns chunk boundaries with these divisions.",
        advantages: [
            "Preserves logical section groupings.",
            "Highly optimized for user manuals, policy papers, and books.",
            "Keeps associated headers and sub-headers grouped with their text."
        ],
        disadvantages: [
            "Highly dependent on clean file formatting.",
            "Requires custom parsers for different document structures (PDF, DOCX, Markdown).",
            "Can yield chunks that are either too small (short headers) or too large (giant sections)."
        ],
        useCases: [
            "Technical API documentation written in Markdown.",
            "Legal contracts structured with clear, numbered articles.",
            "Financial statements containing structured markdown tables."
        ],
        industryExamples: [
            "Parsing company wikis, Notion pages, and Confluence spaces by header trees.",
            "Analyzing regulatory compliance forms by section boundaries."
        ],
        whyCompaniesUseIt: [
            "Maintains section headings, tables, and lists intact.",
            "Ensures user searches return clean, complete chapters of information.",
            "Crucial for highly structured manuals, legal policies, and API specifications."
        ],
        bestPractices: [
            "Combine with a recursive splitter fallback for sections that exceed the token limit.",
            "Extract headings and append them to individual chunk metadata so context is not lost."
        ],
        commonMistakes: [
            "Assuming every heading has a standard format, which causes parsers to miss sections.",
            "Failing to handle extremely short sections, resulting in noisy, sparse embeddings."
        ],
        interviewQuestions: [
            {
                q: "How does structure-aware chunking avoid context loss in RAG?",
                a: "By ensuring chunk splits occur exactly at logical section breaks, keeping sub-headers, lists, and tables grouped together as the author intended."
            },
            {
                q: "What mechanism is usually used to handle oversized sections in structure chunking?",
                a: "A secondary recursive character chunker is applied to split only the oversized sections, while keeping the standard-sized sections intact."
            }
        ]
    },
    'semantic': {
        title: "Semantic Similarity Chunking",
        definition: "Analyzes semantic similarity between consecutive sentences using embedding models (e.g., Sentence Transformers). A new chunk starts when the similarity score drops below a calculated threshold.",
        advantages: [
            "Groups semantically related content together, ensuring coherent topic-focused chunks.",
            "Does not rely on arbitrary character or token boundaries.",
            "Automatically adapts to topic transitions within the document.",
            "Improves retrieval quality in RAG systems by keeping related information together.",
            "Reduces context fragmentation compared to fixed-size chunking."
        ],
        disadvantages: [
            "Slower because embedding generation and similarity calculations are required.",
            "More computationally expensive than traditional chunking approaches.",
            "Highly dependent on embedding model quality.",
            "Requires careful similarity threshold tuning.",
            "Results may vary across different embedding models."
        ],
        useCases: [
            "Transcripts of lectures, podcasts, or client meetings.",
            "Unstructured research papers with natural thematic transitions.",
            "Narrative textbooks and long essays."
        ],
        industryExamples: [
            "LlamaIndex SemanticSplitterNodeParser.",
            "Topic segmentation in automated customer service call transcripts."
        ],
        whyCompaniesUseIt: [
            "Groups consecutive sentences that discuss the exact same topic.",
            "Adapts automatically to topic transitions in narrative texts.",
            "Reduces retrieval confusion by not cutting topics in half."
        ],
        bestPractices: [
            "Use a fast, local sentence embedding model (e.g., all-MiniLM-L6-v2) to minimize latency.",
            "Set the similarity threshold dynamically using statistical percentiles of the document."
        ],
        commonMistakes: [
            "Assuming semantic chunking always produces perfect topic boundaries.",
            "Ignoring similarity threshold tuning.",
            "Using poor-quality embedding models.",
            "Comparing results across different embedding models without validation.",
            "Expecting identical chunk boundaries for every model."
        ],
        interviewQuestions: [
            {
                q: "How does semantic chunking define similarity boundaries?",
                a: "It embeds sentences, calculates the cosine similarity between consecutive sentence vectors, and places a split point wherever similarity drops below a predetermined statistical threshold."
            },
            {
                q: "What is the trade-off of using semantic chunking in terms of system performance?",
                a: "It yields high retrieval accuracy because topics are kept whole, but introduces significant processing latency and requires extra memory/GPU resources to embed sentences."
            }
        ]
    },
    'query': {
        title: "Query-Aware Chunking",
        definition: "Generates chunk boundaries that are dynamically optimized based on typical query patterns or specific search intents to maximize vector similarity during retrieval.",
        advantages: [
            "Directly optimizes downstream retrieval metrics.",
            "Improves precision by removing irrelevant flanking text."
        ],
        disadvantages: [
            "Requires prior knowledge of user search queries.",
            "Difficult to apply statically before any query has occurred."
        ],
        useCases: [
            "Customer Support Q&A search indices.",
            "Frequently Asked Questions (FAQ) document retrievals.",
            "Compliance audits matching specific query checklists."
        ],
        industryExamples: [
            "Intent-focused search engines in enterprise customer service portals.",
            "Vector databases customized with query-boosting rerankers."
        ],
        whyCompaniesUseIt: [
            "Directly aligns document segments with actual user questions.",
            "Optimizes response generation by focusing only on the most relevant sentences.",
            "Ideal for question-and-answer archives and customer support search engines."
        ],
        bestPractices: [
            "Seed queries using historical user search logs and query expansion.",
            "Store query embeddings in a cached map to speed up real-time search scoring.",
            "Collect common user questions before designing query-aware chunking.",
            "Measure retrieval precision instead of chunk count.",
            "Cache query embeddings for frequently searched questions."
        ],
        commonMistakes: [
            "Hardcoding specific query patterns, leaving the system fragile to user typos.",
            "Neglecting out-of-domain search intent, which reduces generic search precision.",
            "Assuming one query represents all user intents.",
            "Ignoring synonyms and alternative phrasing.",
            "Overfitting chunk boundaries to a small query dataset."
        ],
        interviewQuestions: [
            {
                q: "What is the primary objective of Query-Aware Chunking?",
                a: "To divide the source text into blocks that directly match the semantic vectors of typical user queries, maximizing retrieval similarity scores in RAG."
            },
            {
                q: "How does query-aware chunking differ from standard static semantic chunking?",
                a: "Semantic chunking splits text based on transitions inside the document itself, while query-aware chunking prioritizes alignment and relevance to external user queries."
            }
        ]
    },
    'metadata': {
        title: "Metadata-Enhanced Chunking",
        definition: "Embeds vital context headers directly into each text segment (e.g. department, version, parent document name) before indexing.",
        advantages: [
            "Allows precise post-retrieval filtering.",
            "Maintains global context inside micro-segments."
        ],
        disadvantages: [
            "Increases token count of each chunk.",
            "Requires structured metadata extraction pipeline."
        ],
        useCases: [
            "Multi-department policy indexes (e.g., HR, Finance, IT).",
            "Multi-version legal or compliance manuals.",
            "Medical charts segmented by patient demographics."
        ],
        industryExamples: [
            "Enterprise hybrid search filters in Azure AI Search or Pinecone.",
            "Document management systems with strict access control tags."
        ],
        whyCompaniesUseIt: [
            "Enables precise filtering by departments, authors, or document versions.",
            "Allows vector databases to boost matches containing important keywords.",
            "Preserves document context that is otherwise lost during raw text extraction."
        ],
        bestPractices: [
            "Keep metadata header templates short and clean to save LLM tokens.",
            "Pre-filter queries by metadata tags before performing vector searches to optimize speed."
        ],
        commonMistakes: [
            "Embedding long, repetitive strings that waste context window capacity.",
            "Using inconsistent metadata schemas across the document corpus."
        ],
        interviewQuestions: [
            {
                q: "How does prepending metadata strings to chunks improve LLM generations?",
                a: "It provides explicit global context (e.g., 'Author: Legal | Version: 2.1') for each retrieved snippet, preventing the LLM from making assumptions based on raw fragments."
            },
            {
                q: "What is the difference between metadata pre-filtering and post-filtering in retrieval?",
                a: "Pre-filtering filters the dataset in the database before the vector similarity search, whereas post-filtering does the vector search first and discards results that do not match metadata."
            }
        ]
    },
    'llm': {
        title: "LLM-Based Intelligent Chunking",
        definition: "Leverages an LLM (e.g., Llama or Gemma via Groq) to read the document, detect semantic transitions, and split the text into ideal, topic-labeled segments.",
        advantages: [
            "Excellent understanding of complex formatting, lists, and tables.",
            "Can output a reason and title for each chunk boundary."
        ],
        disadvantages: [
            "Very high API cost and latency.",
            "Requires handling potential LLM JSON formatting errors."
        ],
        useCases: [
            "High-value financial audits or annual reports.",
            "Complex regulatory and compliance agreements.",
            "Conversational transcripts containing multiple shifting themes."
        ],
        industryExamples: [
            "Advanced pre-processing engines in high-end legal analysis tools.",
            "Document processing pipelines for medical diagnostic reviews."
        ],
        whyCompaniesUseIt: [
            "Intelligently extracts logical sub-topics without hardcoded rules.",
            "Handles highly unstructured or irregular business reports with high accuracy.",
            "Provides clear reasoning explanations for segment transitions."
        ],
        bestPractices: [
            "Use smaller, high-throughput models (e.g., Llama 3 8B) for fast transitions.",
            "Implement structural JSON schemas with fallback regex parsers."
        ],
        commonMistakes: [
            "Sending giant documents in single API prompts, exceeding input context windows.",
            "Failing to configure fallback heuristics when API limits are hit."
        ],
        interviewQuestions: [
            {
                q: "What makes LLM-based chunking superior for unstructured reports?",
                a: "LLMs understand the underlying narrative flow, context, and structural tables in ways that regular expressions or character distances cannot match, placing splits only at true transition boundaries."
            },
            {
                q: "What are the hurdles to scaling LLM chunking?",
                a: "API execution costs and request latency. Segmenting a large document library using LLM calls is significantly slower and more expensive than heuristic methods."
            }
        ]
    },
    'agentic': {
        title: "Agentic LangGraph Chunking",
        definition: "Uses an orchestrator agent built with LangGraph to classify document types, route them to optimal chunkers, and iteratively evaluate segment quality.",
        advantages: [
            "Fully automated optimization based on document complexity.",
            "Self-correcting: adjusts thresholds if chunks fail criteria."
        ],
        disadvantages: [
            "Highly complex architecture.",
            "Longest processing time due to agentic loops."
        ],
        useCases: [
            "Enterprise automated document processing (ingestion of arbitrary formats).",
            "Self-optimizing database indices for RAG training centers.",
            "Dynamic document layout categorizations."
        ],
        industryExamples: [
            "Autonomous agents for large-scale knowledge management.",
            "Adaptive preprocessing systems in advanced military or intelligence tools."
        ],
        whyCompaniesUseIt: [
            "Automatically routes documents to their ideal chunking strategy.",
            "Evaluates split distribution quality to prevent outlier chunks.",
            "Standardizes complex document processing pipelines automatically."
        ],
        bestPractices: [
            "Implement a maximum loop limit to prevent infinite iteration.",
            "Log trace nodes meticulously for complete step auditing."
        ],
        commonMistakes: [
            "Allowing loops to rerun without modifying parameters, wasting API tokens.",
            "Over-complicating decision logic for simple flat-text documents."
        ],
        interviewQuestions: [
            {
                q: "How does LangGraph facilitate agentic chunking?",
                a: "It allows developers to build a stateful, cyclical graph containing classification, chunking, and evaluation nodes that coordinate and adjust parameters dynamically until quality checks pass."
            },
            {
                q: "What does the self-correcting loop do in agentic chunking?",
                a: "If the evaluation node flags that chunks are too small or lack semantic coherence, it directs the graph back to the chunking node with updated strategy parameters (e.g., modifying thresholds)."
            }
        ]
    }
};

// Initialize Application
function initApp() {
    initTheme();
    checkBackendHealth();
    bindEvents();
    loadSavedSession();
    updateParameterVisibility(strategySelect.value);

    // Set initial tab visibility
    switchTab('analysis');

    // Poll backend health periodically
    setInterval(checkBackendHealth, 10000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}


// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// Backend Health Check
async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'healthy') {
                apiStatusEl.className = 'status-indicator connect';
                apiStatusLabelEl.textContent = 'Backend Online';
                return;
            }
        }
        setBackendOffline();
    } catch (error) {
        setBackendOffline();
    }
}

function setBackendOffline() {
    apiStatusEl.className = 'status-indicator disconnect';
    apiStatusLabelEl.textContent = 'Backend Offline';
}

// Session management - load saved workspace on browser startup
async function loadSavedSession() {
    try {
        const response = await fetch(`${BACKEND_URL}/session/load`);
        if (!response.ok) {
            loadSample('hr-policy');
            return;
        }
        const session = await response.json();
        if (!session || !session.metadata || !session.metadata.text) {
            loadSample('hr-policy');
            return;
        }

        // 1. Restore Document Text
        docPreviewText.innerText = session.metadata.text;
        updateTextMetrics();

        // Restore upload file indicators
        const filename = session.metadata.filename;
        if (filename) {
            const isUrlDoc = session.metadata.file_type === 'url';
            activeDocumentOrigin = {
                type: isUrlDoc ? 'web_url' : 'document',
                name: filename,
                url: isUrlDoc ? (session.metadata.url || null) : null
            };
            const dropzone = document.getElementById('dropzone');
            if (dropzone) {
                dropzone.innerHTML = `
                    <i class="fa-solid fa-file-circle-check upload-icon" style="color: var(--success);"></i>
                    <p class="upload-text" style="color: var(--success); font-weight: 700;">${escapeHTML(filename)}</p>
                    <p class="upload-hint">Parsed successfully (${(session.metadata.text.length / 1024).toFixed(1)} KB)</p>
                `;
            }
        }

        // 2. Restore Analysis
        if (session.metadata.metadata) {
            const meta = session.metadata.metadata;
            previewWordCount.textContent = meta.word_count || 0;
            previewCharCount.textContent = meta.character_count || 0;
            previewSentenceCount.textContent = meta.sentence_count || 0;
            previewParagraphCount.textContent = meta.paragraph_count || 0;
            previewTokenCount.textContent = meta.estimated_tokens || 0;
        }

        // 3. Restore Strategy and Parameters
        if (session.chunks && session.chunks.strategy) {
            const strat = session.chunks.strategy;
            strategySelect.value = strat;
            updateTeachingMode(strat);
            updateParameterVisibility(strat);

            // Restore parameters values
            const params = session.chunks.params || {};
            if (strat === 'fixed' || strat === 'recursive' || strat === 'query' || strat === 'metadata') {
                if (params.chunk_size !== undefined) {
                    paramChunkSize.value = params.chunk_size;
                    valChunkSize.textContent = params.chunk_size;
                }
                if (params.chunk_overlap !== undefined) {
                    paramOverlap.value = params.chunk_overlap;
                    valOverlap.textContent = params.chunk_overlap;
                }
            }
            if (strat === 'semantic') {
                if (params.threshold !== undefined) {
                    paramChunkSize.value = params.threshold;
                    valChunkSize.textContent = params.threshold;
                }
            }
            if (strat === 'query' && params.query) {
                const queryInput = document.getElementById('param-query-text');
                if (queryInput) queryInput.value = params.query;
            }
            if (strat === 'llm') {
                if (params.model) {
                    const modelSelect = document.getElementById('param-llm-model');
                    if (modelSelect) modelSelect.value = params.model;
                }
            }

            // 4. Restore Chunk Output
            currentChunkData = session.chunks.result;
            if (currentChunkData) {
                renderChunkResults(currentChunkData, strat);
            }
        }

        // 5. Restore Comparison Dashboard
        if (session.stats) {
            renderComparisonDashboard(session.stats);
        }

        // 6. Restore Retrieval Simulator results
        if (session.retrieval && session.retrieval.result) {
            const querySimInput = document.getElementById('global-sim-query-input');
            if (querySimInput && session.retrieval.query) {
                querySimInput.value = session.retrieval.query;
            }

            // Re-render retrieval results list on global simulation tab
            const simResultsContainer = document.getElementById('global-sim-results-container');
            const meanSim = document.getElementById('global-sim-mean-similarity');
            const precisionSim = document.getElementById('global-sim-precision');
            const recallSim = document.getElementById('global-sim-recall');

            const res = session.retrieval.result;
            if (meanSim) meanSim.textContent = res.mean_similarity !== undefined ? res.mean_similarity.toFixed(4) : '---';
            if (precisionSim) precisionSim.textContent = res.precision !== undefined ? `${(res.precision * 100).toFixed(0)}%` : '---';
            if (recallSim) recallSim.textContent = res.recall !== undefined ? `${(res.recall * 100).toFixed(0)}%` : '---';

            if (simResultsContainer && res.retrieved) {
                simResultsContainer.innerHTML = '';
                res.retrieved.forEach((item) => {
                    const card = document.createElement('div');
                    card.className = 'chunk-visual-card expanded';

                    let metaBadgesHtml = '';
                    if (item.chunk.metadata) {
                        for (const [key, val] of Object.entries(item.chunk.metadata)) {
                            if (key.toLowerCase() === 'section') continue;
                            let shortKey = key.substring(0, 4);
                            if (key.toLowerCase() === 'department') shortKey = 'Dept';
                            else if (key.toLowerCase() === 'author') shortKey = 'Auth';
                            else if (key.toLowerCase() === 'version') shortKey = 'Ver';
                            metaBadgesHtml += `<span class="chunk-meta-badge" title="${escapeHTML(key)}: ${escapeHTML(val)}"><i class="fa-solid fa-tag"></i> ${escapeHTML(shortKey)}: ${escapeHTML(val)}</span>`;
                        }
                    }

                    let matchesHtml = '';
                    if (item.metadata_matches && item.metadata_matches.length > 0) {
                        matchesHtml = `
                            <div style="margin-top: 6px; font-size: 10px; color: var(--success); font-weight: 600;">
                                <i class="fa-solid fa-circle-check"></i> Metadata Matches: ${escapeHTML(item.metadata_matches.join(', '))}
                            </div>
                        `;
                    }

                    card.innerHTML = `
                        <div class="chunk-card-header">
                            <span class="chunk-number">Chunk #${item.chunk.index}</span>
                            ${metaBadgesHtml}
                            <span class="chunk-size-badge">${item.chunk.length} chars</span>
                        </div>
                        <div class="chunk-card-body">${escapeHTML(item.chunk.text)}</div>
                        <div class="sim-score-badges">
                            <span class="sim-badge similarity"><i class="fa-solid fa-chart-simple"></i> Sim: ${item.similarity_score.toFixed(4)}</span>
                            <span class="sim-badge meta-boost"><i class="fa-solid fa-rocket"></i> Boost: +${item.metadata_match_score.toFixed(2)}</span>
                            <span class="sim-badge confidence"><i class="fa-solid fa-star"></i> Conf: ${item.retrieval_confidence.toFixed(4)}</span>
                        </div>
                        ${matchesHtml}
                    `;
                    simResultsContainer.appendChild(card);
                });
            }
        }

    } catch (e) {
        console.error("Error restoring session:", e);
        loadSample('hr-policy');
    }
}

// Bind Interactions
function bindEvents() {
    // Theme
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Reset Workspace session clear
    const btnClearSession = document.getElementById('btn-clear-session');
    if (btnClearSession) {
        btnClearSession.addEventListener('click', async () => {
            if (confirm("Are you sure you want to reset the workspace? This will clear your active document text, comparison charts, and cached session data.")) {
                try {
                    await fetch(`${BACKEND_URL}/session/clear`, { method: 'POST' });
                } catch (err) {
                    console.error("Error clearing backend session:", err);
                }
                window.location.reload();
            }
        });
    }

    // Download study guide PDF with Testleaf Logo
    const btnDownloadGuide = document.getElementById('btn-download-guide');
    if (btnDownloadGuide) {
        btnDownloadGuide.addEventListener('click', () => {
            window.location.href = `${BACKEND_URL}/api/download-guide`;
        });
    }

    // Strategy and params sliders
    strategySelect.addEventListener('change', (e) => {
        const strategy = e.target.value;
        updateTeachingMode(strategy);
        updateParameterVisibility(strategy);
    });

    paramChunkSize.addEventListener('input', (e) => {
        valChunkSize.textContent = e.target.value;
    });

    paramOverlap.addEventListener('input', (e) => {
        valOverlap.textContent = e.target.value;
    });

    // Content Editable live update
    docPreviewText.addEventListener('input', updateTextMetrics);

    // Sample loading
    document.querySelectorAll('.sample-item-btn[data-sample]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sample-item-btn[data-sample]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const sampleKey = btn.getAttribute('data-sample');
            loadSample(sampleKey);
        });
    });

    // Process button click
    processBtn.addEventListener('click', () => {
        applyChunking();
    });

    // MongoDB Ingest button click listeners
    const btnIngestMongo = document.getElementById('btn-ingest-mongodb');
    if (btnIngestMongo) {
        btnIngestMongo.addEventListener('click', ingestCurrentChunksIntoMongoDB);
    }
    const btnIngestMongoSide = document.getElementById('btn-ingest-mongodb-side');
    if (btnIngestMongoSide) {
        btnIngestMongoSide.addEventListener('click', ingestCurrentChunksIntoMongoDB);
    }

    // Modal close listeners
    const btnCloseMongo = document.getElementById('btn-close-mongo-modal');
    if (btnCloseMongo) {
        btnCloseMongo.addEventListener('click', () => {
            const m = document.getElementById('mongo-modal');
            if (m) m.style.display = 'none';
        });
    }
    const btnDismissMongo = document.getElementById('btn-dismiss-mongo-modal');
    if (btnDismissMongo) {
        btnDismissMongo.addEventListener('click', () => {
            const m = document.getElementById('mongo-modal');
            if (m) m.style.display = 'none';
        });
    }

    // View toggle (List vs Grid)
    toggleViewBtn.addEventListener('click', () => {
        if (activeView === 'tree') {
            activeView = isGridView ? 'grid' : 'list';
        } else {
            isGridView = !isGridView;
            activeView = isGridView ? 'grid' : 'list';
        }
        updateViewToggles();
        renderChunkResults(currentChunkData, strategySelect.value);
    });

    // Tree View toggle
    toggleTreeBtn.addEventListener('click', () => {
        if (activeView !== 'tree') {
            activeView = 'tree';
        } else {
            activeView = isGridView ? 'grid' : 'list';
        }
        updateViewToggles();
        renderChunkResults(currentChunkData, strategySelect.value);
    });

    // Drag & Drop events
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Tab buttons event listeners
    if (tabAnalysis && tabStats) {
        tabAnalysis.addEventListener('click', () => {
            switchTab('analysis');
        });
        tabStats.addEventListener('click', () => {
            switchTab('stats');
        });
    }

    // Run Analysis click listener
    if (btnAnalyzeDoc) {
        btnAnalyzeDoc.addEventListener('click', () => {
            const text = docPreviewText.innerText.trim();
            if (text) {
                analyzeDocument(text);
            } else {
                alert("Please enter or select some text to analyze.");
            }
        });
    }

    // Auto-discover metadata checkbox toggle
    const autodiscoverCheckbox = document.getElementById('param-meta-autodiscover');
    const manualFields = document.getElementById('param-meta-manual-fields');
    if (autodiscoverCheckbox && manualFields) {
        autodiscoverCheckbox.addEventListener('change', (e) => {
            manualFields.style.display = e.target.checked ? 'none' : 'flex';
        });
    }

    // Simulate LLM checkbox toggle
    const llmSimulatedCheckbox = document.getElementById('param-llm-simulated');
    const llmRealFields = document.getElementById('param-llm-real-fields');
    if (llmSimulatedCheckbox && llmRealFields) {
        llmSimulatedCheckbox.addEventListener('change', (e) => {
            llmRealFields.style.display = e.target.checked ? 'none' : 'flex';
        });
    }

    // Metadata view tabs click listener
    document.querySelectorAll('.meta-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.meta-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            switchMetadataView(view);
        });
    });

    // Document view tabs click listener
    document.querySelectorAll('.doc-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.doc-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            switchDocumentView(view);
        });
    });

    // Semantic view tabs click listener
    document.querySelectorAll('.sem-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sem-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            switchSemanticView(view);
        });
    });

    // Query view tabs click listener
    document.querySelectorAll('.query-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.query-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            switchQueryView(view);
        });
    });

    // Run query simulation click listener
    const btnRunQuerySim = document.getElementById('btn-run-query-sim');
    if (btnRunQuerySim) {
        btnRunQuerySim.addEventListener('click', () => {
            const querySimSearch = document.getElementById('query-sim-search');
            if (querySimSearch) {
                runQuerySimulationPlayground(querySimSearch.value.trim());
            }
        });
    }

    // Teaching sub-tabs click listener
    document.querySelectorAll('.teach-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.teach-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabName = btn.getAttribute('data-teach-tab');
            switchTeachingTab(tabName);
        });
    });

    // RAG Simulation retrieve click
    const btnSimRetrieve = document.getElementById('btn-sim-retrieve');
    if (btnSimRetrieve) {
        btnSimRetrieve.addEventListener('click', runRetrievalSimulation);
    }

    // Agentic view tabs click listener
    document.querySelectorAll('.agentic-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.agentic-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            switchAgenticView(view);
        });
    });

    // Main output view tabs (Chunks View vs Comparison Dashboard vs RAG Simulator)
    const btnMainChunks = document.getElementById('btn-main-chunks');
    const btnMainCompare = document.getElementById('btn-main-compare');
    const btnMainSimulator = document.getElementById('btn-main-simulator');
    const singleStrategyContainer = document.getElementById('single-strategy-container');
    const comparisonDashboardContainer = document.getElementById('comparison-dashboard-container');
    const globalSimulatorContainer = document.getElementById('global-simulator-container');
    const outputHeaderActions = document.querySelector('.output-actions');

    if (btnMainChunks && btnMainCompare && btnMainSimulator && singleStrategyContainer && comparisonDashboardContainer && globalSimulatorContainer) {
        btnMainChunks.addEventListener('click', () => {
            btnMainChunks.classList.add('active');
            btnMainCompare.classList.remove('active');
            btnMainSimulator.classList.remove('active');
            singleStrategyContainer.style.display = 'flex';
            comparisonDashboardContainer.style.display = 'none';
            globalSimulatorContainer.style.display = 'none';
            if (outputHeaderActions) outputHeaderActions.style.display = 'flex';
        });

        btnMainCompare.addEventListener('click', () => {
            btnMainCompare.classList.add('active');
            btnMainChunks.classList.remove('active');
            btnMainSimulator.classList.remove('active');
            singleStrategyContainer.style.display = 'none';
            comparisonDashboardContainer.style.display = 'flex';
            globalSimulatorContainer.style.display = 'none';
            if (outputHeaderActions) outputHeaderActions.style.display = 'none';
        });

        btnMainSimulator.addEventListener('click', () => {
            btnMainSimulator.classList.add('active');
            btnMainChunks.classList.remove('active');
            btnMainCompare.classList.remove('active');
            singleStrategyContainer.style.display = 'none';
            comparisonDashboardContainer.style.display = 'none';
            globalSimulatorContainer.style.display = 'flex';
            if (outputHeaderActions) outputHeaderActions.style.display = 'none';
        });
    }

    // Run strategy comparison button
    const btnRunCompare = document.getElementById('btn-run-comparison');
    if (btnRunCompare) {
        btnRunCompare.addEventListener('click', runBatchComparison);
    }

    // Global RAG Simulator retrieve button
    const btnGlobalSimRetrieve = document.getElementById('btn-global-sim-retrieve');
    if (btnGlobalSimRetrieve) {
        btnGlobalSimRetrieve.addEventListener('click', runGlobalRetrievalSimulation);
    }

    // Source Ingestion Toggle Tabs
    const sourceTabs = document.querySelectorAll('.source-tab');
    const uploadCard = document.querySelector('.card.upload-card:not(#url-ingestion-card)');
    const samplesCard = document.querySelector('.card.samples-card:not(#website-sample-card)');
    const urlIngestionCard = document.getElementById('url-ingestion-card');
    const websiteSampleCard = document.getElementById('website-sample-card');
    const urlAnalysisSection = document.getElementById('structure-analysis-panel');

    sourceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sourceTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const source = tab.getAttribute('data-source');

            // Hide all first
            if (uploadCard) uploadCard.style.display = 'none';
            if (samplesCard) samplesCard.style.display = 'none';
            if (urlIngestionCard) urlIngestionCard.style.display = 'none';
            if (websiteSampleCard) websiteSampleCard.style.display = 'none';

            if (source === 'upload') {
                if (uploadCard) uploadCard.style.display = 'block';
                if (samplesCard) samplesCard.style.display = 'block';
            } else if (source === 'url') {
                if (urlIngestionCard) urlIngestionCard.style.display = 'block';
            } else if (source === 'sample') {
                if (websiteSampleCard) websiteSampleCard.style.display = 'block';
            }

            if (urlAnalysisSection) {
                const hasContent = docPreviewText && docPreviewText.innerText.trim().length > 0;
                urlAnalysisSection.style.display = hasContent ? 'block' : 'none';
            }
        });
    });

    // Web URL Ingestion Fetch Action
    const btnFetchUrl = document.getElementById('btn-fetch-url');
    const urlInput = document.getElementById('url-input');
    const urlFetchError = document.getElementById('url-fetch-error');

    if (btnFetchUrl && urlInput && urlFetchError) {
        btnFetchUrl.addEventListener('click', async () => {
            let urlVal = urlInput.value.trim();
            if (!urlVal) {
                alert("Please enter a valid website URL.");
                return;
            }

            // Hide error and show loading state
            urlFetchError.style.display = 'none';
            btnFetchUrl.disabled = true;
            btnFetchUrl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
            docPreviewText.innerText = `Fetching and extracting main content from ${urlVal}... Please wait.`;

            try {
                const response = await fetch(`${BACKEND_URL}/document/fetch-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: urlVal })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || `Server returned status ${response.status}`);
                }

                const data = await response.json();
                docPreviewText.innerText = data.text;
                updateTextMetrics(data.metadata);

                activeDocumentOrigin = {
                    type: 'web_url',
                    name: data.filename || urlVal,
                    url: urlVal
                };

                const badge = document.getElementById('doc-type-badge');
                if (badge) badge.textContent = "Web Page";

                await analyzeDocument(data.text);
                classifyWebContent(urlVal, data.text, null);

            } catch (err) {
                console.error("URL Ingestion failed:", err);
                urlFetchError.textContent = `Error: ${err.message}`;
                urlFetchError.style.display = 'block';
                docPreviewText.innerText = `Failed to ingest URL content.\n\nError details: ${err.message}\n\nPlease verify that the backend is running, the URL is correct, and public access is available.`;
                updateTextMetrics();
            } finally {
                btnFetchUrl.disabled = false;
                btnFetchUrl.innerHTML = '<i class="fa-solid fa-download"></i> Fetch';
            }
        });
    }

    // Website Samples click listeners
    document.querySelectorAll('.sample-item-btn[data-website-sample]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sample-item-btn[data-website-sample]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const websiteKey = btn.getAttribute('data-website-sample');
            loadWebsiteSample(websiteKey);
        });
    });
}

// Load Document Sample
function loadSample(key) {
    const sample = samples[key];
    if (sample) {
        docPreviewText.innerText = sample.text;
        document.getElementById('doc-type-badge').textContent = sample.type;
        activeDocumentOrigin = {
            type: 'document',
            name: sample.title || key,
            url: null
        };
        updateTextMetrics();
        analyzeDocument(sample.text);
    }
}

// Update text statistics dynamically
function updateTextMetrics(metadata = null) {
    const text = docPreviewText.innerText.trim();
    if (!text) {
        previewWordCount.innerHTML = '<i class="fa-solid fa-heading"></i> 0 words';
        previewCharCount.innerHTML = '<i class="fa-solid fa-font"></i> 0 characters';
        if (previewSentenceCount) previewSentenceCount.innerHTML = '<i class="fa-solid fa-quote-left"></i> 0 sentences';
        if (previewParagraphCount) previewParagraphCount.innerHTML = '<i class="fa-solid fa-paragraph"></i> 0 paragraphs';
        if (previewTokenCount) previewTokenCount.innerHTML = '<i class="fa-solid fa-ticket"></i> 0 tokens';
        return;
    }

    let words, chars, sentences, paragraphs, tokens;

    if (metadata) {
        words = metadata.word_count;
        chars = metadata.character_count;
        sentences = metadata.sentence_count;
        paragraphs = metadata.paragraph_count;
        tokens = metadata.estimated_tokens;
    } else {
        words = text.split(/\s+/).filter(w => w.length > 0).length;
        chars = text.length;
        sentences = text.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0).length || (text.length > 0 ? 1 : 0);
        paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || (text.length > 0 ? 1 : 0);
        tokens = Math.round(chars / 4);
    }

    previewWordCount.innerHTML = `<i class="fa-solid fa-heading"></i> ${words} words`;
    previewCharCount.innerHTML = `<i class="fa-solid fa-font"></i> ${chars} characters`;
    if (previewSentenceCount) previewSentenceCount.innerHTML = `<i class="fa-solid fa-quote-left"></i> ${sentences} sentences`;
    if (previewParagraphCount) previewParagraphCount.innerHTML = `<i class="fa-solid fa-paragraph"></i> ${paragraphs} paragraphs`;
    if (previewTokenCount) previewTokenCount.innerHTML = `<i class="fa-solid fa-ticket"></i> ${tokens} tokens`;
}

// Switch sub-tabs in teaching card
function switchTeachingTab(tabName) {
    document.querySelectorAll('.teach-tab-content').forEach(panel => {
        panel.classList.add('hidden');
    });
    const targetPanel = document.getElementById(`teach-tab-${tabName}`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }
}

// Update Teaching Panel details
function updateTeachingMode(strategy) {
    const content = teachingContent[strategy];
    if (content) {
        teachingIntroEl.classList.add('hidden');
        strategyDetailsEl.classList.remove('hidden');

        teachTitle.textContent = content.title;
        teachDefinition.textContent = content.definition;

        const workflowBtn = document.getElementById('teach-tab-btn-workflow');
        if (workflowBtn) {
            workflowBtn.style.display = (strategy === 'document') ? 'inline-block' : 'none';
        }

        const queryFlowDiagram = document.getElementById('teach-query-flow-diagram');
        if (queryFlowDiagram) {
            queryFlowDiagram.style.display = (strategy === 'query') ? 'block' : 'none';
        }

        // Reset sub-tabs to overview
        document.querySelectorAll('.teach-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-teach-tab') === 'overview') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        switchTeachingTab('overview');

        // Render Advantages
        teachAdvantages.innerHTML = '';
        content.advantages.forEach(adv => {
            const li = document.createElement('li');
            li.textContent = adv;
            teachAdvantages.appendChild(li);
        });

        // Render Disadvantages
        teachDisadvantages.innerHTML = '';
        content.disadvantages.forEach(dis => {
            const li = document.createElement('li');
            li.textContent = dis;
            teachDisadvantages.appendChild(li);
        });

        // Render Why Companies Use It
        const whyUseSection = document.getElementById('teach-why-companies-use-section');
        const whyUseContainer = document.getElementById('teach-why-companies-use');
        if (whyUseSection && whyUseContainer) {
            if (content.whyCompaniesUseIt && content.whyCompaniesUseIt.length > 0) {
                whyUseContainer.innerHTML = '';
                content.whyCompaniesUseIt.forEach(w => {
                    const li = document.createElement('li');
                    li.textContent = w;
                    whyUseContainer.appendChild(li);
                });
                whyUseSection.style.display = 'block';
            } else {
                whyUseSection.style.display = 'none';
            }
        }

        // Render Use Cases
        const useCasesContainer = document.getElementById('teach-use-cases');
        if (useCasesContainer) {
            useCasesContainer.innerHTML = '';
            (content.useCases || []).forEach(uc => {
                const li = document.createElement('li');
                li.textContent = uc;
                useCasesContainer.appendChild(li);
            });
        }

        // Render Industry Examples
        const industryExamplesContainer = document.getElementById('teach-industry-examples');
        if (industryExamplesContainer) {
            industryExamplesContainer.innerHTML = '';
            (content.industryExamples || []).forEach(ie => {
                const li = document.createElement('li');
                li.textContent = ie;
                industryExamplesContainer.appendChild(li);
            });
        }

        // Render Best Practices
        const bestPracticesContainer = document.getElementById('teach-best-practices');
        if (bestPracticesContainer) {
            bestPracticesContainer.innerHTML = '';
            (content.bestPractices || []).forEach(bp => {
                const li = document.createElement('li');
                li.textContent = bp;
                bestPracticesContainer.appendChild(li);
            });
        }

        // Render Common Mistakes
        const commonMistakesContainer = document.getElementById('teach-common-mistakes');
        if (commonMistakesContainer) {
            commonMistakesContainer.innerHTML = '';
            (content.commonMistakes || []).forEach(cm => {
                const li = document.createElement('li');
                li.textContent = cm;
                commonMistakesContainer.appendChild(li);
            });
        }

        // Render Interview Q&A (Accordion)
        const interviewContainer = document.getElementById('teach-interview-questions');
        if (interviewContainer) {
            interviewContainer.innerHTML = '';
            (content.interviewQuestions || []).forEach((iq, index) => {
                const item = document.createElement('div');
                item.className = 'accordion-item';

                const header = document.createElement('button');
                header.className = 'accordion-header';
                header.innerHTML = `
                    <span>Q${index + 1}: ${escapeHTML(iq.q)}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                `;

                const body = document.createElement('div');
                body.className = 'accordion-content';
                body.textContent = iq.a;

                header.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    interviewContainer.querySelectorAll('.accordion-item').forEach(el => {
                        el.classList.remove('active');
                        el.querySelector('.accordion-content').style.display = 'none';
                    });

                    if (!isActive) {
                        item.classList.add('active');
                        body.style.display = 'block';
                    }
                });

                item.appendChild(header);
                item.appendChild(body);
                interviewContainer.appendChild(item);
            });
        }
    } else {
        teachingIntroEl.classList.remove('hidden');
        strategyDetailsEl.classList.add('hidden');
    }
}

// Handle Custom Uploaded File
async function handleFileUpload(file) {
    const allowedExtensions = ['txt', 'pdf', 'docx'];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        alert(`Unsupported file format '${extension}'. Only TXT, PDF, and DOCX are supported.`);
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        alert("File size exceeds 20MB limit.");
        return;
    }

    const badge = document.getElementById('doc-type-badge');
    badge.textContent = extension.toUpperCase();

    // Set loading indicator
    docPreviewText.innerText = `Parsing ${file.name}... Please wait.`;
    previewWordCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    previewCharCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    if (previewSentenceCount) previewSentenceCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    if (previewParagraphCount) previewParagraphCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    if (previewTokenCount) previewTokenCount.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${BACKEND_URL}/document/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        docPreviewText.innerText = data.text;
        activeDocumentOrigin = {
            type: 'document',
            name: file.name,
            url: null
        };
        updateTextMetrics(data.metadata);
        analyzeDocument(data.text);
    } catch (error) {
        console.error("Error uploading document:", error);
        alert(`Failed to upload document: ${error.message}`);
        docPreviewText.innerText = `Error parsing file: ${error.message}\n\nPlease ensure the backend server is running and try again.`;
        updateTextMetrics();
    }
}

// Simulate static chunking locally for Phase 0 setup preview
// Perform backend chunking via POST API call
async function applyChunking() {
    const text = docPreviewText.innerText.trim();
    if (!text) {
        alert("Please enter or select some text to chunk.");
        return;
    }

    const strategy = strategySelect.value;
    const chunkSize = parseInt(paramChunkSize.value, 10);
    const overlap = parseInt(paramOverlap.value, 10);

    // Overlap validation is only relevant for strategies using chunk size/overlap parameters
    if ((strategy === 'fixed' || strategy === 'recursive' || strategy === 'query' || strategy === 'metadata') && overlap >= chunkSize) {
        alert("Overlap must be strictly less than the Chunk Size.");
        return;
    }

    if (strategy === 'fixed' || strategy === 'recursive' || strategy === 'document' || strategy === 'semantic' || strategy === 'query' || strategy === 'metadata' || strategy === 'llm' || strategy === 'agentic') {
        // Show loading state
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        let endpoint = strategy;
        const reqBody = { text: text };
        if (strategy === 'fixed' || strategy === 'recursive') {
            reqBody.chunk_size = chunkSize;
            reqBody.chunk_overlap = overlap;
        } else if (strategy === 'semantic') {
            reqBody.threshold = parseFloat(paramChunkSize.value);
        } else if (strategy === 'query') {
            endpoint = 'query-aware';
            const queryText = document.getElementById('param-query-text').value.trim();
            if (!queryText) {
                alert('Please enter a search query for query-aware chunking.');
                processBtn.disabled = false;
                processBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Apply Chunking';
                return;
            }
            reqBody.query = queryText;
            reqBody.chunk_size = chunkSize;
            reqBody.chunk_overlap = overlap;
        } else if (strategy === 'metadata') {
            reqBody.chunk_size = chunkSize;
            reqBody.chunk_overlap = overlap;
            reqBody.auto_discover = document.getElementById('param-meta-autodiscover').checked;
            reqBody.metadata = {
                department: document.getElementById('param-meta-dept').value.trim() || 'HR',
                author: document.getElementById('param-meta-author').value.trim() || 'Admin',
                version: document.getElementById('param-meta-version').value.trim() || '1.0'
            };
        } else if (strategy === 'llm') {
            endpoint = 'llm';
            reqBody.model = document.getElementById('param-llm-model').value;
            reqBody.api_key = document.getElementById('param-llm-api-key').value.trim();
            reqBody.simulated = document.getElementById('param-llm-simulated').checked;
        } else if (strategy === 'agentic') {
            endpoint = 'agentic';
            const queryText = document.getElementById('param-query-text').value.trim();
            if (queryText) {
                reqBody.query = queryText;
            }
        }

        try {
            const response = await fetch(`${BACKEND_URL}/chunk/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `Server error: ${response.status}`);
            }

            const data = await response.json();

            // Render results
            renderChunkResults(data, strategy);

        } catch (error) {
            console.error("Chunking request failed:", error);
            alert(`Chunking failed: ${error.message}`);
        } finally {
            processBtn.disabled = false;
            processBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Apply Chunking';
        }
    } else {
        // Fallback simulation for other strategies until their phases are implemented
        simulateChunking();
    }
}

// Render chunks and update metrics on UI
function renderChunkResults(data, strategy) {
    currentChunkData = data;

    // Enable MongoDB Ingestion buttons when valid chunks exist
    const btnIngestMongo = document.getElementById('btn-ingest-mongodb');
    const btnIngestMongoSide = document.getElementById('btn-ingest-mongodb-side');
    const hasValidChunks = data && data.chunks && data.chunks.length > 0;
    if (btnIngestMongo) {
        btnIngestMongo.disabled = !hasValidChunks;
        btnIngestMongo.title = hasValidChunks 
            ? `Proceed to ingest ${data.chunks.length} chunks into MongoDB` 
            : "Generate chunks first before ingesting";
    }
    if (btnIngestMongoSide) {
        btnIngestMongoSide.disabled = !hasValidChunks;
        btnIngestMongoSide.title = hasValidChunks 
            ? `Ingest ${data.chunks.length} chunks into MongoDB` 
            : "Generate chunks first before ingesting";
    }

    // Automatically switch main output tab back to Chunks View
    const btnMainChunks = document.getElementById('btn-main-chunks');
    if (btnMainChunks) {
        btnMainChunks.click();
    }

    // Reset RAG Simulator inputs/results
    const simQueryInput = document.getElementById('global-sim-query-input');
    const simResultsContainer = document.getElementById('global-sim-results-container');
    if (simQueryInput) simQueryInput.value = '';
    if (simResultsContainer) {
        simResultsContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-magnifying-glass-chart empty-icon animate-pulse"></i>
                <h3>No Simulation Query Sent Yet</h3>
                <p>Type a question above and click Retrieve to simulate vector search semantic retrieval on the active strategy's chunks.</p>
            </div>
        `;
    }
    const meanSim = document.getElementById('global-sim-mean-similarity');
    const precisionSim = document.getElementById('global-sim-precision');
    const recallSim = document.getElementById('global-sim-recall');
    if (meanSim) meanSim.textContent = '---';
    if (precisionSim) precisionSim.textContent = '---';
    if (recallSim) recallSim.textContent = '---';

    // Handle tree view button visibility
    if (strategy === 'recursive') {
        toggleTreeBtn.style.display = 'inline-flex';
    } else {
        toggleTreeBtn.style.display = 'none';
        if (activeView === 'tree') {
            activeView = isGridView ? 'grid' : 'list';
            updateViewToggles();
        }
    }

    const isMetadata = (strategy === 'metadata');
    const isAgentic = (strategy === 'agentic');
    const isDocument = (strategy === 'document');
    const isSemantic = (strategy === 'semantic');
    const isQuery = (strategy === 'query');
    const metaTabs = document.getElementById('metadata-view-tabs');
    const agenticTabs = document.getElementById('agentic-view-tabs');
    const docTabs = document.getElementById('document-view-tabs');
    const semanticTabs = document.getElementById('semantic-view-tabs');
    const queryTabs = document.getElementById('query-view-tabs');
    const filterBar = document.getElementById('metadata-filter-bar');

    if (metaTabs) {
        metaTabs.style.display = isMetadata ? 'flex' : 'none';
    }
    if (agenticTabs) {
        agenticTabs.style.display = isAgentic ? 'flex' : 'none';
    }
    if (docTabs) {
        docTabs.style.display = isDocument ? 'flex' : 'none';
    }
    if (semanticTabs) {
        semanticTabs.style.display = isSemantic ? 'flex' : 'none';
    }
    if (queryTabs) {
        queryTabs.style.display = isQuery ? 'flex' : 'none';
    }

    const docStructurePanel = document.getElementById('doc-structure-panel');
    const docMetadataPanel = document.getElementById('doc-metadata-panel');
    const docMappingPanel = document.getElementById('doc-mapping-panel');
    const semVisualizationPanel = document.getElementById('sem-visualization-panel');
    const semConceptPanel = document.getElementById('sem-concept-panel');
    const semInsightsPanel = document.getElementById('sem-insights-panel');
    const querySimulationPanel = document.getElementById('query-simulation-panel');
    const queryConceptPanel = document.getElementById('query-concept-panel');

    if (docStructurePanel) docStructurePanel.style.display = 'none';
    if (docMetadataPanel) docMetadataPanel.style.display = 'none';
    if (docMappingPanel) docMappingPanel.style.display = 'none';
    if (semVisualizationPanel) semVisualizationPanel.style.display = 'none';
    if (semConceptPanel) semConceptPanel.style.display = 'none';
    if (semInsightsPanel) semInsightsPanel.style.display = 'none';
    if (querySimulationPanel) querySimulationPanel.style.display = 'none';
    if (queryConceptPanel) queryConceptPanel.style.display = 'none';

    if (isMetadata) {
        // Reset active tab buttons
        document.querySelectorAll('.meta-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === 'cards') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        switchMetadataView('cards');
    } else if (isAgentic) {
        // Reset active tab buttons
        document.querySelectorAll('.agentic-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === 'graph') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        switchAgenticView('graph');
    } else if (isDocument) {
        // Reset active tab buttons
        document.querySelectorAll('.doc-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === 'structure') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        switchDocumentView('structure');

        // Render document specific components
        renderDocumentStructureTree(data);
        renderDocumentMetadata(data);
        renderDocumentMappingFlow(data);
    } else if (isSemantic) {
        // Reset active tab buttons
        document.querySelectorAll('.sem-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === 'visualization') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        switchSemanticView('visualization');

        // Render semantic specific components
        renderSemanticSimilarityFlow(data);
    } else if (isQuery) {
        // Reset active tab buttons
        document.querySelectorAll('.query-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === 'simulation') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        switchQueryView('simulation');

        // Reset simulator results to default
        const querySimSearch = document.getElementById('query-sim-search');
        if (querySimSearch) {
            const queryUsed = document.getElementById('param-query-text').value.trim();
            querySimSearch.value = queryUsed || "What is the PTO policy?";
        }

        const querySimResultsContainer = document.getElementById('query-sim-results-container');
        if (querySimResultsContainer) {
            querySimResultsContainer.innerHTML = `
                <div class="empty-output-state" style="padding: 20px;">
                    <i class="fa-solid fa-magnifying-glass empty-icon"></i>
                    <h4 style="font-size: 12px;">No Query Simulated Yet</h4>
                    <p style="font-size: 10px;">Enter a question above and click Run Simulation to test retrieval ranking.</p>
                </div>
            `;
        }
    } else {
        // Hide metadata-specific views and restore grid
        const grid = document.getElementById('chunks-output-grid');
        if (grid) grid.style.display = '';
        if (filterBar) filterBar.style.display = 'none';

        const timelinePanel = document.getElementById('meta-timeline-panel');
        const comparisonPanel = document.getElementById('meta-comparison-panel');
        const simulatorPanel = document.getElementById('meta-simulator-panel');
        const agenticWorkflowPanel = document.getElementById('agentic-workflow-panel');

        if (timelinePanel) timelinePanel.style.display = 'none';
        if (comparisonPanel) comparisonPanel.style.display = 'none';
        if (simulatorPanel) simulatorPanel.style.display = 'none';
        if (agenticWorkflowPanel) agenticWorkflowPanel.style.display = 'none';
    }

    // Handle metadata filter bar visibility
    if (filterBar && isMetadata) {
        filterBar.style.display = 'flex';
        setupMetadataFilters(data);
    }

    const chunks = data.chunks;
    const metrics = data.metrics;

    // Update segmentation stats card
    document.getElementById('stat-total-chunks').textContent = metrics.total_chunks;
    document.getElementById('stat-avg-size').innerHTML = `${metrics.avg_size} <span class="stat-unit">chars</span>`;

    // Estimated tokens approximation (1 token ~ 4 chars)
    const totalChars = chunks.reduce((acc, curr) => acc + curr.text.length, 0);
    const estTokens = Math.round(totalChars / 4);
    document.getElementById('stat-est-tokens').textContent = estTokens;

    document.getElementById('stat-time').innerHTML = `${metrics.processing_time_ms} <span class="stat-unit">ms</span>`;

    // Render based on active view mode
    if (activeView === 'tree' && strategy === 'recursive') {
        renderTreeView(data);
    } else {
        // Standard card view rendering with lazy loading (Phase 17)
        chunksOutputGrid.innerHTML = '';

        if (isGridView) {
            chunksOutputGrid.className = 'chunks-container grid-layout';
        } else {
            chunksOutputGrid.className = 'chunks-container list-layout';
        }

        if (chunks.length === 0) {
            chunksOutputGrid.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-cubes empty-icon animate-pulse"></i>
                    <h3>No Chunks Generated Yet</h3>
                    <p>Click the "Apply Chunking" button to segment your document and visualize the generated pieces.</p>
                </div>
            `;
            return;
        }

        // Initialize lazy loading batch state
        activeChunksArray = chunks;
        activeChunksStrategy = strategy;
        currentLoadedChunksCount = 0;

        renderNextChunkBatch(data);
    }

    // Switch to stats tab
    switchTab('stats');
}

// Renders the next PAGE_SIZE chunks to the UI (Phase 17 Performance Optimization)
function renderNextChunkBatch(data) {
    const strategy = activeChunksStrategy;

    // Remove existing "Load More" container if present
    const existingLoadMore = document.querySelector('.load-more-container');
    if (existingLoadMore) {
        existingLoadMore.remove();
    }

    // Prepend Educational Insights panel if strategy is fixed and it's the first batch
    if (strategy === 'fixed' && currentLoadedChunksCount === 0) {
        const insightsPanel = document.createElement('div');
        insightsPanel.className = 'fixed-insights-panel card premium-glass';
        insightsPanel.style.gridColumn = '1 / -1';

        const metrics = data.metrics || {};
        const totalChars = activeChunksArray.reduce((acc, curr) => acc + curr.text.length, 0);

        const timelineChunks = activeChunksArray.slice(0, 8);
        const timelineHtml = timelineChunks.map(c => {
            const leftPct = (c.start_char / totalChars) * 100;
            const widthPct = (c.length / totalChars) * 100;
            return `
                <div class="timeline-row" style="margin-bottom: 6px; cursor: pointer;" onclick="const el = document.getElementById('chunk-card-${c.index}'); if (el) { el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.classList.add('pulse-highlight'); setTimeout(() => el.classList.remove('pulse-highlight'), 2000); }">
                    <span class="timeline-label">Chunk #${c.index}</span>
                    <div class="timeline-bar-wrapper">
                        <div class="timeline-bar chunk-bar" style="left: ${leftPct}%; width: ${widthPct}%;" title="Range: ${c.start_char}-${c.end_char}">
                            ${c.overlap_size > 0 ? `<div class="timeline-bar-overlap" style="width: ${(c.overlap_size / c.length) * 100}%;"></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const moreLabel = activeChunksArray.length > 8 ? `<div class="timeline-more-indicator">Showing first 8 of ${activeChunksArray.length} chunks timeline</div>` : '';

        insightsPanel.innerHTML = `
            <div class="insights-header">
                <i class="fa-solid fa-graduation-cap"></i> Fixed-Size Chunking Educational Insights
            </div>
            
            <div class="insights-grid">
                <div class="insights-col">
                    <h4><i class="fa-solid fa-chart-simple"></i> Boundary Violations & Risk</h4>
                    <div class="insight-stat-row">
                        <span>Sentence Boundaries Broken:</span>
                        <span class="insight-stat-val warn-color">${metrics.total_sentence_breaks || 0} times</span>
                    </div>
                    <div class="insight-stat-row">
                        <span>Word Boundaries Broken:</span>
                        <span class="insight-stat-val warn-color">${metrics.total_word_breaks || 0} times</span>
                    </div>
                    <div class="insight-stat-row">
                        <span>Context Loss Risk:</span>
                        <span class="insight-risk-badge risk-${(metrics.context_loss_risk || 'Low').toLowerCase()}">${metrics.context_loss_risk || 'Low'}</span>
                    </div>
                </div>
                
                <div class="insights-col">
                    <h4><i class="fa-solid fa-lightbulb"></i> Would Semantic Chunking perform better?</h4>
                    <p class="comparison-q"><strong>Yes!</strong> Here is why:</p>
                    <p class="comparison-explanation">
                        Semantic Similarity Chunking splits text at natural sentence boundaries based on topic coherence. It avoids breaking sentences in half, preventing context loss and broken words, resulting in superior RAG retrieval precision and recall.
                    </p>
                </div>
            </div>
            
            <div class="timeline-visualization-section">
                <h4><i class="fa-solid fa-timeline"></i> Chunk Timeline & Overlap Visualizer</h4>
                <div class="timeline-bars-container">
                    <div class="timeline-row">
                        <span class="timeline-label">Document</span>
                        <div class="timeline-bar-wrapper">
                            <div class="timeline-bar doc-bar" style="width: 100%;"></div>
                            <span class="timeline-size-tag">${totalChars} chars</span>
                        </div>
                    </div>
                    <div class="chunks-timeline-bars" style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
                        ${timelineHtml}
                        ${moreLabel}
                    </div>
                </div>
            </div>
        `;
        chunksOutputGrid.appendChild(insightsPanel);
    }

    // Prepend Educational Insights panel if strategy is recursive and it's the first batch (Phase 22)
    if (strategy === 'recursive' && currentLoadedChunksCount === 0) {
        const insightsPanel = document.createElement('div');
        insightsPanel.className = 'recursive-insights-panel card premium-glass';
        insightsPanel.style.gridColumn = '1 / -1';

        const metrics = data.metrics || {};
        const comparison = data.comparison || { fixed: {}, recursive: {} };
        const counts = metrics.separator_counts || { paragraph: 0, line: 0, word: 0, character: 0 };

        const maxCount = Math.max(1, counts.paragraph, counts.line, counts.word, counts.character);
        const paraPct = (counts.paragraph / maxCount) * 100;
        const linePct = (counts.line / maxCount) * 100;
        const wordPct = (counts.word / maxCount) * 100;
        const charPct = (counts.character / maxCount) * 100;

        insightsPanel.innerHTML = `
            <div class="insights-header">
                <i class="fa-solid fa-graduation-cap"></i> Recursive Character Chunking Educational Insights
            </div>
            
            <div class="insights-grid">
                <div class="insights-col">
                    <h4><i class="fa-solid fa-chart-line"></i> Hierarchy Preservation Metrics</h4>
                    <div class="insight-stat-row">
                        <span>Paragraph Preservation %:</span>
                        <span class="insight-stat-val ${metrics.paragraph_preservation >= 70 ? 'text-success' : 'warn-color'}">${metrics.paragraph_preservation || 0}%</span>
                    </div>
                    <div class="insight-stat-row">
                        <span>Line Preservation %:</span>
                        <span class="insight-stat-val ${metrics.line_preservation >= 80 ? 'text-success' : 'warn-color'}">${metrics.line_preservation || 0}%</span>
                    </div>
                    <div class="insight-stat-row">
                        <span>Word Breaks Count:</span>
                        <span class="insight-stat-val" style="color: ${metrics.word_breaks === 0 ? 'var(--success)' : 'var(--accent-orange)'}">${metrics.word_breaks || 0} breaks</span>
                    </div>
                    <div class="insight-stat-row">
                        <span>Character Splits (Forced):</span>
                        <span class="insight-stat-val" style="color: ${metrics.character_breaks === 0 ? 'var(--success)' : 'var(--accent-orange)'}">${metrics.character_breaks || 0} splits</span>
                    </div>
                </div>
                
                <div class="insights-col">
                    <h4><i class="fa-solid fa-scissors"></i> Separator Usage Analytics</h4>
                    <div class="separator-analytics-grid">
                        <div class="separator-analytics-box">
                            <span class="sep-name">Paragraph (\\n\\n)</span>
                            <span class="sep-val">${counts.paragraph}</span>
                            <div class="sep-progress-bar"><div class="sep-progress-fill" style="width: ${paraPct}%; background: var(--success);"></div></div>
                        </div>
                        <div class="separator-analytics-box">
                            <span class="sep-name">Line (\\n)</span>
                            <span class="sep-val">${counts.line}</span>
                            <div class="sep-progress-bar"><div class="sep-progress-fill" style="width: ${linePct}%; background: var(--primary);"></div></div>
                        </div>
                        <div class="separator-analytics-box">
                            <span class="sep-name">Word (" ")</span>
                            <span class="sep-val">${counts.word}</span>
                            <div class="sep-progress-bar"><div class="sep-progress-fill" style="width: ${wordPct}%; background: var(--secondary);"></div></div>
                        </div>
                        <div class="separator-analytics-box">
                            <span class="sep-name">Char ("")</span>
                            <span class="sep-val">${counts.character}</span>
                            <div class="sep-progress-bar"><div class="sep-progress-fill" style="width: ${charPct}%; background: var(--danger);"></div></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="insights-grid" style="margin-top: 8px;">
                <div class="insights-col">
                    <h4><i class="fa-solid fa-scale-balanced"></i> Fixed vs Recursive Split Comparison</h4>
                    <table class="comparison-matrix-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Fixed Chunking</th>
                                <th>Recursive Chunking</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Paragraph Preservation</td>
                                <td class="value-cell">${comparison.fixed ? comparison.fixed.paragraph_preservation : 0}%</td>
                                <td class="value-cell text-success">${comparison.recursive ? comparison.recursive.paragraph_preservation : 0}%</td>
                            </tr>
                            <tr>
                                <td>Line Preservation</td>
                                <td class="value-cell">${comparison.fixed ? comparison.fixed.line_preservation : 0}%</td>
                                <td class="value-cell text-success">${comparison.recursive ? comparison.recursive.line_preservation : 0}%</td>
                            </tr>
                            <tr>
                                <td>Word Boundary Breaks</td>
                                <td class="value-cell ${comparison.fixed && comparison.fixed.word_breaks > 0 ? 'warn-color' : ''}">${comparison.fixed ? comparison.fixed.word_breaks : 0}</td>
                                <td class="value-cell text-success">${comparison.recursive ? comparison.recursive.word_breaks : 0}</td>
                            </tr>
                            <tr>
                                <td>Sentence Boundary Breaks</td>
                                <td class="value-cell ${comparison.fixed && comparison.fixed.sentence_breaks > 0 ? 'warn-color' : ''}">${comparison.fixed ? comparison.fixed.sentence_breaks : 0}</td>
                                <td class="value-cell text-success">${comparison.recursive ? comparison.recursive.sentence_breaks : 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="insights-col">
                    <h4><i class="fa-solid fa-graduation-cap"></i> Dynamic Hierarchy Preservation</h4>
                    <div style="font-size: 12px; line-height: 1.5; display: flex; flex-direction: column; gap: 8px;">
                        <p>
                            <strong>Why is Recursive better than Fixed?</strong> <br/>
                            Fixed-size chunking slices text strictly by character length, which frequently splits words (e.g., <code>comput-er</code>) and cuts sentences in half. Recursive chunking uses a hierarchical fallback system: it attempts splits on paragraphs first, then lines, then word spaces. This ensures word boundaries are never broken and sentences remain complete inside chunks.
                        </p>
                        <p>
                            <strong>Why is Recursive STILL not Semantic?</strong> <br/>
                            While recursive chunking preserves structural text segments (like paragraphs and lines), it does not analyze the <em>semantic meaning</em> or content transitions of sentences. If a single topic spans across paragraphs, recursive splitting might partition them into separate chunks purely based on size limits, whereas Semantic Chunking evaluates topic embedding similarities to group related paragraphs coherently.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="recursive-walkthrough-panel">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-play"></i> Recursive Process Walking Simulator
                    </h4>
                    <button class="btn btn-secondary btn-sm" id="btn-show-walkthrough"><i class="fa-solid fa-circle-play"></i> Show Recursive Process</button>
                </div>
                
                <div id="walkthrough-simulation-box" style="display: none;" class="walkthrough-simulation-box">
                    <div class="walkthrough-step-stepper">
                        <span>Current Separator:</span>
                        <span class="walkthrough-step-badge" id="walkthrough-step-badge">Paragraph split (\\n\\n)</span>
                        <span style="margin-left: auto;" id="walkthrough-step-counter">Step 1 of 4</span>
                    </div>
                    <div class="sim-text-container" id="sim-text-viewer"></div>
                    <div class="walkthrough-footer">
                        <span class="walkthrough-step-desc" id="walkthrough-step-desc">Identifying paragraph boundaries. The splitter targets \\n\\n double newlines to segment the text.</span>
                        <div class="walkthrough-controls">
                            <button class="btn btn-secondary btn-sm" id="btn-walkthrough-prev" disabled><i class="fa-solid fa-chevron-left"></i> Back</button>
                            <button class="btn btn-primary btn-sm" id="btn-walkthrough-next">Next <i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        chunksOutputGrid.appendChild(insightsPanel);
        setupWalkthroughSimulation();
    }

    const nextBatch = activeChunksArray.slice(currentLoadedChunksCount, currentLoadedChunksCount + PAGE_SIZE);
    nextBatch.forEach(chunk => {
        const card = document.createElement('div');
        card.className = 'chunk-visual-card';
        card.id = `chunk-card-${chunk.index}`;
        card.setAttribute('title', 'Click to expand/collapse full chunk text');

        let headingHtml = '';
        if (chunk.heading) {
            headingHtml = `<span class="chunk-section-badge" title="Section: ${escapeHTML(chunk.heading)}"><i class="fa-solid fa-bookmark"></i> ${escapeHTML(chunk.heading)}</span>`;
        } else if (chunk.title) {
            headingHtml = `<span class="chunk-section-badge" title="Title: ${escapeHTML(chunk.title)}"><i class="fa-solid fa-bookmark"></i> ${escapeHTML(chunk.title)}</span>`;
        } else if (chunk.topic) {
            headingHtml = `<span class="chunk-section-badge" title="Topic: ${escapeHTML(chunk.topic)}"><i class="fa-solid fa-tags"></i> Topic: ${escapeHTML(chunk.topic)}</span>`;
        }

        // Relevance score badge for query-aware strategy
        let scoreBadgeHtml = '';
        if (chunk.score !== undefined && chunk.score !== null) {
            const scoreVal = parseFloat(chunk.score);
            let scoreClass = 'low';
            if (scoreVal >= 0.5) scoreClass = 'high';
            else if (scoreVal >= 0.25) scoreClass = 'medium';
            scoreBadgeHtml = `<span class="relevance-score ${scoreClass}" title="Relevance: ${scoreVal}"><i class="fa-solid fa-bullseye"></i> ${scoreVal.toFixed(4)}</span>`;
        }

        // Metadata badges for metadata strategy
        let metaBadgesHtml = '';
        if (chunk.metadata) {
            for (const [key, val] of Object.entries(chunk.metadata)) {
                if (key.toLowerCase() === 'section') continue;
                let shortKey = key.substring(0, 4);
                if (key.toLowerCase() === 'department') shortKey = 'Dept';
                else if (key.toLowerCase() === 'author') shortKey = 'Auth';
                else if (key.toLowerCase() === 'version') shortKey = 'Ver';
                metaBadgesHtml += `<span class="chunk-meta-badge" title="${escapeHTML(key)}: ${escapeHTML(val)}"><i class="fa-solid fa-tag"></i> ${escapeHTML(shortKey)}: ${escapeHTML(val)}</span>`;
            }
        }
        if (strategy === 'llm') {
            if (chunk.topic) {
                metaBadgesHtml += `<span class="chunk-meta-badge" title="Topic: ${escapeHTML(chunk.topic)}"><i class="fa-solid fa-tags"></i> Topic: ${escapeHTML(chunk.topic)}</span>`;
            }
            const isSimulated = data && data.simulated;
            if (isSimulated) {
                metaBadgesHtml += `<span class="chunk-meta-badge" style="background: rgba(249, 115, 22, 0.12); border-color: rgba(249, 115, 22, 0.3); color: var(--accent-orange);" title="Local fallback simulation model"><i class="fa-solid fa-microchip"></i> Simulated LLM</span>`;
            } else {
                const modelSelectEl = document.getElementById('param-llm-model');
                const modelName = modelSelectEl ? modelSelectEl.value : 'llama3-8b-8192';
                metaBadgesHtml += `<span class="chunk-meta-badge" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3); color: var(--success);" title="Processed via Live Groq API"><i class="fa-solid fa-bolt"></i> Live LLM: ${escapeHTML(modelName)}</span>`;
            }
        }

        let prependedHtml = '';
        if (chunk.prepended_text && chunk.text !== chunk.prepended_text) {
            const headerLen = chunk.prepended_text.length - chunk.text.length;
            const headerText = chunk.prepended_text.substring(0, headerLen);
            prependedHtml = `<div class="chunk-prepended-context"><strong>Context Prepend:</strong> ${escapeHTML(headerText)}</div>`;
        }

        let validationPanelHtml = '';
        if (strategy === 'metadata' && chunk.boundary_reason) {
            const reason = chunk.boundary_reason;
            const isSubsplit = reason.type.includes('Subsplit');
            const titleClass = isSubsplit ? 'subsplit' : 'boundary';
            const panelClass = isSubsplit ? 'size-subsplit' : '';
            const icon = isSubsplit ? 'fa-scissors' : 'fa-circle-check';
            validationPanelHtml = `
                <div class="boundary-validation-panel ${panelClass}" style="display: none;">
                    <div class="boundary-validation-title ${titleClass}">
                        <i class="fa-solid ${icon}"></i> ${escapeHTML(reason.type)} (${escapeHTML(reason.confidence)})
                    </div>
                    <div class="boundary-validation-desc">
                        ${escapeHTML(reason.description)} <br/>
                        <span style="font-size: 10px; color: var(--text-disabled)">Source: ${escapeHTML(reason.source)}</span>
                    </div>
                </div>
            `;
        } else if (strategy === 'llm' && chunk.reason) {
            validationPanelHtml = `
                <div class="llm-reason-panel" style="display: none;">
                    <div class="llm-reason-title">
                        <i class="fa-solid fa-lightbulb"></i> Boundary Decision Reason
                    </div>
                    <div class="llm-reason-desc">
                        ${escapeHTML(chunk.reason)}
                    </div>
                </div>
            `;
        }

        let fixedInfoHtml = '';
        let recursiveInfoHtml = '';
        let docInfoHtml = '';
        let warningsHtml = '';
        let overlapHtml = '';
        let statsHtml = '';

        if (strategy === 'fixed') {
            // Boundaries & character ranges
            fixedInfoHtml = `
                <div class="fixed-boundary-info">
                    <div class="range-text"><i class="fa-solid fa-arrows-left-right"></i> Characters ${chunk.start_char}-${chunk.end_char}</div>
                    <div class="boundary-details">
                        <span><strong>Start:</strong> ${chunk.start_char}</span>
                        <span><strong>End:</strong> ${chunk.end_char}</span>
                        <span><strong>Overlap:</strong> ${chunk.overlap_size} chars</span>
                    </div>
                </div>
            `;

            // Sentence & word breaks
            if (chunk.word_broken || chunk.sentence_broken) {
                warningsHtml = `
                    <div class="boundary-warnings-container">
                        ${chunk.word_broken ? `<span class="boundary-warn-tag word-broken"><i class="fa-solid fa-triangle-exclamation"></i> Word Boundary Broken</span>` : ''}
                        ${chunk.sentence_broken ? `<span class="boundary-warn-tag sentence-broken"><i class="fa-solid fa-triangle-exclamation"></i> Sentence Boundary Broken</span>` : ''}
                    </div>
                `;
            }

            // Overlap visual highlight
            if (chunk.overlap_text) {
                overlapHtml = `
                    <div class="chunk-overlap-visual">
                        <div class="overlap-header">
                            <span class="overlap-tag"><i class="fa-solid fa-clone"></i> Overlap Region</span>
                        </div>
                        <div class="overlap-content-box">
                            <div class="overlap-marker start">OVERLAP START</div>
                            <div class="overlap-highlighted-text">${escapeHTML(chunk.overlap_text)}</div>
                            <div class="overlap-marker end">OVERLAP END</div>
                        </div>
                    </div>
                `;
            }

            // Chunk statistics
            if (chunk.stats) {
                statsHtml = `
                    <div class="chunk-stats-bar">
                        <span class="chunk-stat-item" title="Characters"><i class="fa-solid fa-font"></i> ${chunk.stats.chars} ch</span>
                        <span class="chunk-stat-item" title="Words"><i class="fa-solid fa-comment-dots"></i> ${chunk.stats.words} w</span>
                        <span class="chunk-stat-item" title="Sentences"><i class="fa-solid fa-paragraph"></i> ${chunk.stats.sentences} sent</span>
                        <span class="chunk-stat-item" title="Paragraphs"><i class="fa-solid fa-align-left"></i> ${chunk.stats.paragraphs} para</span>
                        <span class="chunk-stat-item" title="Estimated Tokens"><i class="fa-solid fa-microchip"></i> ${chunk.stats.tokens} tok</span>
                    </div>
                `;
            }
        } else if (strategy === 'recursive') {
            // Quality level class
            const qualityClass = (chunk.quality || 'Good').toLowerCase();
            const qualityBadge = `<span class="quality-badge ${qualityClass}" title="${escapeHTML(chunk.quality_reason || '')}"><i class="fa-solid fa-star"></i> ${chunk.quality} Split</span>`;

            // Build decision steps
            const dp = chunk.decision_path || { paragraph: "Skipped", line: "Skipped", word: "Skipped", character: "Skipped" };
            const getStepClass = (status) => status === 'Success' ? 'success' : status === 'Failed' ? 'failed' : 'skipped';
            const getStepIcon = (status) => status === 'Success' ? 'fa-circle-check' : status === 'Failed' ? 'fa-circle-xmark' : 'fa-circle-minus';

            const dpHtml = `
                <div class="decision-path-flow">
                    <span class="decision-step ${getStepClass(dp.paragraph)}" title="Paragraph Split: ${dp.paragraph}"><i class="fa-solid ${getStepIcon(dp.paragraph)}"></i> Para</span>
                    <span class="decision-arrow"><i class="fa-solid fa-chevron-right"></i></span>
                    <span class="decision-step ${getStepClass(dp.line)}" title="Line Split: ${dp.line}"><i class="fa-solid ${getStepIcon(dp.line)}"></i> Line</span>
                    <span class="decision-arrow"><i class="fa-solid fa-chevron-right"></i></span>
                    <span class="decision-step ${getStepClass(dp.word)}" title="Word Split: ${dp.word}"><i class="fa-solid ${getStepIcon(dp.word)}"></i> Word</span>
                    <span class="decision-arrow"><i class="fa-solid fa-chevron-right"></i></span>
                    <span class="decision-step ${getStepClass(dp.character)}" title="Character Split: ${dp.character}"><i class="fa-solid ${getStepIcon(dp.character)}"></i> Char</span>
                </div>
            `;

            // Breadcrumb Origin Path
            const breadcrumbHtml = `
                <div class="origin-breadcrumb" style="display: none;">
                    <i class="fa-solid fa-folder-tree"></i>
                    <span class="breadcrumb-item">Document</span>
                    <i class="fa-solid fa-chevron-right"></i>
                    <span class="breadcrumb-item">Paragraph #${chunk.paragraph_index || 1}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                    <span class="breadcrumb-item">Line #${chunk.line_index || 1}</span>
                    <i class="fa-solid fa-chevron-right"></i>
                    <span class="breadcrumb-item" style="color: var(--secondary)">Chunk #${chunk.index}</span>
                </div>
            `;

            recursiveInfoHtml = `
                <div class="fixed-boundary-info" style="border-left-color: var(--secondary); display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="range-text"><i class="fa-solid fa-arrows-split-up-and-left"></i> Split Separator Used: <code>${escapeHTML(chunk.separator)}</code></div>
                        ${qualityBadge}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">
                        <strong>Split Reason:</strong> ${escapeHTML(chunk.reason)} (Level: <strong>${escapeHTML(chunk.split_level)}</strong>)
                    </div>
                    ${dpHtml}
                    ${breadcrumbHtml}
                </div>
            `;

            // Sentence & word breaks warnings
            if (chunk.word_broken || chunk.sentence_broken) {
                warningsHtml = `
                    <div class="boundary-warnings-container">
                        ${chunk.word_broken ? `<span class="boundary-warn-tag word-broken"><i class="fa-solid fa-triangle-exclamation"></i> Word Boundary Broken</span>` : ''}
                        ${chunk.sentence_broken ? `<span class="boundary-warn-tag sentence-broken"><i class="fa-solid fa-triangle-exclamation"></i> Sentence Boundary Broken</span>` : ''}
                    </div>
                `;
            }

            // Chunk statistics
            if (chunk.stats) {
                statsHtml = `
                    <div class="chunk-stats-bar">
                        <span class="chunk-stat-item" title="Characters"><i class="fa-solid fa-font"></i> ${chunk.stats.chars} ch</span>
                        <span class="chunk-stat-item" title="Words"><i class="fa-solid fa-comment-dots"></i> ${chunk.stats.words} w</span>
                        <span class="chunk-stat-item" title="Sentences"><i class="fa-solid fa-paragraph"></i> ${chunk.stats.sentences} sent</span>
                        <span class="chunk-stat-item" title="Paragraphs"><i class="fa-solid fa-align-left"></i> ${chunk.stats.paragraphs} para</span>
                        <span class="chunk-stat-item" title="Estimated Tokens"><i class="fa-solid fa-microchip"></i> ${chunk.stats.tokens} tok</span>
                    </div>
                `;
            }
        } else if (strategy === 'document') {
            const meta = chunk.metadata || {};
            docInfoHtml = `
                <div class="fixed-boundary-info" style="border-left-color: var(--primary); display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="range-text"><i class="fa-solid fa-sitemap"></i> Document Structure Location</div>
                        <span class="quality-badge good" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); color: var(--primary);" title="Hierarchy level"><i class="fa-solid fa-hashtag"></i> Level ${escapeHTML(meta.level || 'H1')}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                        <span><strong>Source Section:</strong> ${escapeHTML(meta.section_name || 'N/A')}</span>
                        <span><strong>Parent Section:</strong> ${escapeHTML(meta.parent || 'Document')}</span>
                        <span><strong>Heading Name:</strong> ${escapeHTML(chunk.heading || meta.section_name || 'N/A')}</span>
                        <span><strong>Section Order:</strong> #${meta.order || chunk.index}</span>
                    </div>
                </div>
            `;

            // Chunk statistics
            if (chunk.stats) {
                statsHtml = `
                    <div class="chunk-stats-bar">
                        <span class="chunk-stat-item" title="Characters"><i class="fa-solid fa-font"></i> ${chunk.stats.chars} ch</span>
                        <span class="chunk-stat-item" title="Words"><i class="fa-solid fa-comment-dots"></i> ${chunk.stats.words} w</span>
                        <span class="chunk-stat-item" title="Sentences"><i class="fa-solid fa-paragraph"></i> ${chunk.stats.sentences} sent</span>
                        <span class="chunk-stat-item" title="Paragraphs"><i class="fa-solid fa-align-left"></i> ${chunk.stats.paragraphs} para</span>
                        <span class="chunk-stat-item" title="Estimated Tokens"><i class="fa-solid fa-microchip"></i> ${chunk.stats.tokens} tok</span>
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <div class="chunk-card-header">
                <span class="chunk-number">Chunk #${chunk.index}</span>
                ${headingHtml}
                ${scoreBadgeHtml}
                ${metaBadgesHtml}
                <span class="chunk-size-badge">${chunk.length} chars</span>
            </div>
            ${fixedInfoHtml}
            ${recursiveInfoHtml}
            ${docInfoHtml}
            ${warningsHtml}
            ${overlapHtml}
            ${prependedHtml}
            <div class="chunk-card-body">${escapeHTML(chunk.text)}</div>
            ${statsHtml}
            ${validationPanelHtml}
        `;

        card.addEventListener('click', () => {
            card.classList.toggle('expanded');
            if (strategy === 'metadata') {
                const valPanel = card.querySelector('.boundary-validation-panel');
                if (valPanel) {
                    valPanel.style.display = card.classList.contains('expanded') ? 'block' : 'none';
                }
            } else if (strategy === 'llm') {
                const reasonPanel = card.querySelector('.llm-reason-panel');
                if (reasonPanel) {
                    reasonPanel.style.display = card.classList.contains('expanded') ? 'block' : 'none';
                }
            } else if (strategy === 'recursive') {
                const breadcrumb = card.querySelector('.origin-breadcrumb');
                if (breadcrumb) {
                    breadcrumb.style.display = card.classList.contains('expanded') ? 'inline-flex' : 'none';
                }
            }
        });
        chunksOutputGrid.appendChild(card);
    });

    currentLoadedChunksCount += nextBatch.length;

    // Display Load More button if there are remaining chunks
    if (currentLoadedChunksCount < activeChunksArray.length) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';

        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.id = 'btn-load-more';
        loadMoreBtn.innerHTML = `<i class="fa-solid fa-arrow-down-long"></i> Load More Chunks (${currentLoadedChunksCount} of ${activeChunksArray.length} shown)`;

        loadMoreBtn.addEventListener('click', () => {
            renderNextChunkBatch(data);
        });

        loadMoreContainer.appendChild(loadMoreBtn);
        chunksOutputGrid.appendChild(loadMoreContainer);
    }
}

// Local simulation fallback for other strategies (Phase 0 legacy preview)
function simulateChunking() {
    const text = docPreviewText.innerText.trim();
    if (!text) {
        alert("Please enter or select some text to chunk.");
        return;
    }

    const startTime = performance.now();
    const strategy = strategySelect.value;
    const chunkSize = parseInt(paramChunkSize.value, 10);
    const overlap = parseInt(paramOverlap.value, 10);

    let chunks = [];

    if (strategy === 'fixed') {
        let index = 0;
        while (index < text.length) {
            let end = index + chunkSize;
            let chunkText = text.substring(index, end);
            chunks.push(chunkText);

            let step = chunkSize - overlap;
            if (step <= 0) step = 1;
            index += step;
            if (end >= text.length) break;
        }
    } else {
        const rawParagraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        chunks = rawParagraphs;
    }

    const endTime = performance.now();
    const duration = parseFloat((endTime - startTime).toFixed(1));

    const avgSize = chunks.length > 0
        ? Math.round(chunks.reduce((acc, curr) => acc + curr.length, 0) / chunks.length)
        : 0;

    const formattedChunks = chunks.map((chunk, index) => ({
        index: index + 1,
        text: chunk,
        length: chunk.length
    }));

    const data = {
        chunks: formattedChunks,
        metrics: {
            total_chunks: chunks.length,
            avg_size: avgSize,
            processing_time_ms: duration
        }
    };

    renderChunkResults(data, strategy);
}

// Update active states of toggle buttons
function updateViewToggles() {
    // Reset button active classes
    toggleViewBtn.classList.remove('active');
    toggleTreeBtn.classList.remove('active');

    if (activeView === 'tree') {
        toggleTreeBtn.classList.add('active');
        toggleViewBtn.innerHTML = isGridView ? '<i class="fa-solid fa-list"></i> List View' : '<i class="fa-solid fa-grip"></i> Grid View';
    } else {
        toggleViewBtn.classList.add('active');
        if (isGridView) {
            toggleViewBtn.innerHTML = '<i class="fa-solid fa-list"></i> List View';
        } else {
            toggleViewBtn.innerHTML = '<i class="fa-solid fa-grip"></i> Grid View';
        }
    }
}

// Render the collapsible hierarchy tree view
function renderTreeView(data) {
    chunksOutputGrid.innerHTML = '';
    chunksOutputGrid.className = 'chunks-tree-container';

    if (!data.hierarchy || data.hierarchy.length === 0) {
        chunksOutputGrid.innerHTML = '<div class="empty-output-state"><h3>No Hierarchy Available</h3></div>';
        return;
    }

    // Document Root Node
    const rootNode = document.createElement('div');
    rootNode.className = 'tree-node root-node';
    rootNode.innerHTML = `
        <div class="tree-node-title">
            <i class="fa-solid fa-file-lines"></i>
            <span>Document (${data.chunks.length} chunks)</span>
        </div>
    `;

    const rootChildren = document.createElement('div');
    rootChildren.className = 'tree-children';
    rootNode.appendChild(rootChildren);

    // Make root collapsible
    const rootTitle = rootNode.querySelector('.tree-node-title');
    rootTitle.style.cursor = 'pointer';
    const rootCaret = document.createElement('i');
    rootCaret.className = 'fa-solid fa-chevron-down';
    rootCaret.style.marginLeft = 'auto';
    rootCaret.style.fontSize = '10px';
    rootCaret.style.color = 'var(--text-muted)';
    rootTitle.appendChild(rootCaret);

    rootTitle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = rootChildren.style.display === 'none';
        rootChildren.style.display = isCollapsed ? 'flex' : 'none';
        rootCaret.className = isCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
    });

    data.hierarchy.forEach((para) => {
        // Paragraph node
        const paraNode = document.createElement('div');
        paraNode.className = 'tree-node para-node';
        paraNode.innerHTML = `
            <div class="tree-node-title" title="${escapeHTML(para.text)}">
                <i class="fa-solid fa-paragraph"></i>
                <span>Paragraph #${para.paragraph_index}: ${escapeHTML(para.text)}</span>
            </div>
        `;

        const paraChildren = document.createElement('div');
        paraChildren.className = 'tree-children';
        paraNode.appendChild(paraChildren);

        // Make paragraph collapsible
        const paraTitle = paraNode.querySelector('.tree-node-title');
        paraTitle.style.cursor = 'pointer';
        const paraCaret = document.createElement('i');
        paraCaret.className = 'fa-solid fa-chevron-down';
        paraCaret.style.marginLeft = 'auto';
        paraCaret.style.fontSize = '10px';
        paraCaret.style.color = 'var(--text-muted)';
        paraTitle.appendChild(paraCaret);

        paraTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCollapsed = paraChildren.style.display === 'none';
            paraChildren.style.display = isCollapsed ? 'flex' : 'none';
            paraCaret.className = isCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right';
        });

        para.chunk_indices.forEach((chunkIdx) => {
            const chunk = data.chunks.find(c => c.index === chunkIdx);
            if (chunk) {
                const leafNode = document.createElement('div');
                leafNode.className = 'tree-node leaf-node';
                leafNode.setAttribute('data-chunk-index', chunk.index);

                let previewText = chunk.text.trim().replace(/\n/g, ' ');
                if (previewText.length > 50) {
                    previewText = previewText.substring(0, 50) + '...';
                }

                leafNode.innerHTML = `
                    <i class="fa-solid fa-puzzle-piece"></i>
                    <span>Chunk #${chunk.index} (${chunk.length} chars): "${escapeHTML(previewText)}"</span>
                `;

                // Clicking a chunk leaf node switches view and scrolls/highlights the card
                leafNode.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activeView = isGridView ? 'grid' : 'list';
                    updateViewToggles();
                    renderChunkResults(data, 'recursive');

                    setTimeout(() => {
                        const targetCard = document.getElementById(`chunk-card-${chunk.index}`);
                        if (targetCard) {
                            targetCard.classList.add('expanded');
                            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // Visual feedback flash
                            targetCard.style.borderColor = 'var(--secondary)';
                            targetCard.style.boxShadow = '0 0 15px var(--secondary-glow)';
                            setTimeout(() => {
                                targetCard.style.boxShadow = '';
                                if (!targetCard.classList.contains('expanded')) {
                                    targetCard.style.borderColor = '';
                                }
                            }, 1500);
                        }
                    }, 50);
                });

                paraChildren.appendChild(leafNode);
            }
        });

        rootChildren.appendChild(paraNode);
    });

    chunksOutputGrid.appendChild(rootNode);
}

// Strategy Name translation helper
function getStrategyLabel(strat) {
    const labels = {
        'fixed': 'Fixed-Size Character Chunking',
        'recursive': 'Recursive Character Chunking',
        'document': 'Document-Structure Aware',
        'semantic': 'Semantic Similarity',
        'query': 'Query-Aware (Retrieval-Optimized)',
        'metadata': 'Metadata-Enhanced',
        'llm': 'LLM-Based Intelligent',
        'agentic': 'Agentic Workflow (LangGraph)'
    };
    return labels[strat] || strat;
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const s = typeof str === 'string' ? str : String(str);
    return s.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Tab Switching Utility
function switchTab(tabName) {
    const teachingCard = document.querySelector('.card.teaching-card');
    if (tabName === 'analysis') {
        if (tabAnalysis) tabAnalysis.classList.add('active');
        if (tabStats) tabStats.classList.remove('active');
        if (analysisTabContent) analysisTabContent.classList.remove('hidden');
        if (statsTabContent) statsTabContent.classList.add('hidden');
        if (teachingCard) teachingCard.style.display = 'none';
    } else {
        if (tabAnalysis) tabAnalysis.classList.remove('active');
        if (tabStats) tabStats.classList.add('active');
        if (analysisTabContent) analysisTabContent.classList.add('hidden');
        if (statsTabContent) statsTabContent.classList.remove('hidden');
        if (teachingCard) teachingCard.style.display = 'block';
    }
}

// Document Analysis Endpoint Fetcher
async function analyzeDocument(text) {
    if (!text || text.trim().length === 0) {
        const panel = document.getElementById('structure-analysis-panel');
        if (panel) panel.style.display = 'none';
        return;
    }

    // Set UI loading state
    if (analysisDocType) analysisDocType.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    if (analysisAvgSentenceLen) analysisAvgSentenceLen.innerHTML = '---';
    if (analysisLongestPara) analysisLongestPara.innerHTML = '---';
    if (analysisContextPct) analysisContextPct.innerText = '0%';
    if (analysisContextBar) analysisContextBar.style.width = '0%';

    try {
        const response = await fetch(`${BACKEND_URL}/document/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed with status ${response.status}`);
        }

        const data = await response.json();

        // Populate UI elements
        if (analysisDocType) analysisDocType.innerText = data.document_type;
        if (analysisAvgSentenceLen) analysisAvgSentenceLen.innerHTML = `${data.avg_sentence_length} <span class="analysis-unit">words</span>`;
        if (analysisLongestPara) analysisLongestPara.innerHTML = `${data.longest_paragraph_words} <span class="analysis-unit">words</span>`;
        if (analysisContextPct) analysisContextPct.innerText = `${data.context_usage_pct}%`;
        if (analysisContextBar) analysisContextBar.style.width = `${data.context_usage_pct}%`;

        // Sync preview type badge
        const docBadge = document.getElementById('doc-type-badge');
        if (docBadge) {
            docBadge.textContent = data.document_type;
        }

        // Update Structure Analysis Panel
        const panel = document.getElementById('structure-analysis-panel');
        if (panel) {
            panel.style.display = 'block';

            const structAnalysis = data.structure_analysis;
            if (structAnalysis) {
                // 1. Source Type Badge
                const webSourceTypeEl = document.getElementById('web-analysis-source-type');
                const sourceType = docBadge ? docBadge.textContent : "Text Document";
                if (webSourceTypeEl) {
                    webSourceTypeEl.textContent = sourceType;
                }

                // 2. Confidence Badge
                const confidenceBadge = document.getElementById('structure-confidence-badge');
                if (confidenceBadge) {
                    const pct = structAnalysis.confidence_pct;
                    confidenceBadge.textContent = `${pct}%`;
                    if (pct >= 75) {
                        confidenceBadge.style.color = 'var(--success)';
                        confidenceBadge.style.background = 'rgba(16, 185, 129, 0.1)';
                    } else if (pct >= 30) {
                        confidenceBadge.style.color = 'var(--warning)';
                        confidenceBadge.style.background = 'rgba(245, 158, 11, 0.1)';
                    } else {
                        confidenceBadge.style.color = 'var(--danger)';
                        confidenceBadge.style.background = 'rgba(239, 68, 68, 0.1)';
                    }
                }

                // 3. No Structure Alert
                const noStructureAlert = document.getElementById('no-structure-alert');
                if (noStructureAlert) {
                    noStructureAlert.style.display = (structAnalysis.confidence_pct === 0) ? 'block' : 'none';
                }

                // 4. Checklist Items
                const present = structAnalysis.structure_present || {};
                const checks = {
                    'title': present.title_found,
                    'sections': present.main_sections_found,
                    'subsections': present.subsections_found,
                    'lists': present.lists_found,
                    'tables': present.tables_found
                };
                for (const [key, isPresent] of Object.entries(checks)) {
                    const li = document.getElementById(`check-${key}`);
                    if (li) {
                        const icon = li.querySelector('i');
                        if (icon) {
                            if (isPresent) {
                                icon.className = 'fa-solid fa-circle-check text-success';
                                li.classList.add('detected');
                            } else {
                                icon.className = 'fa-solid fa-circle-xmark text-danger';
                                li.classList.remove('detected');
                            }
                        }
                    }
                }

                // 5. Heuristics Text
                const reasonText = document.getElementById('structure-reason-text');
                if (reasonText) {
                    reasonText.textContent = structAnalysis.reason;
                }

                // 6. Recommendation Badge & Reason
                const recBadge = document.getElementById('structure-recommendation-badge');
                const recReason = document.getElementById('structure-recommendation-reason');
                if (recBadge && recReason) {
                    if (structAnalysis.recommended_strategy === 'document') {
                        recBadge.textContent = "Document-Structure Aware";
                        recReason.textContent = "High structure detected. Splitting by logical document structures (headings, tables, lists) is recommended to keep topics whole.";
                    } else {
                        recBadge.textContent = "Recursive Character";
                        recReason.textContent = "Low structure detected. Using recursive character splitting is recommended to fall back on paragraphs and sentences.";
                    }
                }

                // 7. Educational Flowchart Nodes
                const nodeSource = document.getElementById('flow-node-source');
                const nodeDetection = document.getElementById('flow-node-detection');
                const nodeRec = document.getElementById('flow-node-rec');
                const nodeGen = document.getElementById('flow-node-generation');

                if (nodeSource) {
                    nodeSource.textContent = `Source: ${sourceType}`;
                    nodeSource.className = 'flowchart-node completed';
                }
                if (nodeDetection) {
                    nodeDetection.textContent = `Score: ${structAnalysis.score}/90 (${structAnalysis.confidence_pct}%)`;
                    nodeDetection.className = 'flowchart-node completed';
                }
                if (nodeRec) {
                    nodeRec.textContent = `Recommend: ${structAnalysis.recommended_strategy === 'document' ? 'Doc Structure' : 'Recursive'}`;
                    nodeRec.className = 'flowchart-node recommended-active';
                }
                if (nodeGen) {
                    nodeGen.textContent = 'Ready for Generation';
                    nodeGen.className = 'flowchart-node active';
                }
            }
        }

        // Show analysis tab automatically
        switchTab('analysis');

    } catch (error) {
        console.error("Error analyzing document:", error);
        if (analysisDocType) analysisDocType.innerText = "Error";
    }
}

// Toggle parameter input panel based on strategy selection
function updateParameterVisibility(strategy) {
    const paramsPanel = document.getElementById('parameters-panel');
    if (!paramsPanel) return;

    const labelSize = document.querySelector('label[for="param-chunk-size"]');
    const groupOverlap = paramOverlap.closest('.parameter-group');
    const queryGroup = document.getElementById('param-query-group');
    const metadataGroup = document.getElementById('param-metadata-group');
    const llmGroup = document.getElementById('param-llm-group');

    // Hide query group by default
    if (queryGroup) queryGroup.style.display = 'none';
    if (metadataGroup) metadataGroup.style.display = 'none';
    if (llmGroup) llmGroup.style.display = 'none';

    if (strategy === 'document' || strategy === 'agentic') {
        paramsPanel.style.display = 'none';
    } else if (strategy === 'semantic') {
        paramsPanel.style.display = 'block';
        if (groupOverlap) groupOverlap.style.display = 'none';

        if (labelSize) labelSize.textContent = "Similarity Threshold";
        paramChunkSize.min = "0.1";
        paramChunkSize.max = "0.9";
        paramChunkSize.step = "0.05";

        const currentVal = parseFloat(paramChunkSize.value);
        if (isNaN(currentVal) || currentVal < 0.1 || currentVal > 0.9) {
            paramChunkSize.value = "0.6";
            valChunkSize.textContent = "0.6";
        } else {
            valChunkSize.textContent = paramChunkSize.value;
        }
    } else if (strategy === 'query') {
        paramsPanel.style.display = 'block';
        if (groupOverlap) groupOverlap.style.display = 'block';
        if (queryGroup) queryGroup.style.display = 'block';

        if (labelSize) labelSize.textContent = "Chunk Size (chars)";
        paramChunkSize.min = "100";
        paramChunkSize.max = "3000";
        paramChunkSize.step = "50";

        const currentVal = parseFloat(paramChunkSize.value);
        if (isNaN(currentVal) || currentVal < 100 || currentVal > 3000) {
            paramChunkSize.value = "500";
            valChunkSize.textContent = "500";
        } else {
            valChunkSize.textContent = paramChunkSize.value;
        }
    } else if (strategy === 'metadata') {
        paramsPanel.style.display = 'block';
        if (groupOverlap) groupOverlap.style.display = 'block';
        if (metadataGroup) metadataGroup.style.display = 'block';

        if (labelSize) labelSize.textContent = "Chunk Size (chars)";
        paramChunkSize.min = "100";
        paramChunkSize.max = "3000";
        paramChunkSize.step = "50";

        const currentVal = parseFloat(paramChunkSize.value);
        if (isNaN(currentVal) || currentVal < 100 || currentVal > 3000) {
            paramChunkSize.value = "500";
            valChunkSize.textContent = "500";
        } else {
            valChunkSize.textContent = paramChunkSize.value;
        }
    } else if (strategy === 'llm') {
        paramsPanel.style.display = 'block';
        if (groupOverlap) groupOverlap.style.display = 'none';
        if (llmGroup) llmGroup.style.display = 'block';

        if (labelSize) labelSize.textContent = "Target Chunk Size (chars)";
        paramChunkSize.min = "100";
        paramChunkSize.max = "3000";
        paramChunkSize.step = "50";

        const currentVal = parseFloat(paramChunkSize.value);
        if (isNaN(currentVal) || currentVal < 100 || currentVal > 3000) {
            paramChunkSize.value = "500";
            valChunkSize.textContent = "500";
        } else {
            valChunkSize.textContent = paramChunkSize.value;
        }
    } else {
        paramsPanel.style.display = 'block';
        if (groupOverlap) groupOverlap.style.display = 'block';

        if (labelSize) labelSize.textContent = "Chunk Size (chars)";
        paramChunkSize.min = "100";
        paramChunkSize.max = "3000";
        paramChunkSize.step = "50";

        const currentVal = parseFloat(paramChunkSize.value);
        if (isNaN(currentVal) || currentVal < 100 || currentVal > 3000) {
            paramChunkSize.value = "500";
            valChunkSize.textContent = "500";
        } else {
            valChunkSize.textContent = paramChunkSize.value;
        }
    }
}

// Client-side filtering logic for Metadata-Aware Chunks
function setupMetadataFilters(data) {
    const searchInput = document.getElementById('meta-filter-search');
    const deptSelect = document.getElementById('meta-filter-dept');
    const clearBtn = document.getElementById('meta-filter-clear');

    if (!searchInput || !deptSelect || !clearBtn) return;

    // Populate departments select dynamically based on generated chunks
    const depts = new Set();
    data.chunks.forEach(c => {
        if (c.metadata && c.metadata.department) {
            depts.add(c.metadata.department);
        }
    });

    const prevSelectVal = deptSelect.value;
    deptSelect.innerHTML = '<option value="all">All Departments</option>';
    depts.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        deptSelect.appendChild(option);
    });

    if (depts.has(prevSelectVal)) {
        deptSelect.value = prevSelectVal;
    }

    const applyFilters = () => {
        const query = searchInput.value.toLowerCase().trim();
        const selectedDept = deptSelect.value;

        data.chunks.forEach(chunk => {
            const card = document.getElementById(`chunk-card-${chunk.index}`);
            if (!card) return;

            // Check department
            let matchesDept = true;
            if (selectedDept !== 'all') {
                matchesDept = chunk.metadata && chunk.metadata.department === selectedDept;
            }

            // Check text/metadata query
            let matchesQuery = true;
            if (query) {
                const textMatch = chunk.text.toLowerCase().includes(query);
                const prependedMatch = chunk.prepended_text && chunk.prepended_text.toLowerCase().includes(query);

                let metaMatch = false;
                if (chunk.metadata) {
                    for (const [k, v] of Object.entries(chunk.metadata)) {
                        if (k.toLowerCase().includes(query) || v.toLowerCase().includes(query)) {
                            metaMatch = true;
                            break;
                        }
                    }
                }
                matchesQuery = textMatch || prependedMatch || metaMatch;
            }

            if (matchesDept && matchesQuery) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    };

    // Bind change listeners
    searchInput.removeEventListener('input', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    deptSelect.removeEventListener('change', applyFilters);
    deptSelect.addEventListener('change', applyFilters);

    clearBtn.onclick = () => {
        searchInput.value = '';
        deptSelect.value = 'all';
        applyFilters();
    };
}

// Phase 9: Metadata-Aware view panels switcher and renderers
function switchMetadataView(view) {
    const grid = document.getElementById('chunks-output-grid');
    const filterBar = document.getElementById('metadata-filter-bar');
    const timelinePanel = document.getElementById('meta-timeline-panel');
    const comparisonPanel = document.getElementById('meta-comparison-panel');
    const simulatorPanel = document.getElementById('meta-simulator-panel');

    // Hide all
    if (grid) grid.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
    if (timelinePanel) timelinePanel.style.display = 'none';
    if (comparisonPanel) comparisonPanel.style.display = 'none';
    if (simulatorPanel) simulatorPanel.style.display = 'none';

    // Show active
    if (view === 'cards') {
        if (grid) {
            grid.style.display = '';
            grid.className = isGridView ? 'chunks-container grid-layout' : 'chunks-container list-layout';
        }
        if (filterBar) filterBar.style.display = 'flex';
    } else if (view === 'timeline') {
        if (timelinePanel) {
            timelinePanel.style.display = 'block';
            if (currentChunkData && currentChunkData.timeline) {
                renderMetadataTimeline(currentChunkData.timeline);
            }
        }
    } else if (view === 'comparison') {
        if (comparisonPanel) {
            comparisonPanel.style.display = 'block';
            if (currentChunkData && currentChunkData.comparison) {
                renderMetadataComparison(currentChunkData.comparison);
            }
        }
    } else if (view === 'simulator') {
        if (simulatorPanel) {
            simulatorPanel.style.display = 'block';
            const simResultsContainer = document.getElementById('sim-results-container');
            if (simResultsContainer && (!simResultsContainer.children.length || simResultsContainer.querySelector('.empty-output-state'))) {
                simResultsContainer.innerHTML = `
                    <div class="empty-output-state">
                        <i class="fa-solid fa-magnifying-glass-chart empty-icon animate-pulse"></i>
                        <h3>No Simulation Query Sent Yet</h3>
                        <p>Type a question above and click Retrieve to simulate how metadata tags influence retrieval in vector search databases.</p>
                    </div>
                `;
            }
        }
    }
}

function renderMetadataTimeline(timeline) {
    const flowContainer = document.getElementById('meta-timeline-flow');
    if (!flowContainer) return;
    flowContainer.innerHTML = '';

    timeline.forEach(item => {
        const node = document.createElement('div');
        node.className = `timeline-node ${escapeHTML(item.type)}`;
        node.innerHTML = `
            <div class="timeline-title">${escapeHTML(item.title)}</div>
            <div class="timeline-detail">${escapeHTML(item.detail)}</div>
        `;
        flowContainer.appendChild(node);
    });
}

function renderMetadataComparison(comparison) {
    const dashboard = document.getElementById('meta-comparison-dashboard');
    if (!dashboard) return;
    dashboard.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'comparison-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Chunking Strategy</th>
                <th>Total Chunks</th>
                <th>Metadata Coverage</th>
                <th>Context Preservation</th>
                <th>Retrieval Accuracy (RAG)</th>
                <th>Educational Score</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Fixed-Size Character</strong></td>
                <td>${comparison.fixed.chunk_count}</td>
                <td><span class="metric-pill low">0% (None)</span></td>
                <td><span class="metric-pill low">${comparison.fixed.context_preservation}% (Low)</span></td>
                <td><span class="metric-pill low">${comparison.fixed.retrieval_accuracy}% (Weak)</span></td>
                <td><span class="metric-pill low">${comparison.fixed.edu_score}/100</span></td>
            </tr>
            <tr>
                <td><strong>Standard Metadata Tagging</strong></td>
                <td>${comparison.tagging.chunk_count}</td>
                <td><span class="metric-pill high">100% (Static)</span></td>
                <td><span class="metric-pill medium">${comparison.tagging.context_preservation}% (Medium)</span></td>
                <td><span class="metric-pill medium">${comparison.tagging.retrieval_accuracy}% (Moderate)</span></td>
                <td><span class="metric-pill medium">${comparison.tagging.edu_score}/100</span></td>
            </tr>
            <tr>
                <td><strong>Boundary-Aware Metadata</strong></td>
                <td><strong>${comparison.aware.chunk_count}</strong></td>
                <td><span class="metric-pill high">100% (Dynamic)</span></td>
                <td><span class="metric-pill high">${comparison.aware.context_preservation}% (High)</span></td>
                <td><span class="metric-pill high">${comparison.aware.retrieval_accuracy}% (Excellent)</span></td>
                <td><span class="metric-pill high"><strong>${comparison.aware.edu_score}/100</strong></span></td>
            </tr>
        </tbody>
    `;
    dashboard.appendChild(table);
}

async function runRetrievalSimulation() {
    const queryInput = document.getElementById('sim-query-input');
    const resultsContainer = document.getElementById('sim-results-container');

    if (!queryInput || !resultsContainer) return;

    const query = queryInput.value.trim();
    if (!query) {
        alert("Please enter a query to run the RAG simulation.");
        return;
    }

    if (!currentChunkData || !currentChunkData.chunks || currentChunkData.chunks.length === 0) {
        alert("Please generate chunks first using 'Apply Chunking'.");
        return;
    }

    resultsContainer.innerHTML = `
        <div class="empty-output-state">
            <i class="fa-solid fa-spinner fa-spin empty-icon"></i>
            <h3>Retrieving Chunks...</h3>
            <p>Running semantic similarity search and applying metadata matching boosts.</p>
        </div>
    `;

    try {
        const response = await fetch(`${BACKEND_URL}/chunk/metadata/retrieve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                chunks: currentChunkData.chunks,
                top_k: 3
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        const retrieved = data.retrieved;

        resultsContainer.innerHTML = '';

        if (retrieved.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-triangle-exclamation empty-icon animate-pulse"></i>
                    <h3>No Chunks Retrieved</h3>
                    <p>No matches were found for your query. Try adjusting your search text.</p>
                </div>
            `;
            return;
        }

        retrieved.forEach(item => {
            const chunk = item.chunk;
            const simScore = item.similarity_score;
            const boost = item.metadata_match_score;
            const confidence = item.retrieval_confidence;

            const card = document.createElement('div');
            card.className = 'chunk-visual-card';
            card.id = `sim-card-${chunk.index}`;
            card.setAttribute('title', 'Click to expand/collapse full chunk text');

            let headingHtml = '';
            if (chunk.metadata && chunk.metadata.Section) {
                headingHtml = `<span class="chunk-section-badge" title="Section: ${escapeHTML(chunk.metadata.Section)}"><i class="fa-solid fa-bookmark"></i> ${escapeHTML(chunk.metadata.Section)}</span>`;
            } else if (chunk.topic) {
                headingHtml = `<span class="chunk-section-badge" title="Topic: ${escapeHTML(chunk.topic)}"><i class="fa-solid fa-tags"></i> Topic: ${escapeHTML(chunk.topic)}</span>`;
            }

            let metaBadgesHtml = '';
            if (chunk.metadata) {
                for (const [key, val] of Object.entries(chunk.metadata)) {
                    if (key.toLowerCase() === 'section') continue;
                    let shortKey = key.substring(0, 4);
                    if (key.toLowerCase() === 'department') shortKey = 'Dept';
                    else if (key.toLowerCase() === 'author') shortKey = 'Auth';
                    else if (key.toLowerCase() === 'version') shortKey = 'Ver';
                    metaBadgesHtml += `<span class="chunk-meta-badge" title="${escapeHTML(key)}: ${escapeHTML(val)}"><i class="fa-solid fa-tag"></i> ${escapeHTML(shortKey)}: ${escapeHTML(val)}</span>`;
                }
            }

            let prependedHtml = '';
            if (chunk.prepended_text && chunk.text !== chunk.prepended_text) {
                const headerLen = chunk.prepended_text.length - chunk.text.length;
                const headerText = chunk.prepended_text.substring(0, headerLen);
                prependedHtml = `<div class="chunk-prepended-context"><strong>Context Prepend:</strong> ${escapeHTML(headerText)}</div>`;
            }

            const simBadgeHtml = `
                <div class="sim-score-badges">
                    <span class="sim-badge similarity" title="Cosine Similarity of embeddings"><i class="fa-solid fa-brain"></i> Cos Sim: ${simScore.toFixed(3)}</span>
                    <span class="sim-badge meta-boost" title="Relevance boost from matching metadata tags"><i class="fa-solid fa-rocket"></i> Meta Boost: +${boost.toFixed(2)}</span>
                    <span class="sim-badge confidence" title="Final combined retrieval confidence score"><i class="fa-solid fa-circle-check"></i> Confidence: ${(confidence * 100).toFixed(0)}%</span>
                </div>
            `;

            card.innerHTML = `
                <div class="chunk-card-header">
                    <span class="chunk-number">Chunk #${chunk.index}</span>
                    ${headingHtml}
                    ${metaBadgesHtml}
                    <span class="chunk-size-badge">${chunk.length} chars</span>
                </div>
                ${prependedHtml}
                <div class="chunk-card-body">${escapeHTML(chunk.text)}</div>
                ${simBadgeHtml}
            `;

            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            resultsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Retrieval simulation failed:", error);
        alert(`Retrieval failed: ${error.message}`);
        resultsContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-triangle-exclamation empty-icon text-warning"></i>
                <h3>Retrieval Error</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}

// Phase 11: Agentic LangGraph View switch and rendering helpers
function switchAgenticView(view) {
    const grid = document.getElementById('chunks-output-grid');
    const agenticWorkflowPanel = document.getElementById('agentic-workflow-panel');

    if (grid) grid.style.display = 'none';
    if (agenticWorkflowPanel) agenticWorkflowPanel.style.display = 'none';

    if (view === 'graph') {
        if (agenticWorkflowPanel) {
            agenticWorkflowPanel.style.display = 'block';
            if (currentChunkData) {
                renderAgenticWorkflow(currentChunkData);
            }
        }
    } else if (view === 'chunks') {
        if (grid) {
            grid.style.display = '';
            grid.className = isGridView ? 'chunks-container grid-layout' : 'chunks-container list-layout';
        }
    }
}

function renderAgenticWorkflow(data) {
    // Populate summary statistics
    const strategyEl = document.getElementById('agentic-resolved-strategy');
    const classEl = document.getElementById('agentic-doc-class');
    const confidenceEl = document.getElementById('agentic-confidence');

    const selectedStrategy = data.selected_strategy || 'recursive';

    if (strategyEl) strategyEl.textContent = selectedStrategy.toUpperCase();
    if (classEl) classEl.textContent = data.doc_type || 'General Document';

    // Confidence Score formatting and bar update
    const confidencePct = Math.round((data.confidence || 0.85) * 100);
    if (confidenceEl) confidenceEl.textContent = `${confidencePct}%`;

    const confBar = document.getElementById('agentic-confidence-bar');
    const confBadge = document.getElementById('agentic-confidence-badge');
    if (confBadge) {
        confBadge.className = 'confidence-badge';
        if (confidencePct >= 90) {
            confBadge.textContent = 'High Confidence';
            confBadge.classList.add('high');
            if (confBar) confBar.style.backgroundColor = 'var(--success)';
        } else if (confidencePct >= 70) {
            confBadge.textContent = 'Medium Confidence';
            confBadge.classList.add('medium');
            if (confBar) confBar.style.backgroundColor = 'var(--accent-orange)';
        } else {
            confBadge.textContent = 'Low Confidence';
            confBadge.classList.add('low');
            if (confBar) confBar.style.backgroundColor = 'var(--danger)';
        }
    }
    if (confBar) {
        confBar.style.width = `${confidencePct}%`;
    }

    // 1. Reset visual flowchart nodes
    const graphNodes = ['gnode-classifier', 'gnode-decision', 'gnode-chunking', 'gnode-evaluation', 'gnode-end'];
    graphNodes.forEach(id => {
        const node = document.getElementById(id);
        if (node) {
            node.classList.remove('completed', 'active');
        }
    });

    const badgeClassifier = document.getElementById('gbadge-classifier');
    const badgeDecision = document.getElementById('gbadge-decision');
    const badgeChunking = document.getElementById('gbadge-chunking');
    const badgeEvaluation = document.getElementById('gbadge-evaluation');

    if (badgeClassifier) badgeClassifier.textContent = '---';
    if (badgeDecision) badgeDecision.textContent = '---';
    if (badgeChunking) badgeChunking.textContent = '---';
    if (badgeEvaluation) badgeEvaluation.textContent = '---';

    // 2. Render execution nodes timeline
    const timelineContainer = document.getElementById('agentic-trace-timeline');
    if (timelineContainer) {
        timelineContainer.innerHTML = '';
    }

    const steps = data.steps || [];
    steps.forEach((step, idx) => {
        // Render timeline log card
        if (timelineContainer) {
            const nodeCard = document.createElement('div');
            nodeCard.className = 'agentic-trace-node completed';

            let iconClass = 'fa-solid fa-gears';
            if (step.node.includes('Classifier')) iconClass = 'fa-solid fa-magnifying-glass';
            else if (step.node.includes('Decision')) iconClass = 'fa-solid fa-route';
            else if (step.node.includes('Chunking')) iconClass = 'fa-solid fa-scissors';
            else if (step.node.includes('Evaluation')) iconClass = 'fa-solid fa-gauge-high';

            nodeCard.innerHTML = `
                <div class="agentic-node-name">
                    <i class="${iconClass}"></i>
                    <span>${escapeHTML(step.node)}</span>
                </div>
                <div class="agentic-node-log">${escapeHTML(step.log)}</div>
            `;
            timelineContainer.appendChild(nodeCard);
        }

        // 3. Highlight visual flowchart nodes and badges dynamically
        if (step.node.includes('Classifier')) {
            const node = document.getElementById('gnode-classifier');
            if (node) node.classList.add('completed');
            if (badgeClassifier) badgeClassifier.textContent = data.doc_type || 'Classified';
        }
        else if (step.node.includes('Decision')) {
            const node = document.getElementById('gnode-decision');
            if (node) node.classList.add('completed');
            if (badgeDecision) badgeDecision.textContent = selectedStrategy.toUpperCase();
        }
        else if (step.node.includes('Chunking')) {
            const node = document.getElementById('gnode-chunking');
            if (node) node.classList.add('completed');
            if (badgeChunking) badgeChunking.textContent = `${data.chunks ? data.chunks.length : 0} Chunks`;
        }
        else if (step.node.includes('Evaluation')) {
            const nodeEval = document.getElementById('gnode-evaluation');
            const nodeEnd = document.getElementById('gnode-end');
            if (nodeEval) nodeEval.classList.add('completed');
            if (nodeEnd) nodeEnd.classList.add('completed');

            // Extract quality score
            let qualScore = "95% Score";
            const qualMatch = step.log.match(/quality score:\s*(\d+)%/i);
            if (qualMatch) {
                qualScore = `${qualMatch[1]}% Score`;
            }
            if (badgeEvaluation) badgeEvaluation.textContent = qualScore;
        }
    });

    // 4. Populate thinking timeline
    const thinkingTimelineSteps = [
        {
            title: "Step 1: Document Uploaded",
            desc: "Source text successfully parsed and loaded into the Agentic context state."
        },
        {
            title: "Step 2: Document Classified",
            desc: `Document layout classified as "${data.doc_type || 'General Document'}".`
        },
        {
            title: "Step 3: Candidate Strategies Evaluated",
            desc: "Evaluated suitability scores for all candidate chunking strategies."
        },
        {
            title: "Step 4: Best Strategy Selected",
            desc: `Selected "${getStrategyLabel(selectedStrategy)}" strategy as the optimal fit.`
        },
        {
            title: "Step 5: Chunking Executed",
            desc: `Generated ${data.chunks ? data.chunks.length : 0} chunks using the chosen strategy.`
        },
        {
            title: "Step 6: Quality Evaluation Completed",
            desc: "Verified chunk size distribution and quality metrics."
        }
    ];
    const thinkingContainer = document.getElementById('agentic-thinking-timeline');
    if (thinkingContainer) {
        thinkingContainer.innerHTML = thinkingTimelineSteps.map(step => `
            <div class="timeline-step completed">
                <div class="timeline-step-title">
                    <i class="fa-solid fa-circle-check text-success"></i>
                    <span>${escapeHTML(step.title)}</span>
                </div>
                <div class="timeline-step-desc">${escapeHTML(step.desc)}</div>
            </div>
        `).join('');
    }

    // 5. Populate Learner Insight Panel
    const docTypeLower = (data.doc_type || "").toLowerCase();
    let structureVal = "Low";
    let complexityVal = "Low";
    let reasonVal = "";

    if (docTypeLower.includes("faq")) {
        structureVal = "Moderate (Q&A Structure)";
        complexityVal = "Medium";
    } else if (docTypeLower.includes("paper") || docTypeLower.includes("contract") || docTypeLower.includes("chart")) {
        structureVal = "High";
        complexityVal = "High";
    } else if (docTypeLower.includes("policy") || docTypeLower.includes("sop") || docTypeLower.includes("banking") || docTypeLower.includes("handbook")) {
        structureVal = "Moderate";
        complexityVal = "Medium";
    } else {
        structureVal = "Low";
        complexityVal = "Low";
    }

    if (selectedStrategy === "document") {
        reasonVal = "Paragraph structure is consistent and hierarchical with clear header tags.";
    } else if (selectedStrategy === "semantic") {
        reasonVal = "The document flows through distinct internal sub-topics without explicit markdown headers.";
    } else if (selectedStrategy === "query") {
        reasonVal = "The text has a clear question-and-answer format suited to keyword-based user searches.";
    } else if (selectedStrategy === "metadata") {
        reasonVal = "Preserving contextual tracking attributes (such as department or version number) is crucial.";
    } else {
        reasonVal = "Text layout is uniform and lacks complex boundaries, so standard recursive character chunking performs best.";
    }

    const learnerInsightContainer = document.getElementById('agentic-learner-insight');
    if (learnerInsightContainer) {
        learnerInsightContainer.innerHTML = `
            <div class="insight-item">
                <span class="insight-label">Detected Document Type:</span>
                <span class="insight-val">${escapeHTML(data.doc_type || 'General Document')}</span>
            </div>
            <div class="insight-item">
                <span class="insight-label">Detected Structure:</span>
                <span class="insight-val">${escapeHTML(structureVal)}</span>
            </div>
            <div class="insight-item">
                <span class="insight-label">Estimated Complexity:</span>
                <span class="insight-val">${escapeHTML(complexityVal)}</span>
            </div>
            <div class="insight-item">
                <span class="insight-label">Recommended Chunking:</span>
                <span class="insight-val">${escapeHTML(getStrategyLabel(selectedStrategy))}</span>
            </div>
            <div class="insight-reason-block">
                <span class="insight-reason-label">Reason:</span>
                <p class="insight-reason-text">${escapeHTML(reasonVal)}</p>
            </div>
        `;
    }

    // 6. Populate Strategy Selection Analysis
    let scores = {
        'recursive': 50,
        'document': 40,
        'semantic': 45,
        'metadata': 35,
        'query': 30
    };

    if (docTypeLower.includes("faq")) {
        scores = {
            'query': 95,
            'semantic': 70,
            'recursive': 75,
            'document': 50,
            'metadata': 45
        };
    } else if (docTypeLower.includes("paper") || docTypeLower.includes("contract") || docTypeLower.includes("chart")) {
        scores = {
            'document': 94,
            'recursive': 76,
            'semantic': 68,
            'metadata': 58,
            'query': 45
        };
    } else if (docTypeLower.includes("policy") || docTypeLower.includes("sop") || docTypeLower.includes("handbook")) {
        scores = {
            'semantic': 90,
            'recursive': 82,
            'document': 72,
            'metadata': 60,
            'query': 40
        };
    } else if (docTypeLower.includes("banking")) {
        scores = {
            'metadata': 95,
            'document': 80,
            'semantic': 72,
            'recursive': 70,
            'query': 40
        };
    } else {
        scores = {
            'recursive': 88,
            'semantic': 65,
            'document': 60,
            'metadata': 50,
            'query': 40
        };
    }

    // Set the selected one to a guaranteed high score
    scores[selectedStrategy] = Math.max(scores[selectedStrategy] || 0, 92);

    const sortedCandidates = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    const scoresContainer = document.getElementById('agentic-strategy-scores');
    if (scoresContainer) {
        scoresContainer.innerHTML = sortedCandidates.map(([strat, score]) => {
            const isSelected = (strat === selectedStrategy);
            return `
                <div class="score-row ${isSelected ? 'selected' : ''}">
                     <div class="score-row-header">
                         <span class="score-row-name">${escapeHTML(getStrategyLabel(strat))}</span>
                         <span class="score-row-value">${score} ${isSelected ? '(Selected)' : ''}</span>
                     </div>
                     <div class="score-row-bar-bg">
                         <div class="score-row-bar-fill" style="width: ${score}%"></div>
                     </div>
                </div>
            `;
        }).join('');
    }

    // 7. Populate Why Other Strategies Were Not Selected
    const explanations = {
        'fixed': "Splits text blindly at character limits, which breaks words and sentences, losing critical context.",
        'recursive': "Standard fallback. Suboptimal because more context-aware structure or semantic breaks can be exploited.",
        'document': "No clear structural headings or numbered sections were detected in this document format.",
        'semantic': "Topic density is uniform, and sentence-level changes are too gradual to justify embedding overhead.",
        'metadata': "The document lacks critical category fields or key-value structures that would benefit from metadata injection.",
        'query': "No retrieval query was provided, or the document is not structured as QA / FAQ pairs."
    };

    if (selectedStrategy === 'document') {
        explanations['semantic'] = "Document structure provides explicit, deterministic heading boundaries, which are more precise than semantic similarity thresholds.";
        explanations['metadata'] = "Context is layout-driven rather than database-driven; metadata enrichment is not primary for this format.";
        explanations['query'] = "This structured document is a general guide, not a set of search-to-answer FAQ pairs.";
        explanations['recursive'] = "Recursive character boundaries fail to respect header structure, which would cause context fragmentation.";
    } else if (selectedStrategy === 'semantic') {
        explanations['document'] = "No distinct structural headings (like H1-H3) were detected to partition the text layout.";
        explanations['metadata'] = "No formal database columns or metadata properties found to extract.";
        explanations['query'] = "No specific retrieval query was input to shape query-centric segments.";
        explanations['recursive'] = "Recursive splitting is character-limited, whereas semantic similarity splits at natural topic shifts.";
    } else if (selectedStrategy === 'query') {
        explanations['document'] = "The Q&A structure is query-centric, making standard heading-based layout splits less optimal for retrieval accuracy.";
        explanations['semantic'] = "Optimizing chunks for user query relevance takes priority over general topic shifts.";
        explanations['metadata'] = "Context tags are secondary to matching exact search intent in this Q&A list.";
        explanations['recursive'] = "Simple recursive splitting would split question-answer pairs across different chunks, breaking query paths.";
    } else if (selectedStrategy === 'metadata') {
        explanations['document'] = "Although structured, this financial record requires explicit metadata tags (like author and version) for auditability, which layout chunking doesn't support.";
        explanations['semantic'] = "Topic density is variable, but tracking departmental tags is critical for retrieval filters.";
        explanations['query'] = "No user retrieval query was supplied to prioritize semantic search regions.";
        explanations['recursive'] = "Recursive character splitting does not inject metadata tags, leading to loss of context in multi-document vector retrieval.";
    } else if (selectedStrategy === 'recursive') {
        explanations['document'] = "No structural headings detected in this plain raw text.";
        explanations['semantic'] = "Uniform text length and size are too small to justify expensive embedding similarity overhead.";
        explanations['metadata'] = "No fields found to extract metadata tags.";
        explanations['query'] = "No query provided to orient the chunk borders.";
    }

    const rejectedContainer = document.getElementById('agentic-rejected-reasons');
    if (rejectedContainer) {
        rejectedContainer.innerHTML = sortedCandidates
            .filter(([strat]) => strat !== selectedStrategy)
            .map(([strat]) => `
                <div class="rejected-reason-row">
                     <div class="rejected-strategy-name">
                         <i class="fa-solid fa-ban text-danger"></i>
                         <span>${escapeHTML(getStrategyLabel(strat))}</span>
                     </div>
                     <div class="rejected-reason-text">${escapeHTML(explanations[strat] || 'Not selected as it is suboptimal for this document type.')}</div>
                </div>
            `).join('');
    }
}

// Phase 12: Comparison Dashboard API and Chart Renderers
async function runBatchComparison() {
    const text = docPreviewText.innerText.trim();
    if (!text) {
        alert("Please select or upload a document to run comparison.");
        return;
    }

    const btnCompare = document.getElementById('btn-run-comparison');
    if (!btnCompare) return;

    btnCompare.disabled = true;
    btnCompare.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Analysis...';

    try {
        const response = await fetch(`${BACKEND_URL}/chunk/compare`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        renderComparisonDashboard(data);
    } catch (error) {
        console.error("Batch comparison failed:", error);
        alert(`Comparison failed: ${error.message}`);
    } finally {
        btnCompare.disabled = false;
        btnCompare.innerHTML = '<i class="fa-solid fa-play"></i> Run Strategy Comparison';
    }
}

function renderComparisonDashboard(data) {
    const tableBody = document.querySelector('#dashboard-compare-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const strategyDisplayNames = {
        'fixed': 'Fixed-Size Character',
        'recursive': 'Recursive Character',
        'document': 'Document-Structure',
        'semantic': 'Semantic Similarity',
        'query': 'Query-Aware',
        'metadata': 'Metadata-Enhanced',
        'llm': 'LLM-Based (Simulated)'
    };

    const strategies = ['fixed', 'recursive', 'document', 'semantic', 'query', 'metadata', 'llm'];

    const chartLabels = [];
    const chunkCounts = [];
    const latencies = [];

    const radarDataSets = {
        'fixed': [],
        'recursive': [],
        'document': [],
        'semantic': [],
        'query': [],
        'metadata': [],
        'llm': []
    };

    strategies.forEach(strategy => {
        const sData = data[strategy];
        if (!sData) return;

        const displayName = strategyDisplayNames[strategy];
        chartLabels.push(displayName);
        chunkCounts.push(sData.chunk_count);
        latencies.push(sData.latency_ms);

        const contextScores = {
            'fixed': 15,
            'recursive': 35,
            'document': 75,
            'semantic': 65,
            'query': 60,
            'metadata': 95,
            'llm': 90
        };
        const contextPreservation = contextScores[strategy];
        const coherenceScore = Math.round((sData.coherence || 0.0) * 100);
        const retrievalScore = Math.round((sData.retrieval_relevance || 0.0) * 100);

        let sizeScore = 100;
        if (sData.chunk_count > 0) {
            const diff = Math.abs(sData.avg_size - 600);
            sizeScore = Math.max(10, Math.round(100 - (diff / 6.0)));
        } else {
            sizeScore = 0;
        }

        let speedScore = 100;
        if (sData.latency_ms > 0) {
            speedScore = Math.max(10, Math.round(100 - (sData.latency_ms / 15.0)));
        } else {
            speedScore = 0;
        }

        radarDataSets[strategy] = [
            contextPreservation,
            coherenceScore,
            retrievalScore,
            sizeScore,
            speedScore
        ];

        let grade = 'C';
        let gradeClass = 'low';
        const overallScore = Math.round((contextPreservation + coherenceScore + retrievalScore + sizeScore + speedScore) / 5);

        if (overallScore >= 80) {
            grade = 'A+ (Excellent)';
            gradeClass = 'high';
        } else if (overallScore >= 65) {
            grade = 'B (Good)';
            gradeClass = 'medium';
        } else if (overallScore >= 45) {
            grade = 'C (Pass)';
            gradeClass = 'medium';
        } else {
            grade = 'D (Weak)';
            gradeClass = 'low';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHTML(displayName)}</strong></td>
            <td>${sData.chunk_count}</td>
            <td>${sData.avg_size}</td>
            <td><span class="metric-pill ${coherenceScore >= 70 ? 'high' : coherenceScore >= 50 ? 'medium' : 'low'}">${coherenceScore}%</span></td>
            <td><span class="metric-pill ${retrievalScore >= 70 ? 'high' : retrievalScore >= 50 ? 'medium' : 'low'}">${retrievalScore}%</span></td>
            <td>${sData.latency_ms.toFixed(1)} ms</td>
            <td><span class="metric-pill ${gradeClass}">${grade}</span></td>
        `;
        tableBody.appendChild(row);
    });

    const ctxBar = document.getElementById('chart-bar-metrics').getContext('2d');
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Chunk Count',
                    data: chunkCounts,
                    backgroundColor: 'rgba(139, 92, 246, 0.65)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1.5,
                    yAxisID: 'y'
                },
                {
                    label: 'Latency (ms)',
                    data: latencies,
                    backgroundColor: 'rgba(20, 184, 166, 0.65)',
                    borderColor: '#14b8a6',
                    borderWidth: 1.5,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, font: { family: 'Outfit', weight: 600 } }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit', size: 10 } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: gridColor },
                    ticks: { color: textColor },
                    title: { display: true, text: 'Chunks Generated', color: textColor }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: textColor },
                    title: { display: true, text: 'Latency (ms)', color: textColor }
                }
            }
        }
    });

    const ctxRadar = document.getElementById('chart-radar-quality').getContext('2d');
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    const radarColors = {
        'fixed': { fill: 'rgba(239, 68, 68, 0.05)', stroke: '#ef4444' },
        'recursive': { fill: 'rgba(245, 158, 11, 0.05)', stroke: '#f59e0b' },
        'document': { fill: 'rgba(147, 51, 234, 0.05)', stroke: '#9333ea' },
        'semantic': { fill: 'rgba(16, 185, 129, 0.05)', stroke: '#10b981' },
        'query': { fill: 'rgba(59, 130, 246, 0.05)', stroke: '#3b82f6' },
        'metadata': { fill: 'rgba(20, 184, 166, 0.1)', stroke: '#14b8a6' },
        'llm': { fill: 'rgba(249, 115, 22, 0.05)', stroke: '#f97316' }
    };

    const datasetsRadar = strategies.map(strategy => {
        const color = radarColors[strategy];
        return {
            label: strategyDisplayNames[strategy],
            data: radarDataSets[strategy],
            backgroundColor: color.fill,
            borderColor: color.stroke,
            pointBackgroundColor: color.stroke,
            borderWidth: 2,
            hidden: ['fixed', 'query', 'llm'].includes(strategy)
        };
    });

    radarChartInstance = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['Context Preservation', 'Semantic Coherence', 'Retrieval Relevance', 'Size Balance', 'Speed'],
            datasets: datasetsRadar
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, font: { family: 'Outfit', weight: 600 } }
                }
            },
            scales: {
                r: {
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: textColor, font: { family: 'Outfit', size: 10, weight: 600 } },
                    ticks: { color: textColor, backdropColor: 'transparent', stepSize: 20 },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

// Phase 13: Global RAG Simulator Search and Scorecard Renderers
async function runGlobalRetrievalSimulation() {
    const queryInput = document.getElementById('global-sim-query-input');
    const resultsContainer = document.getElementById('global-sim-results-container');
    const btnSimRetrieve = document.getElementById('btn-global-sim-retrieve');

    if (!queryInput || !resultsContainer || !btnSimRetrieve) return;

    const query = queryInput.value.trim();
    if (!query) {
        alert("Please enter a query to run the RAG simulation.");
        return;
    }

    if (!currentChunkData || !currentChunkData.chunks || currentChunkData.chunks.length === 0) {
        alert("Please generate chunks first using 'Apply Chunking' before using the simulator.");
        return;
    }

    btnSimRetrieve.disabled = true;
    btnSimRetrieve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Retrieving...';

    resultsContainer.innerHTML = `
        <div class="empty-output-state">
            <i class="fa-solid fa-spinner fa-spin empty-icon"></i>
            <h3>Retrieving Chunks...</h3>
            <p>Running semantic similarity search and calculating precision/recall metrics.</p>
        </div>
    `;

    try {
        const response = await fetch(`${BACKEND_URL}/chunk/retrieve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                chunks: currentChunkData.chunks,
                top_k: 3
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        const retrieved = data.retrieved || [];

        // 1. Populate scorecards
        const meanSimEl = document.getElementById('global-sim-mean-similarity');
        const precisionEl = document.getElementById('global-sim-precision');
        const recallEl = document.getElementById('global-sim-recall');

        if (meanSimEl) meanSimEl.textContent = `${(data.mean_similarity * 100).toFixed(0)}%`;
        if (precisionEl) precisionEl.textContent = `${(data.precision * 100).toFixed(0)}%`;
        if (recallEl) recallEl.textContent = `${(data.recall * 100).toFixed(0)}%`;

        // 2. Render retrieved chunks
        resultsContainer.innerHTML = '';

        if (retrieved.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-output-state">
                    <i class="fa-solid fa-triangle-exclamation empty-icon animate-pulse"></i>
                    <h3>No Chunks Retrieved</h3>
                    <p>No matches were found for your query. Try adjusting your search text.</p>
                </div>
            `;
            return;
        }

        retrieved.forEach(item => {
            const chunk = item.chunk;
            const simScore = item.similarity_score;
            const boost = item.metadata_match_score;
            const confidence = item.retrieval_confidence;

            const card = document.createElement('div');
            card.className = 'chunk-visual-card';
            card.id = `global-sim-card-${chunk.index}`;
            card.setAttribute('title', 'Click to expand/collapse full chunk text');

            let headingHtml = '';
            if (chunk.metadata && chunk.metadata.Section) {
                headingHtml = `<span class="chunk-section-badge" title="Section: ${escapeHTML(chunk.metadata.Section)}"><i class="fa-solid fa-bookmark"></i> ${escapeHTML(chunk.metadata.Section)}</span>`;
            } else if (chunk.topic) {
                headingHtml = `<span class="chunk-section-badge" title="Topic: ${escapeHTML(chunk.topic)}"><i class="fa-solid fa-tags"></i> Topic: ${escapeHTML(chunk.topic)}</span>`;
            }

            let metaBadgesHtml = '';
            if (chunk.metadata) {
                for (const [key, val] of Object.entries(chunk.metadata)) {
                    if (key.toLowerCase() === 'section') continue;
                    let shortKey = key.substring(0, 4);
                    if (key.toLowerCase() === 'department') shortKey = 'Dept';
                    else if (key.toLowerCase() === 'author') shortKey = 'Auth';
                    else if (key.toLowerCase() === 'version') shortKey = 'Ver';
                    metaBadgesHtml += `<span class="chunk-meta-badge" title="${escapeHTML(key)}: ${escapeHTML(val)}"><i class="fa-solid fa-tag"></i> ${escapeHTML(shortKey)}: ${escapeHTML(val)}</span>`;
                }
            }

            let prependedHtml = '';
            if (chunk.prepended_text && chunk.text !== chunk.prepended_text) {
                const headerLen = chunk.prepended_text.length - chunk.text.length;
                const headerText = chunk.prepended_text.substring(0, headerLen);
                prependedHtml = `<div class="chunk-prepended-context"><strong>Context Prepend:</strong> ${escapeHTML(headerText)}</div>`;
            }

            let simBadgeHtml = '';
            if (boost > 0) {
                simBadgeHtml = `
                    <div class="sim-score-badges">
                        <span class="sim-badge similarity" title="Cosine Similarity of embeddings"><i class="fa-solid fa-brain"></i> Cos Sim: ${simScore.toFixed(3)}</span>
                        <span class="sim-badge meta-boost" title="Relevance boost from matching metadata tags"><i class="fa-solid fa-rocket"></i> Meta Boost: +${boost.toFixed(2)}</span>
                        <span class="sim-badge confidence" title="Final combined retrieval confidence score"><i class="fa-solid fa-circle-check"></i> Confidence: ${(confidence * 100).toFixed(0)}%</span>
                    </div>
                `;
            } else {
                simBadgeHtml = `
                    <div class="sim-score-badges">
                        <span class="sim-badge similarity" title="Cosine Similarity of embeddings" style="background: rgba(139, 92, 246, 0.12); color: var(--primary); border: 1px solid rgba(139, 92, 246, 0.2);"><i class="fa-solid fa-brain"></i> Cos Sim: ${simScore.toFixed(3)}</span>
                        <span class="sim-badge confidence" title="Final retrieval similarity score"><i class="fa-solid fa-circle-check"></i> Confidence: ${(simScore * 100).toFixed(0)}%</span>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="chunk-card-header">
                    <span class="chunk-number">Chunk #${chunk.index}</span>
                    ${headingHtml}
                    ${metaBadgesHtml}
                    <span class="chunk-size-badge">${chunk.length} chars</span>
                </div>
                ${prependedHtml}
                <div class="chunk-card-body">${escapeHTML(chunk.text)}</div>
                ${simBadgeHtml}
            `;

            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            resultsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Retrieval simulation failed:", error);
        alert(`Retrieval failed: ${error.message}`);
        resultsContainer.innerHTML = `
            <div class="empty-output-state">
                <i class="fa-solid fa-triangle-exclamation empty-icon text-warning"></i>
                <h3>Retrieval Error</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    } finally {
        btnSimRetrieve.disabled = false;
        btnSimRetrieve.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Retrieve Chunks';
    }
}

// Phase 22 - Recursive process step-by-step scanner simulator (walkthrough mode)
function setupWalkthroughSimulation() {
    const showBtn = document.getElementById('btn-show-walkthrough');
    const box = document.getElementById('walkthrough-simulation-box');
    const viewer = document.getElementById('sim-text-viewer');
    const badge = document.getElementById('walkthrough-step-badge');
    const counter = document.getElementById('walkthrough-step-counter');
    const desc = document.getElementById('walkthrough-step-desc');
    const nextBtn = document.getElementById('btn-walkthrough-next');
    const prevBtn = document.getElementById('btn-walkthrough-prev');

    if (!showBtn) return;

    // Extract a snippet of text from the document preview, or use fallback
    const rawDocText = docPreviewText.innerText.trim();
    const snippetText = rawDocText.length > 250 ? rawDocText.substring(0, 250) + "..." : rawDocText || "This is a sample leave policy document.\n\n1. Annual Leave Eligibility\nEmployees are entitled to annual leaves.\n\n2. Sick Leave Eligibility\nEmployees have sick leaves.";

    let currentStep = 1;

    showBtn.addEventListener('click', () => {
        if (box.style.display === 'none') {
            box.style.display = 'flex';
            showBtn.innerHTML = `<i class="fa-solid fa-circle-stop"></i> Hide Simulator`;
            renderStep(currentStep);
        } else {
            box.style.display = 'none';
            showBtn.innerHTML = `<i class="fa-solid fa-circle-play"></i> Show Recursive Process`;
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < 4) {
            currentStep++;
            renderStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            renderStep(currentStep);
        }
    });

    function renderStep(step) {
        prevBtn.disabled = (step === 1);
        nextBtn.innerHTML = step === 4 ? `Restart <i class="fa-solid fa-arrows-rotate"></i>` : `Next <i class="fa-solid fa-chevron-right"></i>`;

        if (step === 4 && nextBtn.getAttribute('listener-bound') !== 'true') {
            nextBtn.setAttribute('listener-bound', 'true');
        }

        if (step === 1) {
            badge.innerText = "Paragraph split (\\n\\n)";
            badge.style.background = "rgba(16, 185, 129, 0.15)";
            badge.style.borderColor = "var(--success)";
            badge.style.color = "var(--success)";
            counter.innerText = "Step 1 of 4";
            desc.innerText = "First separator scan: The splitter identifies paragraph splits (\\n\\n). If paragraph sizes are within target limit, splits succeed. Oversized blocks proceed to next step.";

            // Highlight paragraph separations
            const formatted = snippetText.replace(/\n\n/g, '<span class="sim-separator-highlight">\\n\\n</span>');
            viewer.innerHTML = formatted;
        } else if (step === 2) {
            badge.innerText = "Line split (\\n)";
            badge.style.background = "rgba(59, 130, 246, 0.15)";
            badge.style.borderColor = "var(--primary)";
            badge.style.color = "var(--primary)";
            counter.innerText = "Step 2 of 4";
            desc.innerText = "Second separator scan: Oversized paragraphs are recursively scanned for newline boundary splits (\\n). Small lines succeed. Oversized lines proceed to step 3.";

            const formatted = snippetText
                .replace(/\n\n/g, '<span class="sim-block-highlight">\\n\\n</span>')
                .replace(/\n/g, '<span class="sim-separator-highlight">\\n</span>');
            viewer.innerHTML = formatted;
        } else if (step === 3) {
            badge.innerText = "Word split (\" \")";
            badge.style.background = "rgba(245, 158, 11, 0.15)";
            badge.style.borderColor = "var(--warning)";
            badge.style.color = "var(--warning)";
            counter.innerText = "Step 3 of 4";
            desc.innerText = "Third separator scan: Oversized lines are scanned for word boundaries (spaces). Splitting here ensures sentences/words are not split inside chunks.";

            const formatted = snippetText
                .replace(/\n/g, '<span class="sim-block-highlight">\\n</span>')
                .replace(/ /g, '<span class="sim-separator-highlight"> </span>');
            viewer.innerHTML = formatted;
        } else if (step === 4) {
            badge.innerText = "Character split (\"\")";
            badge.style.background = "rgba(239, 68, 68, 0.15)";
            badge.style.borderColor = "var(--danger)";
            badge.style.color = "var(--danger)";
            counter.innerText = "Step 4 of 4";
            desc.innerText = "Fallback separator: If a word is somehow larger than the chunk size limit, it splits at character-by-character level (\"\"), resulting in a word break.";

            // Highlight splits at character intervals
            const chars = [...snippetText];
            const formatted = chars.map((c, i) => i % 15 === 0 && i > 0 ? `<span class="sim-separator-highlight"></span>${c}` : c).join('');
            viewer.innerHTML = formatted;

            // Hook up Restart on Next click at step 4
            nextBtn.onclick = (e) => {
                e.preventDefault();
                currentStep = 1;
                renderStep(1);
                nextBtn.onclick = null;
            };
        }
    }
}

// Switch document views
function switchDocumentView(view) {
    const grid = document.getElementById('chunks-output-grid');
    const structurePanel = document.getElementById('doc-structure-panel');
    const metadataPanel = document.getElementById('doc-metadata-panel');
    const mappingPanel = document.getElementById('doc-mapping-panel');

    // Hide all
    if (grid) grid.style.display = 'none';
    if (structurePanel) structurePanel.style.display = 'none';
    if (metadataPanel) metadataPanel.style.display = 'none';
    if (mappingPanel) mappingPanel.style.display = 'none';

    // Show active
    if (view === 'cards') {
        if (grid) grid.style.display = '';
    } else if (view === 'structure') {
        if (structurePanel) structurePanel.style.display = 'flex';
    } else if (view === 'metadata') {
        if (metadataPanel) metadataPanel.style.display = 'flex';
    } else if (view === 'mapping') {
        if (mappingPanel) mappingPanel.style.display = 'flex';
    }
}

// Switch semantic views
function switchSemanticView(view) {
    const grid = document.getElementById('chunks-output-grid');
    const visualizationPanel = document.getElementById('sem-visualization-panel');
    const conceptPanel = document.getElementById('sem-concept-panel');
    const insightsPanel = document.getElementById('sem-insights-panel');

    // Hide all
    if (grid) grid.style.display = 'none';
    if (visualizationPanel) visualizationPanel.style.display = 'none';
    if (conceptPanel) conceptPanel.style.display = 'none';
    if (insightsPanel) insightsPanel.style.display = 'none';

    // Show active
    if (view === 'cards') {
        if (grid) grid.style.display = '';
    } else if (view === 'visualization') {
        if (visualizationPanel) visualizationPanel.style.display = 'block';
    } else if (view === 'concept') {
        if (conceptPanel) conceptPanel.style.display = 'block';
    } else if (view === 'insights') {
        if (insightsPanel) insightsPanel.style.display = 'block';
    }
}

// Render Semantic Similarity Flow Chart & Boundaries
function renderSemanticSimilarityFlow(data) {
    const flowContainer = document.getElementById('sem-flow-container');
    const boundaryContainer = document.getElementById('sem-boundary-container');
    if (!flowContainer || !boundaryContainer) return;

    flowContainer.innerHTML = '';
    boundaryContainer.innerHTML = '';

    const records = data.sentence_similarities || [];

    if (records.length === 0) {
        flowContainer.innerHTML = `
            <div class="empty-output-state" style="padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation empty-icon"></i>
                <h4 style="font-size: 13px;">Insufficient Sentences</h4>
                <p style="font-size: 11px;">Please enter a document containing at least two sentences to visualize semantic transitions and similarity scores.</p>
            </div>
        `;
        boundaryContainer.innerHTML = `
            <div class="empty-output-state" style="padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation empty-icon"></i>
                <h4 style="font-size: 13px;">No Boundaries to Track</h4>
                <p style="font-size: 11px;">Topic shifts are tracked between consecutive sentences. Try adding more sentences.</p>
            </div>
        `;
        return;
    }

    // Render FEATURE 3: Similarity Score Flow
    records.forEach((record, index) => {
        if (index === 0) {
            const boxA = document.createElement('div');
            boxA.className = 'sem-sentence-box';
            boxA.innerHTML = `
                <div style="font-weight: 700; color: var(--primary); margin-bottom: 2px;">Sentence 1</div>
                <div style="color: var(--text-primary); font-family: var(--font-sans);">${escapeHTML(record.sentence_a)}</div>
                <div style="font-size: 9.5px; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-tag"></i> Current Topic: <b>${escapeHTML(record.topic_a)}</b></div>
            `;
            flowContainer.appendChild(boxA);
        }

        const arrow = document.createElement('div');
        arrow.className = 'sem-flow-arrow-wrapper';

        const badgeClass = record.split_created ? 'split' : 'keep';
        arrow.innerHTML = `
            <div class="sem-flow-arrow"><i class="fa-solid fa-arrow-down-long"></i></div>
            <div class="sem-score-badge ${badgeClass}" title="Threshold is ${record.threshold}%">
                Similarity Score: ${record.similarity}% (Threshold: ${record.threshold}%)
            </div>
            <div class="sem-flow-arrow"><i class="fa-solid fa-arrow-down-long"></i></div>
        `;
        flowContainer.appendChild(arrow);

        if (record.split_created) {
            const splitLine = document.createElement('div');
            splitLine.className = 'sem-split-line';
            splitLine.innerHTML = `
                <span class="sem-split-label">
                    <i class="fa-solid fa-scissors"></i> Topic Change Detected – New Chunk Created
                </span>
            `;
            flowContainer.appendChild(splitLine);
        }

        const boxB = document.createElement('div');
        boxB.className = 'sem-sentence-box';
        boxB.innerHTML = `
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 2px;">Sentence ${index + 2}</div>
            <div style="color: var(--text-primary); font-family: var(--font-sans);">${escapeHTML(record.sentence_b)}</div>
            <div style="font-size: 9.5px; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-tag"></i> Current Topic: <b>${escapeHTML(record.topic_b)}</b></div>
        `;
        flowContainer.appendChild(boxB);

        // Render FEATURE 4: Topic Boundary Detection Panel
        const boundaryCard = document.createElement('div');
        const statusClass = record.split_created ? 'split' : 'keep';
        const decisionText = record.split_created ? 'New Topic Detected' : 'Continue Current Chunk';
        const actionText = record.split_created ? 'Create New Chunk' : 'Keep in Chunk';
        boundaryCard.className = `sem-boundary-card ${statusClass}`;

        boundaryCard.innerHTML = `
            <div class="sem-boundary-header">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-primary);">Transition ${index + 1}</span>
                <span class="sem-boundary-decision">${decisionText}</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                <div><b>Current Topic:</b> <span style="color: var(--secondary);">${escapeHTML(record.topic_a)}</span></div>
                <div><b>Next Topic:</b> <span style="color: var(--primary);">${escapeHTML(record.topic_b)}</span></div>
                <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 0.5px solid var(--border); font-size: 11px;">
                    <span>Similarity: <b>${record.similarity}%</b></span>
                    <span style="font-weight: 700; color: ${record.split_created ? 'var(--danger)' : 'var(--success)'};">${actionText}</span>
                </div>
            </div>
        `;
        boundaryContainer.appendChild(boundaryCard);
    });
}

// Render Document Hierarchy Tree
function renderDocumentStructureTree(data) {
    const container = document.getElementById('doc-hierarchy-tree');
    if (!container) return;
    container.innerHTML = '';

    if (!data.hierarchy || data.hierarchy.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; font-style: italic; padding: 20px;">No sections or structure found.</div>';
        return;
    }

    const nodeMap = {};

    data.hierarchy.forEach(item => {
        const node = document.createElement('div');
        node.className = 'doc-tree-node';
        node.innerHTML = `
            <div class="doc-tree-node-title" data-chunk-index="${item.chunk_index}">
                <i class="fa-solid fa-chevron-down caret-icon" style="visibility: hidden; margin-right: 4px;"></i>
                <i class="fa-solid fa-hashtag" style="color: var(--primary);"></i>
                <span>${escapeHTML(item.heading)}</span>
                <span class="node-tag ${item.level.toLowerCase()}" style="margin-left: auto;">${item.level}</span>
            </div>
            <div class="doc-tree-children"></div>
        `;

        const titleEl = node.querySelector('.doc-tree-node-title');
        titleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            // Scroll to target chunk card and flash highlight it
            const docTabBtnCards = document.querySelector('.doc-tab-btn[data-view="cards"]');
            if (docTabBtnCards) docTabBtnCards.click();

            setTimeout(() => {
                const card = document.getElementById(`chunk-card-${item.chunk_index}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('pulse-highlight');
                    setTimeout(() => card.classList.remove('pulse-highlight'), 2000);
                }
            }, 100);
        });

        nodeMap[item.heading] = node;
    });

    data.hierarchy.forEach(item => {
        const node = nodeMap[item.heading];
        if (item.parent && item.parent !== 'Document' && nodeMap[item.parent]) {
            const parentNode = nodeMap[item.parent];
            const childrenContainer = parentNode.querySelector('.doc-tree-children');
            childrenContainer.appendChild(node);

            // Show caret icon on parent
            const caret = parentNode.querySelector('.caret-icon');
            if (caret) {
                caret.style.visibility = 'visible';
                caret.style.cursor = 'pointer';
            }
        } else {
            container.appendChild(node);
        }
    });

    // Make parent nodes collapsible
    data.hierarchy.forEach(item => {
        const node = nodeMap[item.heading];
        const caret = node.querySelector('.caret-icon');
        const children = node.querySelector('.doc-tree-children');
        if (caret && children) {
            caret.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = children.style.display === 'none';
                children.style.display = isCollapsed ? 'block' : 'none';
                caret.className = isCollapsed ? 'fa-solid fa-chevron-down caret-icon' : 'fa-solid fa-chevron-right caret-icon';
            });
        }
    });

    // Render Analytics Dashboard (Feature 4)
    const stats = data.metrics.analytics || { total_headings: 0, total_subheadings: 0, total_sections: 0, total_chunks: 0 };
    document.getElementById('doc-stat-headings').textContent = stats.total_headings;
    document.getElementById('doc-stat-subheadings').textContent = stats.total_subheadings;
    document.getElementById('doc-stat-sections').textContent = stats.total_sections;
    document.getElementById('doc-stat-chunks').textContent = stats.total_chunks;

    // Render Preservation Scores (Feature 5)
    const preservation = data.metrics.preservation_scores || { headings_preserved: 100, sections_preserved: 100, subsections_preserved: 100, overall_preservation: 100 };

    document.getElementById('doc-score-overall').textContent = `${preservation.overall_preservation}%`;
    document.getElementById('doc-bar-overall').style.width = `${preservation.overall_preservation}%`;

    document.getElementById('doc-score-headings').textContent = `${preservation.headings_preserved}%`;
    document.getElementById('doc-bar-headings').style.width = `${preservation.headings_preserved}%`;

    document.getElementById('doc-score-sections').textContent = `${preservation.sections_preserved}%`;
    document.getElementById('doc-bar-sections').style.width = `${preservation.sections_preserved}%`;

    document.getElementById('doc-score-subsections').textContent = `${preservation.subsections_preserved}%`;
    document.getElementById('doc-bar-subsections').style.width = `${preservation.subsections_preserved}%`;
}

// Render Document Metadata panel (Feature 3)
function renderDocumentMetadata(data) {
    const container = document.getElementById('doc-metadata-viewer-container');
    if (!container) return;
    container.innerHTML = '';

    if (!data.chunks || data.chunks.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; font-style: italic; padding: 20px; grid-column: 1 / -1;">No metadata available.</div>';
        return;
    }

    data.chunks.forEach(chunk => {
        const meta = chunk.metadata || {};
        const card = document.createElement('div');
        card.className = 'metadata-grid-card';
        card.innerHTML = `
            <h4>Chunk #${chunk.index} Metadata</h4>
            <div class="metadata-row-item">
                <span>Section Name:</span>
                <span>${escapeHTML(meta.section_name || 'N/A')}</span>
            </div>
            <div class="metadata-row-item">
                <span>Heading Level:</span>
                <span>${escapeHTML(meta.level || 'N/A')}</span>
            </div>
            <div class="metadata-row-item">
                <span>Parent Section:</span>
                <span>${escapeHTML(meta.parent || 'N/A')}</span>
            </div>
            <div class="metadata-row-item">
                <span>Section Order:</span>
                <span>${meta.order || chunk.index}</span>
            </div>
            <div class="metadata-row-item">
                <span>Chunk Number:</span>
                <span>${meta.chunk_number || chunk.index}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render Section-to-Chunk Mapping Flow (Feature 8)
function renderDocumentMappingFlow(data) {
    const container = document.getElementById('doc-mapping-flow-container');
    if (!container) return;
    container.innerHTML = '';

    if (!data.hierarchy || data.hierarchy.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; font-style: italic; padding: 20px;">No mapping flow available.</div>';
        return;
    }

    data.hierarchy.forEach(item => {
        const row = document.createElement('div');
        row.className = 'doc-mapping-row';
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <div class="doc-mapping-source">
                <i class="fa-solid fa-bookmark"></i>
                <span>${escapeHTML(item.heading)}</span>
                <span class="node-tag ${item.level.toLowerCase()}" style="font-size: 8px; padding: 1px 4px; border-radius: 3px; margin-left: 6px;">${item.level}</span>
            </div>
            <div class="doc-mapping-arrow">
                <i class="fa-solid fa-circle-arrow-right"></i>
            </div>
            <div class="doc-mapping-target">
                <i class="fa-solid fa-puzzle-piece"></i>
                <span>Chunk #${item.chunk_index}</span>
            </div>
        `;

        row.addEventListener('click', () => {
            const docTabBtnCards = document.querySelector('.doc-tab-btn[data-view="cards"]');
            if (docTabBtnCards) docTabBtnCards.click();

            setTimeout(() => {
                const card = document.getElementById(`chunk-card-${item.chunk_index}`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('pulse-highlight');
                    setTimeout(() => card.classList.remove('pulse-highlight'), 2000);
                }
            }, 100);
        });

        container.appendChild(row);
    });
}

// Switch query-aware views
function switchQueryView(view) {
    const grid = document.getElementById('chunks-output-grid');
    const simulationPanel = document.getElementById('query-simulation-panel');
    const conceptPanel = document.getElementById('query-concept-panel');

    // Hide all
    if (grid) grid.style.display = 'none';
    if (simulationPanel) simulationPanel.style.display = 'none';
    if (conceptPanel) conceptPanel.style.display = 'none';

    // Show active
    if (view === 'cards') {
        if (grid) {
            grid.style.display = '';
            grid.className = isGridView ? 'chunks-container grid-layout' : 'chunks-container list-layout';
        }
    } else if (view === 'simulation') {
        if (simulationPanel) simulationPanel.style.display = 'block';
    } else if (view === 'concept') {
        if (conceptPanel) conceptPanel.style.display = 'block';
    }
}

// Run query-aware simulation
async function runQuerySimulationPlayground(queryText) {
    const resultsContainer = document.getElementById('query-sim-results-container');
    const btnRunQuerySim = document.getElementById('btn-run-query-sim');

    if (!resultsContainer || !btnRunQuerySim) return;

    if (!queryText) {
        alert("Please enter a query to run the simulation.");
        return;
    }

    if (!currentChunkData || !currentChunkData.chunks || currentChunkData.chunks.length === 0) {
        alert("Please generate chunks first using 'Apply Chunking'.");
        return;
    }

    btnRunQuerySim.disabled = true;
    btnRunQuerySim.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running...';

    resultsContainer.innerHTML = `
        <div class="empty-output-state" style="padding: 20px;">
            <i class="fa-solid fa-spinner fa-spin empty-icon"></i>
            <h3>Retrieving Chunks...</h3>
            <p>Running semantic similarity search against local query-aware chunks.</p>
        </div>
    `;

    try {
        const response = await fetch(`${BACKEND_URL}/chunk/retrieve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: queryText,
                chunks: currentChunkData.chunks,
                top_k: 3
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `Server error: ${response.status}`);
        }

        const data = await response.json();
        renderQuerySimulation(data);

    } catch (error) {
        console.error("Query simulation failed:", error);
        alert(`Query simulation failed: ${error.message}`);
        resultsContainer.innerHTML = `
            <div class="empty-output-state" style="padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation empty-icon text-warning"></i>
                <h3>Retrieval Error</h3>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;
    } finally {
        btnRunQuerySim.disabled = false;
        btnRunQuerySim.innerHTML = '<i class="fa-solid fa-search"></i> Run Simulation';
    }
}

// Render query simulation results
function renderQuerySimulation(data) {
    const container = document.getElementById('query-sim-results-container');
    if (!container) return;
    container.innerHTML = '';

    const retrieved = data.retrieved || [];

    if (retrieved.length === 0) {
        container.innerHTML = `
            <div class="empty-output-state" style="padding: 20px;">
                <i class="fa-solid fa-triangle-exclamation empty-icon animate-pulse"></i>
                <h3>No Chunks Retrieved</h3>
                <p>No matches were found for your query. Try adjusting your search text.</p>
            </div>
        `;
        return;
    }

    retrieved.forEach((item, idx) => {
        const chunk = item.chunk;
        const simScore = item.similarity_score;

        const card = document.createElement('div');
        card.className = 'chunk-visual-card expanded';
        card.id = `query-sim-card-${chunk.index}`;
        card.style.borderLeft = `4px solid ${idx === 0 ? 'var(--success)' : 'var(--primary)'}`;

        let headingHtml = '';
        if (chunk.heading) {
            headingHtml = `<span class="chunk-section-badge" title="Section: ${escapeHTML(chunk.heading)}"><i class="fa-solid fa-bookmark"></i> ${escapeHTML(chunk.heading)}</span>`;
        } else if (chunk.title) {
            headingHtml = `<span class="chunk-section-badge" title="Title: ${escapeHTML(chunk.title)}"><i class="fa-solid fa-bookmark"></i> ${escapeHTML(chunk.title)}</span>`;
        } else if (chunk.topic) {
            headingHtml = `<span class="chunk-section-badge" title="Topic: ${escapeHTML(chunk.topic)}"><i class="fa-solid fa-tags"></i> Topic: ${escapeHTML(chunk.topic)}</span>`;
        }

        let scoreClass = 'low';
        if (simScore >= 0.7) scoreClass = 'high';
        else if (simScore >= 0.4) scoreClass = 'medium';
        const relevanceBadge = `<span class="relevance-score ${scoreClass}" title="Similarity: ${simScore}"><i class="fa-solid fa-bullseye"></i> Score: ${simScore.toFixed(4)}</span>`;

        card.innerHTML = `
            <div class="chunk-card-header">
                <span class="chunk-number">Rank #${idx + 1} (Chunk #${chunk.index})</span>
                ${headingHtml}
                ${relevanceBadge}
                <span class="chunk-size-badge">${chunk.length} chars</span>
            </div>
            <div class="chunk-card-body">${escapeHTML(chunk.text)}</div>
        `;

        container.appendChild(card);
    });
}

// Web content heuristic classification
function classifyWebContent(url, text, preDefinedKey = null) {
    const section = document.getElementById('url-content-analysis-section');
    if (!section) return;

    let sourceType = "General Webpage";
    let structureQuality = "Medium";
    let recStrategy = "recursive";
    let reason = "This general webpage has standard flow and structure. Recursive character chunking is recommended to preserve sentence and paragraph boundaries during segmentation.";

    if (preDefinedKey && websiteSamples[preDefinedKey]) {
        const sample = websiteSamples[preDefinedKey];
        sourceType = sample.type;
        structureQuality = sample.structure;
        recStrategy = sample.strategy;
        reason = sample.reason;
    } else {
        const urlLower = (url || "").toLowerCase();
        const textLower = (text || "").toLowerCase();

        // Count markdown headers and numbered sections
        const h1h2Count = (text.match(/^#{1,3}\s+\S+/gm) || []).length;
        const numberedSecCount = (text.match(/^\d+(\.\d+)*\s+\S+/gm) || []).length;
        const hasHighStructure = h1h2Count > 2 || numberedSecCount > 2;

        if (urlLower.includes("docs") || urlLower.includes("documentation") || urlLower.includes("api") || urlLower.includes("developer") || hasHighStructure) {
            sourceType = "Technical Documentation";
            structureQuality = "High";
            recStrategy = "document";
            reason = "This content contains structured section headings or markdown dividers. Document-Structure Aware chunking is highly recommended as it aligns split boundaries with logical chapters, keeping API specs, tables, and component topics intact.";
        } else if (urlLower.includes("wikipedia.org") || urlLower.includes("wiki") || textLower.includes("wikipedia")) {
            sourceType = "Reference Article";
            structureQuality = "Medium";
            recStrategy = "semantic";
            reason = "Reference articles contain dense thematic prose and narrative flow. Semantic Similarity chunking is recommended to evaluate sentence-level semantic vector changes and split at natural topic transitions, avoiding arbitrary cutoffs.";
        } else if (urlLower.includes("blog") || urlLower.includes("post") || textLower.includes("blog")) {
            sourceType = "Blog Article";
            structureQuality = "Low";
            recStrategy = "recursive";
            reason = "Blog posts typically feature casual structures and sparse structural dividers. Recursive character chunking splits hierarchically on paragraphs and sentences, providing a highly reliable and performant baseline.";
        } else {
            if (text.length > 5000) {
                sourceType = "Long Form Article";
                structureQuality = "Medium";
                recStrategy = "semantic";
                reason = "This long-form text spans multiple topics. Semantic similarity chunking ensures text segments stay logically grouped by underlying topic shifts rather than formatting constraints.";
            } else {
                sourceType = "General Webpage";
                structureQuality = "Medium";
                recStrategy = "recursive";
                reason = "This standard webpage has clean prose. Recursive character chunking is recommended to keep sentence structures intact while maintaining fast segmentation latency.";
            }
        }
    }

    // Set UI elements
    const webSourceTypeEl = document.getElementById('web-analysis-source-type');
    const webStructureQualityEl = document.getElementById('web-analysis-structure-quality');
    const webRecStrategyEl = document.getElementById('web-analysis-recommended-strategy');
    const webReasonEl = document.getElementById('web-analysis-reason');

    if (webSourceTypeEl) webSourceTypeEl.textContent = sourceType;
    if (webStructureQualityEl) webStructureQualityEl.textContent = structureQuality;
    if (webRecStrategyEl) webRecStrategyEl.textContent = getStrategyLabel(recStrategy);
    if (webReasonEl) webReasonEl.textContent = reason;

    // Show the analysis section
    section.style.display = "block";
}

// Load website sample text and properties
function loadWebsiteSample(key) {
    const sample = websiteSamples[key];
    if (sample) {
        docPreviewText.innerText = sample.text;
        const badge = document.getElementById('doc-type-badge');
        if (badge) badge.textContent = "Web Page";
        activeDocumentOrigin = {
            type: 'web_url',
            name: sample.title || key,
            url: null
        };
        updateTextMetrics();
        analyzeDocument(sample.text);
        classifyWebContent(null, sample.text, key);
    }
}

// ==========================================================================
// MongoDB Ingestion Controller
// ==========================================================================

async function ingestCurrentChunksIntoMongoDB() {
    if (!currentChunkData || !currentChunkData.chunks || currentChunkData.chunks.length === 0) {
        alert("Please generate chunks first using 'Apply Chunking' before ingesting into MongoDB.");
        return;
    }

    const btnIngestMongo = document.getElementById('btn-ingest-mongodb');
    const btnIngestMongoSide = document.getElementById('btn-ingest-mongodb-side');
    const originalHeaderHtml = btnIngestMongo ? btnIngestMongo.innerHTML : '';
    const originalSideHtml = btnIngestMongoSide ? btnIngestMongoSide.innerHTML : '';

    try {
        if (btnIngestMongo) {
            btnIngestMongo.disabled = true;
            btnIngestMongo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ingesting...';
        }
        if (btnIngestMongoSide) {
            btnIngestMongoSide.disabled = true;
            btnIngestMongoSide.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ingesting...';
        }

        const strategy = strategySelect ? strategySelect.value : 'unknown';
        const docMetrics = {
            word_count: parseInt(previewWordCount?.textContent || 0, 10) || 0,
            char_count: parseInt(previewCharCount?.textContent || 0, 10) || 0,
            sentence_count: parseInt(previewSentenceCount?.textContent || 0, 10) || 0,
            paragraph_count: parseInt(previewParagraphCount?.textContent || 0, 10) || 0,
            estimated_tokens: parseInt(previewTokenCount?.textContent || 0, 10) || 0
        };

        const docName = activeDocumentOrigin.name || 'Current Document';
        let detectedType = activeDocumentOrigin.type || 'document';
        if (docName.toLowerCase().includes('resume') || docName.toLowerCase().includes('cv')) {
            detectedType = 'resume';
        }

        const payload = {
            source_type: detectedType,
            document_name: docName,
            source_url: activeDocumentOrigin.url || null,
            strategy: strategy,
            strategy_params: {
                chunk_size: parseInt(paramChunkSize?.value || 500, 10),
                chunk_overlap: parseInt(paramOverlap?.value || 50, 10)
            },
            document_metrics: docMetrics,
            chunks: currentChunkData.chunks
        };

        const response = await fetch(`${BACKEND_URL}/mongodb/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `Ingestion failed with status ${response.status}`);
        }

        showMongoIngestionModal(result);

    } catch (err) {
        console.error("MongoDB Ingestion failed:", err);
        showMongoErrorModal(err.message);
    } finally {
        if (btnIngestMongo) {
            btnIngestMongo.disabled = false;
            btnIngestMongo.innerHTML = originalHeaderHtml;
        }
        if (btnIngestMongoSide) {
            btnIngestMongoSide.disabled = false;
            btnIngestMongoSide.innerHTML = originalSideHtml;
        }
    }
}

function showMongoIngestionModal(result) {
    const modal = document.getElementById('mongo-modal');
    const modalBody = document.getElementById('mongo-modal-body');
    if (!modal || !modalBody) return;

    const isResume = result.collection === 'resume_chunks' || result.source_type === 'resume';
    const isWeb = result.collection === 'web_url_chunks';
    
    let tagClass = 'mongo-collection-tag';
    let tagIcon = 'fa-file-lines';
    if (isResume) {
        tagClass = 'mongo-collection-tag resume';
        tagIcon = 'fa-id-card';
    } else if (isWeb) {
        tagClass = 'mongo-collection-tag web';
        tagIcon = 'fa-globe';
    }

    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 18px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0, 237, 100, 0.15); border: 2px solid #00ed64; color: #00ed64; display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 10px auto;">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: var(--text-primary);">Ingestion & Embedding Complete</h4>
            <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Each chunk has been stored as an individual MongoDB document with a 1,024-dimensional Mistral embedding.</p>
        </div>

        <div class="mongo-stat-card" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Target Collection</span>
                <span class="${tagClass}" style="font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 700;"><i class="fa-solid ${tagIcon}"></i> ${result.collection}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Storage Architecture</span>
                <span style="font-size: 11.5px; font-weight: 700; color: #38bdf8;"><i class="fa-solid fa-cubes-stacked"></i> Individual Chunk Documents</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Embedding Model</span>
                <span style="font-size: 11.5px; font-weight: 700; color: #f59e0b;"><i class="fa-solid fa-brain"></i> Mistral (1,024 Dimensions)</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Vector Search Status</span>
                <span style="font-size: 11.5px; font-weight: 700; color: #00ed64;"><i class="fa-solid fa-circle-check"></i> Ready (vector_index)</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Document Name</span>
                <span style="font-size: 11.5px; font-weight: 700; color: var(--text-primary); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(result.document_name)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Documents Ingested</span>
                <span style="font-size: 13px; font-weight: 800; color: #00ed64;">${result.chunk_count} Documents</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">First Inserted ID</span>
                <span class="mongo-id-code" style="font-size: 11px;">${result.inserted_id || 'Batch Inserted'}</span>
            </div>
        </div>

        <!-- Quick Vector Search Verification Panel -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--text-primary);"><i class="fa-solid fa-magnifying-glass-chart" style="color: #38bdf8;"></i> Verify Vector Search</span>
                <span style="font-size: 10.5px; color: var(--text-muted);">1,024-d Cosine Similarity</span>
            </div>
            <div style="display: flex; gap: 6px;">
                <input type="text" id="modal-vector-search-input" placeholder="e.g. Automation QA with Selenium..." value="" style="flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 12px;">
                <button type="button" id="btn-modal-test-vector-search" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                    <i class="fa-solid fa-play"></i> Search
                </button>
            </div>
            <div id="modal-vector-search-results" style="margin-top: 8px; max-height: 140px; overflow-y: auto; display: none;"></div>
        </div>
    `;

    // Hook up vector search test button inside the modal
    const btnTestSearch = document.getElementById('btn-modal-test-vector-search');
    const searchInput = document.getElementById('modal-vector-search-input');
    const resultsContainer = document.getElementById('modal-vector-search-results');

    if (btnTestSearch && searchInput && resultsContainer) {
        btnTestSearch.addEventListener('click', async () => {
            const query = searchInput.value.trim();
            if (!query) {
                alert('Please enter a search query to test vector search.');
                return;
            }

            btnTestSearch.disabled = true;
            btnTestSearch.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `<div style="text-align: center; padding: 8px; color: var(--text-muted); font-size: 11px;">Generating 1,024-d query embedding & searching...</div>`;

            try {
                const searchRes = await fetch(`${BACKEND_URL}/mongodb/vector-search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: query,
                        collection_name: result.collection,
                        source_type: result.source_type,
                        top_k: 2
                    })
                });

                const data = await searchRes.json();
                if (!searchRes.ok) throw new Error(data.detail || 'Search request failed');

                const chunks = data.chunks || [];
                if (chunks.length === 0) {
                    resultsContainer.innerHTML = `<div style="padding: 6px; font-size: 11.5px; color: var(--text-muted); text-align: center;">No matching chunks found.</div>`;
                } else {
                    let html = '';
                    chunks.forEach((c, i) => {
                        const scorePct = Math.round((c.score || 0) * 100);
                        html += `
                            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 6px; padding: 8px; margin-bottom: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: #38bdf8;">Chunk #${c.chunk_id || (i+1)}</span>
                                    <span style="font-size: 11px; font-weight: 800; color: #00ed64;">Score: ${(c.score || 0).toFixed(4)} (${scorePct}%)</span>
                                </div>
                                <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; max-height: 48px; overflow: hidden; text-overflow: ellipsis;">
                                    ${escapeHTML(c.text || '')}
                                </div>
                            </div>
                        `;
                    });
                    resultsContainer.innerHTML = html;
                }
            } catch (err) {
                resultsContainer.innerHTML = `<div style="padding: 6px; font-size: 11.5px; color: #fca5a5;">Error: ${escapeHTML(err.message)}</div>`;
            } finally {
                btnTestSearch.disabled = false;
                btnTestSearch.innerHTML = `<i class="fa-solid fa-play"></i> Search`;
            }
        });
    }

    modal.style.display = 'flex';
}

function showMongoErrorModal(errorMessage) {
    const modal = document.getElementById('mongo-modal');
    const modalBody = document.getElementById('mongo-modal-body');
    if (!modal || !modalBody) {
        alert(`MongoDB Error: ${errorMessage}`);
        return;
    }


    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid var(--danger); color: var(--danger); display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 12px auto;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: var(--text-primary);">MongoDB Connection Required</h4>
            <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Could not connect to MongoDB server to complete ingestion.</p>
        </div>

        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 12px; margin-bottom: 14px;">
            <p style="margin: 0; font-size: 12px; color: #fca5a5; line-height: 1.4;">${escapeHTML(errorMessage)}</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 11.5px; color: var(--text-muted); line-height: 1.5;">
            <b style="color: var(--text-primary); display: block; margin-bottom: 4px;"><i class="fa-solid fa-circle-info"></i> How to connect:</b>
            1. Ensure local MongoDB service is running (e.g. <code>net start MongoDB</code> or <code>mongod</code>).<br/>
            2. Or set environment variable <code>MONGODB_URI</code> to your MongoDB connection string.
        </div>
    `;

    modal.style.display = 'flex';
}





