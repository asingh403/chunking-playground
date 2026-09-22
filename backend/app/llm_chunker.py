import time
import re
import json
import requests

class LLMSimulationEngine:
    """
    Simulates high-fidelity LLM chunking when no API key is present.
    Recognizes document domains and splits them into logical chunks with
    realistic topics, titles, and boundary choice reasons.
    """
    @staticmethod
    def simulate(text: str) -> list:
        text_lower = text.lower()
        chunks = []
        
        # 1. Detect Domain
        if "leave policy" in text_lower or "sick leave" in text_lower:
            # HR Policy document
            segments = [
                {
                    "title": "Document Purpose and Scope",
                    "topic": "HR / Policy Preamble",
                    "text": "EMPLOYEE LEAVE POLICY AND GUIDELINES\n\n1. Purpose and Scope\nThis policy outlines the guidelines and procedures governing various types of leave available to all full-time employees. The company believes that balance between professional and personal life is essential for productivity and well-being.",
                    "reason": "Document introduction and policy objectives boundary division."
                },
                {
                    "title": "Annual Paid Time Off Allocation",
                    "topic": "HR / PTO Rules",
                    "text": "2. Annual Paid Time Off (PTO)\nAll full-time employees accumulate PTO at a rate of 1.67 days per month, resulting in a total of 20 days per calendar year. \n- PTO requests must be submitted at least 5 business days in advance for approval by the department manager.\n- A maximum of 5 unused PTO days may be carried over to the next calendar year. Any additional unused days will expire.",
                    "reason": "Transition from introductory scope to annual PTO accrual details."
                },
                {
                    "title": "Paid Sick Leave Policies",
                    "topic": "HR / Sick Leave",
                    "text": "3. Sick Leave\nEmployees receive 10 paid sick days per year on January 1st. Sick leave is intended for personal illness, medical appointments, or caring for immediate family members.\n- If sick leave exceeds 3 consecutive days, a certified medical note from a qualified physician is required.",
                    "reason": "Subject matter change separating PTO from sick leave rules and certification."
                },
                {
                    "title": "Parental Leave Guidelines",
                    "topic": "HR / Parental Benefits",
                    "text": "4. Parental Leave\nThe company provides up to 12 weeks of paid parental leave to eligible employees following the birth, adoption, or foster placement of a child. Employees must have completed at least one year of continuous service to qualify.\n- Parental leave runs concurrently with FMLA guidelines where applicable.",
                    "reason": "Thematic shift from medical sick leave to family and parental care leave programs."
                }
            ]
            # Ensure text matches somewhat
            for seg in segments:
                if any(phrase in text for phrase in ["Leave Policy", "Annual Paid Time Off", "Sick Leave", "Parental Leave"]):
                    chunks.append(seg)
            if chunks:
                return chunks

        if "mortgage" in text_lower or "personal loan" in text_lower:
            # Banking document
            segments = [
                {
                    "title": "Personal Loan Tiers and Eligibility",
                    "topic": "Banking / Personal Lending",
                    "text": "BANKING LOAN POLICY AND ELIGIBILITY GUIDELINES\n\n1. Personal Loan Eligibility\nAll personal loan applicants must have a minimum credit score of 650. Interest rates are determined by credit score tiers:\n- Tier 1 (750+): 5.5% APR\n- Tier 2 (680-749): 7.2% APR\n- Tier 3 (650-679): 9.5% APR\nApplicants must provide their most recent 3 months of pay stubs and tax statements.",
                    "reason": "Document header and personal loan credit scoring guidelines."
                },
                {
                    "title": "Mortgage and Home Lending Policies",
                    "topic": "Banking / Home Lending",
                    "text": "2. Home Loan Policy\nHome loans require a minimum down payment of 10% of the purchase price.\n- Mortgage rates are fixed for 15 or 30 years.\n- Borrowers must maintain debt-to-income (DTI) ratios under 43% to qualify.\n- Co-signers are permitted for applicants with insufficient income but good credit.",
                    "reason": "Logical boundary division separating unsecured personal lending from secured mortgage lending."
                },
                {
                    "title": "Credit Card Eligibility Guidelines",
                    "topic": "Banking / Cards & Retail",
                    "text": "3. Credit Card Guidelines\nCredit cards are offered to customers with established banking history of at least 6 months.\n- Classic Card: Credit limit up to $5,000, 18.9% APR.\n- Gold Card: Credit limit up to $15,000, 14.9% APR.\n- Platinum Card: Credit limit up to $50,000, 11.9% APR, requires $100k minimum annual income.",
                    "reason": "Thematic shift from long-term real estate mortgages to short-term revolving credit card limits."
                }
            ]
            for seg in segments:
                if any(phrase in text for phrase in ["Personal Loan", "Home Loan Policy", "Credit Card"]):
                    chunks.append(seg)
            if chunks:
                return chunks

        if "residential lease" in text_lower or "tenant agrees" in text_lower:
            # Legal Agreement
            segments = [
                {
                    "title": "Agreement Preamble & Premises Lease",
                    "topic": "Legal / Preamble & Term",
                    "text": "RESIDENTIAL LEASE AGREEMENT\n\nThis Agreement is made on January 1, 2026, between the Landlord (Admin Property Corp) and the Tenant (John Doe).\n\n1. Definitions and Term\nThe leased premises are located at Apt 4B, 100 Broadway, New York. The lease term shall be for 12 months, commencing January 1, 2026, and ending December 31, 2026.",
                    "reason": "Identifies the contracting parties and details of the lease duration."
                },
                {
                    "title": "Rent and Escrow Payment Terms",
                    "topic": "Legal / Financial Obligations",
                    "text": "2. Rent and Payment Terms\nTenant agrees to pay a monthly rent of $2,500, due on the 1st of each calendar month.\n- A late fee of $100 will be assessed for payments received after the 5th.\n- A security deposit of $2,500 is due upon signing this contract, held in an escrow account.",
                    "reason": "Thematic division between general term definitions and lease financial obligations."
                }
            ]
            for seg in segments:
                if any(phrase in text for phrase in ["LEASE AGREEMENT", "Definitions and Term", "Rent and Payment"]):
                    chunks.append(seg)
            if chunks:
                return chunks

        if "patient presents" in text_lower or "appendectomy" in text_lower:
            # Medical Report
            segments = [
                {
                    "title": "Patient Demographics and Intake Info",
                    "topic": "Healthcare / Patient Demographics",
                    "text": "PATIENT CLINICAL REPORT\n\nPatient Section:\nName: Jane Smith\nAge: 34\nGender: Female\nAdmitted: June 8, 2026",
                    "reason": "Intake metadata division representing the patient profile."
                },
                {
                    "title": "Clinical Diagnosis and Lab Details",
                    "topic": "Healthcare / Diagnosis & Lab",
                    "text": "Diagnosis Section:\nPatient presents with severe acute abdominal pain localized in the lower right quadrant.\n- Ultrasound indicates inflamed appendix.\n- White blood cell count elevated at 14,500/mcL, confirming acute appendicitis.",
                    "reason": "Transition from demographic details to clinical examination findings and medical diagnosis."
                },
                {
                    "title": "Treatment Plan and Post-Op Care",
                    "topic": "Healthcare / Treatment Plan",
                    "text": "Treatment Section:\nSchedule emergency laparoscopic appendectomy immediately.\n- Post-operative care includes IV fluids, pain management (Morphine), and antibiotics (Cefazolin).\n- Patient is expected to be discharged within 24-48 hours post-op.",
                    "reason": "Shift from diagnostics to active surgical intervention and recovery plan."
                }
            ]
            for seg in segments:
                if any(phrase in text for phrase in ["Patient Section", "Diagnosis Section", "Treatment Section"]):
                    chunks.append(seg)
            if chunks:
                return chunks

        if "frequently asked questions" in text_lower or "q:" in text_lower:
            # FAQ
            paragraphs = text.split("\n\n")
            for idx, para in enumerate(paragraphs):
                if para.strip():
                    chunks.append({
                        "title": f"FAQ Question #{idx}",
                        "topic": "FAQ / Q&A",
                        "text": para.strip(),
                        "reason": f"Split at paragraph Q&A block boundary #{idx}."
                    })
            if chunks:
                return chunks

        # Fallback split logic by paragraphs
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for idx, para in enumerate(paragraphs):
            # Formulate title
            first_line = para.split("\n")[0]
            title = first_line[:40] + ("..." if len(first_line) > 40 else "")
            
            # Formulate topic
            words = [w for w in re.findall(r'\b\w{4,15}\b', para.lower()) if w not in ["this", "that", "with", "from", "have", "about"]]
            top_words = sorted(list(set(words)), key=lambda x: words.count(x), reverse=True)[:2]
            topic = " / ".join(top_words).title() if top_words else "General Context"
            
            chunks.append({
                "title": f"Logical Section: {title}",
                "topic": f"Document / {topic}",
                "text": para,
                "reason": f"Simulated LLM Boundary: Partitioned based on paragraph thematic shift #{idx + 1}."
            })
            
        return chunks


def chunk_llm_service(text: str, model: str = "llama3-8b-8192", api_key: str = None, simulated: bool = True) -> dict:
    """
    LLM-Based Intelligent Chunker.
    Splits document using Groq models (real API) or fallback simulation rules.
    Returns visual chunk structures including topics, titles, and boundary reasons.
    """
    start_time = time.perf_counter()
    
    if not text.strip():
        processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return {
            "chunks": [],
            "metrics": {
                "total_chunks": 0,
                "avg_size": 0.0,
                "processing_time_ms": processing_time_ms
            }
        }

    chunks = []
    is_real_call = (not simulated) and api_key and api_key.strip()
    
    if is_real_call:
        try:
            # Prepare System Prompts
            system_prompt = (
                "You are an expert document chunking service. Your task is to split the input text into logical, coherent chunks. "
                "Each chunk must represent a single subtopic or section of the document. "
                "For each chunk, you must output:\n"
                "1. 'title': A short descriptive title for the chunk.\n"
                "2. 'topic': A category or main topic label.\n"
                "3. 'text': The exact segment of text from the document. You must copy the text verbatim without summarizing, editing, or deleting any characters.\n"
                "4. 'reason': A detailed reason explaining why this chunk boundary was chosen (e.g. topic shift, list section change).\n\n"
                "You must return the output strictly as a JSON object containing a 'chunks' key, which maps to a list of these chunk objects."
            )
            
            # Map selected models to currently active models on Groq
            actual_model = model
            model_lower = model.lower()
            if "gpt-oss" in model_lower:
                actual_model = "llama-3.3-70b-versatile"
            elif "llama3-8b" in model_lower:
                actual_model = "llama-3.1-8b-instant"
            elif "llama3-70b" in model_lower:
                actual_model = "llama-3.3-70b-versatile"
            elif "mixtral" in model_lower:
                actual_model = "llama-3.3-70b-versatile"
            elif "gemma" in model_lower:
                actual_model = "llama-3.1-8b-instant"
            else:
                actual_model = "llama-3.1-8b-instant"
                
            payload = {
                "model": actual_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            
            headers = {
                "Authorization": f"Bearer {api_key.strip()}",
                "Content-Type": "application/json"
            }
            
            # Make direct HTTP request to Groq API
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                res_data = response.json()
                content_str = res_data["choices"][0]["message"]["content"]
                parsed_json = json.loads(content_str)
                
                if "chunks" in parsed_json:
                    for idx, item in enumerate(parsed_json["chunks"]):
                        chunks.append({
                            "index": idx + 1,
                            "title": item.get("title", f"Section #{idx + 1}"),
                            "topic": item.get("topic", "General Topic"),
                            "text": item.get("text", ""),
                            "length": len(item.get("text", "")),
                            "reason": item.get("reason", "LLM determined boundary split.")
                        })
            else:
                # If API call failed, raise exception with error details
                err_detail = response.text
                try:
                    err_json = response.json()
                    if "error" in err_json:
                        err_detail = err_json["error"].get("message", err_detail)
                except Exception:
                    pass
                raise Exception(f"Groq API Error (HTTP {response.status_code}): {err_detail}")
                
        except Exception as e:
            # Log error and raise to route
            raise Exception(f"LLM Chunking API Request Failed: {str(e)}")
            
    if not chunks:
        # Execute local simulation fallback
        sim_chunks = LLMSimulationEngine.simulate(text)
        for idx, item in enumerate(sim_chunks):
            chunks.append({
                "index": idx + 1,
                "title": item["title"],
                "topic": item["topic"],
                "text": item["text"],
                "length": len(item["text"]),
                "reason": item["reason"]
            })

    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 3)
    
    total_chunks = len(chunks)
    avg_size = round(sum(c["length"] for c in chunks) / total_chunks, 1) if total_chunks > 0 else 0.0
    
    # Prepend dynamic labels to simulated text so frontend highlights it
    if not is_real_call:
        for c in chunks:
            c["reason"] = f"[Simulated LLM] {c['reason']}"
            
    return {
        "chunks": chunks,
        "metrics": {
            "total_chunks": total_chunks,
            "avg_size": avg_size,
            "processing_time_ms": processing_time_ms
        },
        "simulated": not is_real_call
    }
