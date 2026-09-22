import os
import sys
import re
import json
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Theme Colors (Premium HSL-based palette converted to Hex)
PRIMARY = HexColor("#8b5cf6")      # Vibrant Purple
SECONDARY = HexColor("#14b8a6")    # Deep Teal
TEXT_DARK = HexColor("#0f172a")    # Slate 900
TEXT_MUTED = HexColor("#475569")   # Slate 600
LINE_COLOR = HexColor("#cbd5e1")   # Slate 300
BG_LIGHT = HexColor("#f8fafc")     # Slate 50
CALLOUT_BG = HexColor("#f0fdfa")   # Teal 50
CALLOUT_BORDER = HexColor("#99f6e4") # Teal 200

# Try to import load_from_json from session_manager; fall back if run stand-alone
try:
    from session_manager import load_from_json
except ImportError:
    def load_from_json(filename: str) -> dict:
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to calculate the total page count dynamically
    and draw consistent headers (featuring the Testleaf logo) and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        self.saveState()
        page_width, page_height = A4
        logo_path = os.path.join(os.path.dirname(__file__), "testleaf_logo.png")

        # ------------------ RUNNING HEADER ------------------
        # Left-aligned running title
        self.setFont("Helvetica-Bold", 9)
        self.setFillColor(PRIMARY)
        self.drawString(40, page_height - 35, "GenAI RAG Chunking - Training Study Guide")

        # Right-aligned Testleaf Logo (width=80, height=20)
        if os.path.exists(logo_path):
            try:
                self.drawImage(logo_path, page_width - 120, page_height - 42, width=80, height=20, mask='auto')
            except Exception:
                # Fallback if image loading fails
                self.setFont("Helvetica-Bold", 10)
                self.setFillColor(SECONDARY)
                self.drawRightString(page_width - 40, page_height - 35, "TESTLEAF")
        else:
            self.setFont("Helvetica-Bold", 10)
            self.setFillColor(SECONDARY)
            self.drawRightString(page_width - 40, page_height - 35, "TESTLEAF")

        # Header horizontal divider rule
        self.setStrokeColor(LINE_COLOR)
        self.setLineWidth(0.5)
        self.line(40, page_height - 50, page_width - 40, page_height - 50)

        # ------------------ RUNNING FOOTER ------------------
        # Footer rule
        self.line(40, 48, page_width - 40, 48)

        # Left-aligned Testleaf Slogan
        self.setFont("Helvetica-Oblique", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(40, 32, "Testleaf - Always Ahead")

        # Right-aligned Page numbering: Page X of Y
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica", 8)
        self.drawRightString(page_width - 40, 32, page_str)

        self.restoreState()


# Fallback teaching content dictionary in case parsing frontend/app.js fails
FALLBACK_TEACHING_CONTENT = {
    'fixed': {
        'title': "Fixed-Size Character Chunking",
        'definition': "Splits text into chunks of exact character lengths with a specific overlap. It is the most basic, straightforward strategy.",
        'advantages': ["Extremely fast to compute and implement.", "Guarantees predictability in token consumption.", "No dependencies on external NLP libraries or models."],
        'disadvantages': ["Completely ignores natural language structures (words, sentences, paragraphs).", "Often breaks sentences and words in half, leading to semantic fragmentation.", "Can cause significant context loss if overlap is set too low."],
        'useCases': ["Splitting a large PDF into smaller pieces before sending it to an AI model.", "Breaking long policy documents into equal-sized chunks for quick testing."],
        'industryExamples': ["Company HR policy documents.", "Bank terms and conditions documents."],
        'whyCompaniesUseIt': ["Very easy to implement.", "Fast processing for large documents."],
        'bestPractices': ["Configure an overlap of 10% to 20% of the chunk size to capture split context.", "Use larger chunk sizes to lower the risk of word breaking."],
        'commonMistakes': ["Setting overlap to 0, which guarantees truncated sentences at chunk boundaries.", "Using small chunks (<200 characters) on highly structured documents like contracts."],
        'interviewQuestions': [{'q': "Why is fixed-size chunking considered a fallback strategy in production RAG?", 'a': "It does not respect semantic boundaries (like sentences or paragraphs), meaning words are cut off mid-character or key ideas are split, degrading the quality of generated vector embeddings."}]
    }
}


def parse_teaching_content() -> dict:
    """
    Parses the teachingContent JavaScript object from frontend/app.js dynamically
    using regular expressions to avoid duplication of advantages, disadvantages,
    best practices, use cases, etc.
    """
    app_js_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/app.js"))
    if not os.path.exists(app_js_path):
        return FALLBACK_TEACHING_CONTENT
        
    try:
        with open(app_js_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Match using flexible whitespace regex
        match = re.search(r'const teachingContent\s*=\s*\{(.*?)\};\s*// Initialize Application', content, re.DOTALL)
        if not match:
            return FALLBACK_TEACHING_CONTENT
            
        block = match.group(1)
        
        strategies = {}
        strategy_matches = re.finditer(r"'([a-zA-Z0-9_-]+)'\s*:\s*\{", block)
        
        starts = []
        names = []
        for m in strategy_matches:
            starts.append(m.start())
            names.append(m.group(1))
        starts.append(len(block))
        
        for i in range(len(names)):
            name = names[i]
            sub_block = block[starts[i]:starts[i+1]]
            
            strategies[name] = {}
            
            # Title
            title_m = re.search(r'title:\s*["\'](.*?)["\']', sub_block)
            if title_m:
                strategies[name]['title'] = title_m.group(1)
                
            # Definition
            def_m = re.search(r'definition:\s*["\'](.*?)["\']', sub_block)
            if def_m:
                strategies[name]['definition'] = def_m.group(1)
                
            # Lists
            list_fields = ['advantages', 'disadvantages', 'useCases', 'industryExamples', 'whyCompaniesUseIt', 'bestPractices', 'commonMistakes']
            for field in list_fields:
                field_m = re.search(rf'{field}:\s*\[(.*?)\]', sub_block, re.DOTALL)
                if field_m:
                    list_str = field_m.group(1)
                    items = []
                    for item in re.finditer(r'["\'`](.*?)["\'`]', list_str, re.DOTALL):
                        # clean escape characters
                        cleaned = item.group(1).replace("\\n", "\n").replace('\\"', '"').replace("\\'", "'")
                        items.append(cleaned)
                    strategies[name][field] = items
                    
            # Interview Questions
            iq_m = re.search(r'interviewQuestions:\s*\[(.*?)\]', sub_block, re.DOTALL)
            if iq_m:
                iq_str = iq_m.group(1)
                questions = []
                for q_block in re.finditer(r'\{\s*q:\s*["\'](.*?)["\']\s*,\s*a:\s*["\'](.*?)["\']\s*\}', iq_str, re.DOTALL):
                    questions.append({
                        'q': q_block.group(1),
                        'a': q_block.group(2)
                    })
                strategies[name]['interviewQuestions'] = questions
                
        return strategies
    except Exception:
        return FALLBACK_TEACHING_CONTENT


def create_strategy_section_dynamic(strat_name, data, example_text, styles):
    """
    Dynamically generates ReportLab flowables for a strategy block, taking
    advantages, disadvantages, definitions, use cases, best practices,
    common mistakes, and interview Q&As from parsed codebase content.
    """
    elems = []
    
    # Strategy numbers formatting
    strat_numbers = {
        'fixed': '1',
        'recursive': '2',
        'document': '3',
        'semantic': '4',
        'query': '5',
        'metadata': '6',
        'llm': '7',
        'agentic': '8'
    }
    num = strat_numbers.get(strat_name, '•')
    title_text = f"{num}. {data.get('title', strat_name.capitalize())}"
    
    # Strategy Title (H2)
    elems.append(Paragraph(title_text, styles['StrategyTitle']))
    
    # Definition
    definition = data.get('definition', 'No definition provided.')
    elems.append(Paragraph(f"<b>Definition:</b> {definition}", styles['BodyTextCustom']))
    
    # Visual Chunking Pattern / Text Segment Splits
    if example_text:
        elems.append(Paragraph("<b>Visual Chunking Pattern / Text Segment Splits:</b>", styles['SubLabelStyle']))
        elems.append(Paragraph(example_text, styles['CodeBlockStyle']))
        
    # Advantages & Use Cases vs Disadvantages & Limitations Table
    advantages = data.get('advantages', [])
    disadvantages = data.get('disadvantages', [])
    use_cases = data.get('useCases', [])
    
    adv_html = "<br/>".join([f"• {adv}" for adv in advantages])
    if use_cases:
        adv_html += "<br/><br/><b>Real-World Use Cases:</b><br/>" + "<br/>".join([f"• {uc}" for uc in use_cases])
        
    dis_html = "<br/>".join([f"• {dis}" for dis in disadvantages])
    
    table_data = [
        [
            Paragraph("<b>Advantages & Use Cases</b>", styles['TableHeaderStyle']),
            Paragraph("<b>Disadvantages & Limitations</b>", styles['TableHeaderStyle'])
        ],
        [
            Paragraph(adv_html, styles['TableCellStyle']),
            Paragraph(dis_html, styles['TableCellStyle'])
        ]
    ]
    
    dec_table = Table(table_data, colWidths=[250, 265])
    dec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), HexColor("#f1f5f9")),
        ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,1), (0,1), HexColor("#f0fdf4")),  # Light green bg
        ('BACKGROUND', (1,1), (1,1), HexColor("#fef2f2")),  # Light red bg
    ]))
    
    elems.append(dec_table)
    elems.append(Spacer(1, 10))
    
    # Best Practices vs Common Mistakes
    best_practices = data.get('bestPractices', [])
    common_mistakes = data.get('commonMistakes', [])
    
    if best_practices or common_mistakes:
        bp_html = "<br/>".join([f"• {bp}" for bp in best_practices]) if best_practices else "None specified."
        cm_html = "<br/>".join([f"• {cm}" for cm in common_mistakes]) if common_mistakes else "None specified."
        
        bp_table_data = [
            [
                Paragraph("<b>Best Practices</b>", styles['TableHeaderStyle']),
                Paragraph("<b>Common Mistakes</b>", styles['TableHeaderStyle'])
            ],
            [
                Paragraph(bp_html, styles['TableCellStyle']),
                Paragraph(cm_html, styles['TableCellStyle'])
            ]
        ]
        
        bp_table = Table(bp_table_data, colWidths=[250, 265])
        bp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (1,0), HexColor("#e2e8f0")),
            ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
            ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BACKGROUND', (0,1), (0,1), HexColor("#ecfdf5")),  # Green tint
            ('BACKGROUND', (1,1), (1,1), HexColor("#fff1f2")),  # Red tint
        ]))
        
        elems.append(bp_table)
        elems.append(Spacer(1, 10))
        
    # Corporate Adoption and Implementations Callout
    ind_examples = data.get('industryExamples', [])
    why_companies = data.get('whyCompaniesUseIt', [])
    
    if ind_examples or why_companies:
        corp_text = ""
        if ind_examples:
            corp_text += "<b>Industry Implementations & Tools:</b> " + ", ".join(ind_examples)
        if why_companies:
            if corp_text:
                corp_text += "<br/><br/>"
            corp_text += "<b>Why Enterprises Adopt It:</b> " + " ".join(why_companies)
            
        if corp_text:
            elems.append(Paragraph(corp_text, styles['CalloutBox']))
            
    # Interview Prep Q&A Subsection
    interview_qs = data.get('interviewQuestions', [])
    if interview_qs:
        elems.append(Paragraph("<b>Classroom & Interview Preparation Q&A:</b>", styles['SubLabelStyle']))
        for iq in interview_qs:
            q_text = f"<b>Q: {iq.get('q', '')}</b>"
            a_text = f"<i>A:</i> {iq.get('a', '')}"
            elems.append(Paragraph(q_text, styles['QStyle']))
            elems.append(Paragraph(a_text, styles['AStyle']))
            elems.append(Spacer(1, 4))
            
    elems.append(Spacer(1, 15))
    return elems


def generate_study_guide(output_filename):
    """
    Compiles the study guide PDF and saves it at output_filename.
    """
    # Initialize Document with standard margins fitting the NumberedCanvas headers/footers
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=80,
        bottomMargin=70
    )

    # Styles Setup
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-BoldOblique',
        fontSize=12,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=20
    ))
    
    styles.add(ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'StrategyTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        'SubLabelStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED,
        spaceBefore=4,
        spaceAfter=3,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'CodeBlockStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=HexColor("#334155"),
        backColor=BG_LIGHT,
        borderColor=LINE_COLOR,
        borderWidth=0.5,
        borderPadding=8,
        spaceAfter=10,
        spaceBefore=4
    ))

    styles.add(ParagraphStyle(
        'CalloutBox',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_MUTED,
        backColor=CALLOUT_BG,
        borderColor=CALLOUT_BORDER,
        borderWidth=0.5,
        borderPadding=10,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        'TableHeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=TEXT_DARK
    ))

    styles.add(ParagraphStyle(
        'TableCellStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK
    ))

    styles.add(ParagraphStyle(
        'QStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY,
        spaceBefore=3,
        spaceAfter=2,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'AStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK,
        spaceAfter=4
    ))

    story = []

    # =========================================================================
    # HEADER / TITLE BLOCK
    # =========================================================================
    story.append(Paragraph("Retrieval-Augmented Generation (RAG) Chunking Strategies", styles['DocTitle']))
    story.append(Paragraph("A Comprehensive Study & Decision Guide for Document Segmentation", styles['DocSubtitle']))
    
    # Callout intro
    intro_html = (
        "<b>Core Concept:</b> In RAG systems, large documents must be split into smaller blocks (chunks) "
        "before being converted into vector embeddings and indexed. The choice of chunking strategy directly "
        "determines the performance, accuracy, and retrieval cost of your Large Language Model (LLM) pipeline. "
        "A poor strategy results in lost context, fragmented meanings, and bloated token costs, while an optimized "
        "strategy retrieves highly accurate, contextual answers."
    )
    story.append(Paragraph(intro_html, styles['CalloutBox']))
    
    # Why is chunking important?
    story.append(Paragraph("Why is Chunking Critical in RAG?", styles['SectionH1']))
    why_text = (
        "1. <b>Context Window Limits:</b> LLMs have physical constraints on input sizes. Proper chunking fits content cleanly.<br/>"
        "2. <b>Search Relevance:</b> Vector databases retrieve matching segments based on semantic similarity. Smaller, coherent chunks ensure the database retrieves only relevant information, ignoring irrelevant noise.<br/>"
        "3. <b>Token Economy:</b> Injecting entire multi-page manuals for simple queries is highly expensive and slow. Chunking minimizes LLM generation fees.<br/>"
        "4. <b>Semantic Continuity:</b> Sentences and tables must be kept intact so their logical relationships are not severed."
    )
    story.append(Paragraph(why_text, styles['BodyTextCustom']))
    story.append(Spacer(1, 10))

    # =========================================================================
    # STRATEGY DEEP-DIVES (PARSED DYNAMICALLY FROM APP.JS)
    # =========================================================================
    story.append(Paragraph("Detailed Chunking Strategies", styles['SectionH1']))
    
    parsed_teaching = parse_teaching_content()
    
    # Map visual examples
    fixed_example = (
        "Text: 'In RAG, chunking is necessary. It prevents exceeding context boundaries.'<br/>"
        "Settings: Chunk Size = 30, Overlap = 10<br/>"
        "<font color='#8b5cf6'><b>[Chunk 1]</b></font>: 'In RAG, chunking is <font color='#14b8a6'><b>necessary.</b></font>'<br/>"
        "<font color='#8b5cf6'><b>[Chunk 2]</b></font>: '<font color='#14b8a6'><b>necessary.</b></font> It prevents excee'"
    )
    rec_example = (
        "Paragraph A text goes here.\\n\\nParagraph B text is long.\\n"
        "Separator: Double Newline (\\n\\n) -> Splitting at paragraph boundaries first.<br/>"
        "<font color='#8b5cf6'><b>[Chunk 1]</b></font>: Paragraph A text content.<br/>"
        "<font color='#8b5cf6'><b>[Chunk 2]</b></font>: Paragraph B text content."
    )
    doc_example = (
        "Markdown:<br/>"
        "# 1. Policies<br/>"
        "HR rules go here.<br/>"
        "## 1.1 Leave Policy<br/>"
        "Casual leave rules.<br/>"
        "Splits at heading structures:<br/>"
        "<font color='#8b5cf6'><b>[Chunk 1 (H1)]</b></font>: Policies - HR rules go here.<br/>"
        "<font color='#8b5cf6'><b>[Chunk 2 (H2)]</b></font>: Leave Policy - Casual leave rules."
    )
    sem_example = (
        "Sentence 1: 'FastAPI is a Python web framework.'<br/>"
        "Sentence 2: 'It supports asynchronous requests.' (Similarity: 0.82)<br/>"
        "Sentence 3: 'Apples are rich in fiber.' (Similarity: 0.15)<br/>"
        "<font color='#8b5cf6'><b>[Chunk 1]</b></font>: FastAPI is a Python web framework. It supports async requests.<br/>"
        "<font color='#8b5cf6'><b>[Chunk 2]</b></font>: Apples are rich in fiber."
    )
    query_example = (
        "Query: 'Maternity Leave'<br/>"
        "Text: 'General leaves are 12 days. Maternity leaves are 90 days. Insurance covers childbirth.'<br/>"
        "<font color='#8b5cf6'><b>[Optimized Chunk]</b></font>: 'Maternity leaves are 90 days. Insurance covers childbirth.'"
    )
    meta_example = (
        "<font color='#8b5cf6'><b>[Chunk 1 Text]</b></font>:<br/>"
        "<i>[Source: handbook.pdf | Section: Benefits | Page: 4]</i><br/>"
        "Dental coverage is up to $1500 annually per employee."
    )
    rec_llm_example = (
        "LLM Prompt: Insert [SPLIT] where topic changes.<br/>"
        "Input: 'Python is great. [LLM identifies shift] Let us review Java.'<br/>"
        "<font color='#8b5cf6'><b>[Chunk 1]</b></font>: Python is great.<br/>"
        "<font color='#8b5cf6'><b>[Chunk 2]</b></font>: Let us review Java."
    )
    agent_example = (
        "Agent 1 (Splitter): Proposes split at character 1000.<br/>"
        "Agent 2 (Reviewer): 'Warning: this cuts off the exception clause. Move boundary to char 1120.'<br/>"
        "<font color='#8b5cf6'><b>[Final Output]</b></font>: Split moved to 1120."
    )

    strategy_visual_examples = {
        'fixed': fixed_example,
        'recursive': rec_example,
        'document': doc_example,
        'semantic': sem_example,
        'query': query_example,
        'metadata': meta_example,
        'llm': rec_llm_example,
        'agentic': agent_example
    }

    # Append strategy sections dynamically
    for s_name in ['fixed', 'recursive', 'document', 'semantic', 'query', 'metadata', 'llm', 'agentic']:
        if s_name in parsed_teaching:
            strat_flowables = create_strategy_section_dynamic(
                s_name, 
                parsed_teaching[s_name], 
                strategy_visual_examples.get(s_name, ""), 
                styles
            )
            story.extend(strat_flowables)

    # Page Break before Agentic workflow deep dive
    story.append(PageBreak())

    # Agentic Workflow (LangGraph) Training Features
    story.append(Paragraph("Agentic Workflow (LangGraph) Training Features", styles['SectionH1']))
    agent_training_text = (
        "The Chunking Playground features an interactive, classroom-ready **Agentic Workflow training dashboard** "
        "designed to explain how autonomous LLM agents make partition decisions. It highlights 6 key pedagogical components:<br/><br/>"
        "1. <b>Strategy Selection Analysis:</b> Shows suitability scores (0 to 100) for all candidate strategies. "
        "Students see which strategy graded highest and why.<br/>"
        "2. <b>Why Other Strategies Were Not Selected:</b> Explains the logical reasons alternative methods were skipped (e.g., "
        "skipping semantic chunking for very small files due to embedding computation overhead).<br/>"
        "3. <b>Confidence Level Visualization:</b> Displays certainty ratings categorized into High (90–100%), "
        "Medium (70–89%), and Low (below 70%) confidence tiers, accompanied by visual progress bar indicators.<br/>"
        "4. <b>Agent Thinking Timeline:</b> Traces the 6 chronological states of the LangGraph loop (Document Upload, "
        "Classification, Evaluation, Strategy Selection, Splitting Execution, and Quality Grading).<br/>"
        "5. <b>Learner Insight Panel:</b> Evaluates document properties in plain language, detailing document type, "
        "structure density (High/Moderate/Low), complexity levels, and the reasoning behind the recommendation.<br/>"
        "6. <b>Flowchart Node Tooltips:</b> Interactive help points beside Classifier Node, Decision Router Node, "
        "Chunking Node, and Evaluation Node, clarifying their respective roles in the pipeline."
    )
    story.append(Paragraph(agent_training_text, styles['BodyTextCustom']))
    story.append(Spacer(1, 10))

    # Page Break
    story.append(PageBreak())

    # =========================================================================
    # SUMMARY MATRIX TABLE
    # =========================================================================
    story.append(Paragraph("Comparison Matrix of Chunking Strategies", styles['SectionH1']))
    matrix_intro = (
        "Review this comparative reference table to select the most appropriate strategy for your RAG "
        "training curriculum:"
    )
    story.append(Paragraph(matrix_intro, styles['BodyTextCustom']))
    story.append(Spacer(1, 6))

    matrix_headers = [
        Paragraph("<b>Strategy</b>", styles['TableHeaderStyle']),
        Paragraph("<b>Complexity</b>", styles['TableHeaderStyle']),
        Paragraph("<b>Context Preservation</b>", styles['TableHeaderStyle']),
        Paragraph("<b>Compute Cost</b>", styles['TableHeaderStyle']),
        Paragraph("<b>Best Fit For</b>", styles['TableHeaderStyle'])
    ]

    matrix_rows = [
        matrix_headers,
        [Paragraph("Fixed-Size", styles['TableCellStyle']), Paragraph("Low", styles['TableCellStyle']), Paragraph("Poor", styles['TableCellStyle']), Paragraph("None (Instant)", styles['TableCellStyle']), Paragraph("Logs, plain txt", styles['TableCellStyle'])],
        [Paragraph("Recursive", styles['TableCellStyle']), Paragraph("Low-Medium", styles['TableCellStyle']), Paragraph("Moderate", styles['TableCellStyle']), Paragraph("Low", styles['TableCellStyle']), Paragraph("General text docs", styles['TableCellStyle'])],
        [Paragraph("Doc-Structure", styles['TableCellStyle']), Paragraph("Medium", styles['TableCellStyle']), Paragraph("High (Topic)", styles['TableCellStyle']), Paragraph("Low", styles['TableCellStyle']), Paragraph("Manuals, markdown", styles['TableCellStyle'])],
        [Paragraph("Semantic", styles['TableCellStyle']), Paragraph("High", styles['TableCellStyle']), Paragraph("Very High", styles['TableCellStyle']), Paragraph("Medium (Vector)", styles['TableCellStyle']), Paragraph("Transcripts, Q&A", styles['TableCellStyle'])],
        [Paragraph("Query-Aware", styles['TableCellStyle']), Paragraph("High", styles['TableCellStyle']), Paragraph("Excellent (Target)", styles['TableCellStyle']), Paragraph("Medium", styles['TableCellStyle']), Paragraph("Conversational Q&A", styles['TableCellStyle'])],
        [Paragraph("Metadata-Rich", styles['TableCellStyle']), Paragraph("Medium", styles['TableCellStyle']), Paragraph("High", styles['TableCellStyle']), Paragraph("Low-Medium", styles['TableCellStyle']), Paragraph("Multi-page manuals", styles['TableCellStyle'])],
        [Paragraph("LLM-Based", styles['TableCellStyle']), Paragraph("Very High", styles['TableCellStyle']), Paragraph("Excellent", styles['TableCellStyle']), Paragraph("High (API Fees)", styles['TableCellStyle']), Paragraph("High-value archives", styles['TableCellStyle'])],
        [Paragraph("Agentic (LangGraph)", styles['TableCellStyle']), Paragraph("Extreme", styles['TableCellStyle']), Paragraph("Optimal", styles['TableCellStyle']), Paragraph("Very High", styles['TableCellStyle']), Paragraph("Safety guidelines", styles['TableCellStyle'])],
    ]

    m_table = Table(matrix_rows, colWidths=[100, 75, 110, 100, 130])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor("#e2e8f0")),
        ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor("#ffffff"), BG_LIGHT])
    ]))
    story.append(m_table)
    story.append(Spacer(1, 15))

    # =========================================================================
    # RAG SIMULATION WORKFLOW
    # =========================================================================
    story.append(Paragraph("Retrieval-Augmented Generation (RAG) Workflow", styles['SectionH1']))
    workflow_text = (
        "Once documents are chunked and indexed into the vector store, the query/retrieval pipeline operates as follows:<br/><br/>"
        "<b>Step 1: Embedding the Query:</b> The user enters a question. This query is converted into a vector using the same embedding model.<br/>"
        "<b>Step 2: Vector Search:</b> The system compares the query vector with indexed chunk vectors using cosine similarity.<br/>"
        "<b>Step 3: Top-K Retrieval:</b> The top matching chunks are retrieved and assembled as prompt context.<br/>"
        "<b>Step 4: LLM Generation:</b> The prompt containing context + question is sent to the LLM to generate a clean, grounded answer."
    )
    story.append(Paragraph(workflow_text, styles['BodyTextCustom']))
    
    # =========================================================================
    # PART 2: ACTIVE WORKSPACE SESSION & ANALYSIS REPORT (DYNAMIC METRICS EXPORT)
    # =========================================================================
    metadata = load_from_json("metadata.json")
    if metadata:
        story.append(PageBreak())
        story.append(Paragraph("Active Workspace Session & Analysis Report", styles['SectionH1']))
        
        intro_workspace = (
            "This section contains the real-time data, metrics, and configurations currently active in the "
            "developer's sandbox workspace. Use this report to inspect current document profiles, selected "
            "chunk configurations, performance statistics, and semantic search queries."
        )
        story.append(Paragraph(intro_workspace, styles['BodyTextCustom']))
        story.append(Spacer(1, 10))
        
        # Document Profile Table
        story.append(Paragraph("Document Profile & Metadata", styles['StrategyTitle']))
        filename = metadata.get("filename", "unnamed_document")
        file_type = metadata.get("file_type", "unknown").upper()
        meta_stats = metadata.get("metadata", {})
        
        doc_table_data = [
            [Paragraph("<b>Metric</b>", styles['TableHeaderStyle']), Paragraph("<b>Value</b>", styles['TableHeaderStyle'])],
            [Paragraph("Document Name", styles['TableCellStyle']), Paragraph(filename, styles['TableCellStyle'])],
            [Paragraph("Ingestion Type", styles['TableCellStyle']), Paragraph(file_type, styles['TableCellStyle'])],
            [Paragraph("Word Count", styles['TableCellStyle']), Paragraph(str(meta_stats.get("word_count", "0")), styles['TableCellStyle'])],
            [Paragraph("Character Count", styles['TableCellStyle']), Paragraph(str(meta_stats.get("character_count", "0")), styles['TableCellStyle'])],
            [Paragraph("Sentence Count", styles['TableCellStyle']), Paragraph(str(meta_stats.get("sentence_count", "0")), styles['TableCellStyle'])],
            [Paragraph("Paragraph Count", styles['TableCellStyle']), Paragraph(str(meta_stats.get("paragraph_count", "0")), styles['TableCellStyle'])],
            [Paragraph("Estimated Tokens", styles['TableCellStyle']), Paragraph(str(meta_stats.get("estimated_tokens", "0")), styles['TableCellStyle'])],
        ]
        
        # HTML structure headings if it's a URL
        html_structure = metadata.get("html_structure", {})
        if html_structure:
            doc_table_data.append([Paragraph("HTML Heading 1 (H1) Count", styles['TableCellStyle']), Paragraph(str(html_structure.get("h1_count", "0")), styles['TableCellStyle'])])
            doc_table_data.append([Paragraph("HTML Heading 2 (H2) Count", styles['TableCellStyle']), Paragraph(str(html_structure.get("h2_count", "0")), styles['TableCellStyle'])])
            doc_table_data.append([Paragraph("HTML Paragraphs (P) Count", styles['TableCellStyle']), Paragraph(str(html_structure.get("p_count", "0")), styles['TableCellStyle'])])
            doc_table_data.append([Paragraph("HTML Tables Count", styles['TableCellStyle']), Paragraph(str(html_structure.get("table_count", "0")), styles['TableCellStyle'])])
            
        doc_table = Table(doc_table_data, colWidths=[200, 315])
        doc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (1,0), HexColor("#cbd5e1")),
            ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
            ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor("#ffffff"), BG_LIGHT]),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(doc_table)
        story.append(Spacer(1, 15))
        
        # Selected Chunker Results
        chunks = load_from_json("chunks.json")
        if chunks:
            story.append(Paragraph("Active Chunking Configuration & Output", styles['StrategyTitle']))
            strat = chunks.get("strategy", "None").capitalize()
            params = chunks.get("params", {})
            param_str = ", ".join([f"{k}: {v}" for k, v in params.items()])
            
            result_list = chunks.get("result", {})
            if isinstance(result_list, dict):
                chunk_items = result_list.get("chunks", [])
                metrics = result_list.get("metrics", {})
            else:
                chunk_items = result_list
                metrics = {}
                
            total_chunks = len(chunk_items)
            avg_size = metrics.get("avg_size", 0)
            proc_time = metrics.get("processing_time_ms", 0)
            
            if not avg_size and chunk_items:
                avg_size = sum(len(c.get("text", "")) for c in chunk_items) / len(chunk_items)
            
            config_table_data = [
                [Paragraph("<b>Parameter / Metric</b>", styles['TableHeaderStyle']), Paragraph("<b>Value</b>", styles['TableHeaderStyle'])],
                [Paragraph("Selected Strategy", styles['TableCellStyle']), Paragraph(strat, styles['TableCellStyle'])],
                [Paragraph("Input Configuration", styles['TableCellStyle']), Paragraph(param_str if param_str else "Default", styles['TableCellStyle'])],
                [Paragraph("Total Chunks Generated", styles['TableCellStyle']), Paragraph(str(total_chunks), styles['TableCellStyle'])],
                [Paragraph("Average Chunk Size (Chars)", styles['TableCellStyle']), Paragraph(f"{avg_size:.1f}" if isinstance(avg_size, (int, float)) else str(avg_size), styles['TableCellStyle'])],
                [Paragraph("Processing Latency (ms)", styles['TableCellStyle']), Paragraph(f"{proc_time:.1f}" if isinstance(proc_time, (int, float)) else str(proc_time), styles['TableCellStyle'])],
            ]
            
            config_table = Table(config_table_data, colWidths=[200, 315])
            config_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (1,0), HexColor("#cbd5e1")),
                ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
                ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor("#ffffff"), BG_LIGHT]),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(config_table)
            story.append(Spacer(1, 15))
            
            # Show top 3 sample chunks
            if chunk_items:
                story.append(Paragraph("Sample Chunk Segments (First 3 Chunks)", styles['SubLabelStyle']))
                for idx, item in enumerate(chunk_items[:3]):
                    ch_text = item.get("text", "")
                    ch_len = len(ch_text)
                    ch_meta = item.get("metadata", {})
                    meta_badge_str = ""
                    if ch_meta:
                        meta_badge_str = " | Metadata: " + ", ".join([f"{k}={v}" for k, v in ch_meta.items()])
                        
                    story.append(Paragraph(f"<b>Chunk #{idx+1}</b> (Length: {ch_len} chars{meta_badge_str})", styles['TableCellStyle']))
                    
                    display_text = ch_text[:400]
                    if len(ch_text) > 400:
                        display_text += "... [truncated]"
                        
                    story.append(Paragraph(display_text.replace("\n", "<br/>"), styles['CodeBlockStyle']))
                    story.append(Spacer(1, 5))
                story.append(Spacer(1, 10))
                
        # Comparison Statistics Table
        stats = load_from_json("stats.json")
        if stats:
            story.append(Paragraph("Strategy Comparison Benchmark Matrix", styles['StrategyTitle']))
            comp_intro = (
                "The table below shows comparative metrics generated during the sandbox batch evaluation. "
                "Each baseline strategy is executed against the active document text to compute counts, sizes, "
                "semantic coherence, retrieval relevance, and execution latency."
            )
            story.append(Paragraph(comp_intro, styles['BodyTextCustom']))
            story.append(Spacer(1, 6))
            
            comp_headers = [
                Paragraph("<b>Strategy</b>", styles['TableHeaderStyle']),
                Paragraph("<b>Count</b>", styles['TableHeaderStyle']),
                Paragraph("<b>Avg Size</b>", styles['TableHeaderStyle']),
                Paragraph("<b>Coherence</b>", styles['TableHeaderStyle']),
                Paragraph("<b>Retrieval Rel.</b>", styles['TableHeaderStyle']),
                Paragraph("<b>Latency (ms)</b>", styles['TableHeaderStyle']),
            ]
            
            comp_rows = [comp_headers]
            for s_name, s_data in stats.items():
                if "error" in s_data:
                    comp_rows.append([
                        Paragraph(s_name.capitalize(), styles['TableCellStyle']),
                        Paragraph("Error", styles['TableCellStyle']),
                        Paragraph("-", styles['TableCellStyle']),
                        Paragraph("-", styles['TableCellStyle']),
                        Paragraph("-", styles['TableCellStyle']),
                        Paragraph("-", styles['TableCellStyle']),
                    ])
                else:
                    comp_rows.append([
                        Paragraph(s_name.capitalize(), styles['TableCellStyle']),
                        Paragraph(str(s_data.get("chunk_count", 0)), styles['TableCellStyle']),
                        Paragraph(str(s_data.get("avg_size", 0.0)), styles['TableCellStyle']),
                        Paragraph(f"{s_data.get('coherence', 0.0):.4f}", styles['TableCellStyle']),
                        Paragraph(f"{s_data.get('retrieval_relevance', 0.0):.4f}", styles['TableCellStyle']),
                        Paragraph(f"{s_data.get('latency_ms', 0.0):.1f}", styles['TableCellStyle']),
                    ])
                    
            comp_table = Table(comp_rows, colWidths=[100, 60, 75, 90, 100, 90])
            comp_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), HexColor("#e2e8f0")),
                ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
                ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor("#ffffff"), BG_LIGHT])
            ]))
            story.append(comp_table)
            story.append(Spacer(1, 15))
            
        # Retrieval Simulation Results Table
        retrieval = load_from_json("retrieval_results.json")
        if retrieval and retrieval.get("result"):
            story.append(Paragraph("Retrieval Simulation Test Report", styles['StrategyTitle']))
            query_text = retrieval.get("query", "")
            r_type = retrieval.get("type", "standard").capitalize()
            res = retrieval.get("result", {})
            
            p_val = res.get("precision", 0)
            r_val = res.get("recall", 0)
            m_val = res.get("mean_similarity", 0)
            
            story.append(Paragraph(f"<b>Query Tested:</b> \"{query_text}\" (Type: {r_type} Retrieval)", styles['BodyTextCustom']))
            story.append(Spacer(1, 4))
            
            ret_metrics_data = [
                [Paragraph("<b>Precision</b>", styles['TableHeaderStyle']), Paragraph("<b>Recall</b>", styles['TableHeaderStyle']), Paragraph("<b>Mean Cosine Similarity</b>", styles['TableHeaderStyle'])],
                [Paragraph(f"{p_val*100:.0f}%" if isinstance(p_val, (int, float)) else str(p_val), styles['TableCellStyle']),
                 Paragraph(f"{r_val*100:.0f}%" if isinstance(r_val, (int, float)) else str(r_val), styles['TableCellStyle']),
                 Paragraph(f"{m_val:.4f}" if isinstance(m_val, (int, float)) else str(m_val), styles['TableCellStyle'])]
            ]
            ret_metrics_table = Table(ret_metrics_data, colWidths=[170, 170, 175])
            ret_metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), HexColor("#cbd5e1")),
                ('BORDER', (0,0), (-1,-1), 0.5, LINE_COLOR),
                ('INNERGRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(ret_metrics_table)
            story.append(Spacer(1, 10))
            
            # Top retrieved segments
            retrieved_items = res.get("retrieved", [])
            if retrieved_items:
                story.append(Paragraph("Retrieved Segments Matching Query (Top 3)", styles['SubLabelStyle']))
                for idx, r_item in enumerate(retrieved_items[:3]):
                    chunk_obj = r_item.get("chunk", {})
                    sim_score = r_item.get("similarity_score", 0.0)
                    match_score = r_item.get("metadata_match_score", 0.0)
                    confidence = r_item.get("retrieval_confidence", 0.0)
                    
                    scores_str = f"Similarity: {sim_score:.4f} | Confidence: {confidence:.4f}"
                    if match_score > 0:
                        scores_str += f" (Meta Boost: +{match_score:.2f})"
                        
                    story.append(Paragraph(f"<b>Retrieved Snippet #{idx+1}</b> ({scores_str})", styles['TableCellStyle']))
                    
                    txt = chunk_obj.get("text", "")
                    story.append(Paragraph(txt[:300] + "... [truncated]" if len(txt) > 300 else txt, styles['CodeBlockStyle']))
                    story.append(Spacer(1, 4))
    
    # Build Document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    # Test generation
    generate_study_guide("RAG_Chunking_Study_Guide.pdf")
    print("PDF generated successfully.")
