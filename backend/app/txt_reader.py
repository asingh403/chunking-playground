def read_txt(file_bytes: bytes) -> str:
    """
    Decodes txt file bytes into string.
    First tries UTF-8, then falls back to Latin-1.
    """
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1")
