import io
import pypdf

def read_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from PDF file bytes.
    """
    pdf_file = io.BytesIO(file_bytes)
    reader = pypdf.PdfReader(pdf_file)
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)
