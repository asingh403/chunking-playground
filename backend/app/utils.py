import re
import tiktoken

def calculate_metadata(text: str) -> dict:
    """
    Calculates document statistics:
    - Word Count
    - Character Count
    - Sentence Count
    - Paragraph Count
    - Estimated Tokens (using tiktoken)
    """
    # Character count
    character_count = len(text)

    # Word count
    words = text.split()
    word_count = len(words)

    # Sentence count
    # Split on sentence-ending punctuation followed by space or end of line
    sentences = re.split(r'[.!?]+(?:\s+|$)', text)
    sentence_count = len([s for s in sentences if s.strip()])
    # Fallback to 1 sentence if text is non-empty but has no punctuation
    if sentence_count == 0 and text.strip():
        sentence_count = 1

    # Paragraph count
    # Split on double/multiple newlines
    paragraphs = re.split(r'\n\s*\n', text)
    paragraph_count = len([p for p in paragraphs if p.strip()])
    if paragraph_count == 0 and text.strip():
        paragraph_count = 1

    # Estimated Tokens
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        estimated_tokens = len(encoding.encode(text))
    except Exception:
        # Fallback to standard approximation (e.g. ~4 characters per token)
        estimated_tokens = len(text) // 4

    return {
        "word_count": word_count,
        "character_count": character_count,
        "sentence_count": sentence_count,
        "paragraph_count": paragraph_count,
        "estimated_tokens": estimated_tokens
    }
