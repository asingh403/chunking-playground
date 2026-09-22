import io
import docx

def read_docx(file_bytes: bytes) -> str:
    """
    Extracts text from DOCX file bytes.
    """
    docx_file = io.BytesIO(file_bytes)
    doc = docx.Document(docx_file)
    text_parts = []
    for paragraph in doc.paragraphs:
        text_parts.append(paragraph.text)
    return "\n".join(text_parts)
