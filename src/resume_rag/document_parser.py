import io
def parse_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    import PyPDF2
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text.append(page_text)
    return "\n".join(text)

def parse_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file."""
    import docx
    doc = docx.Document(io.BytesIO(file_bytes))
    text = []
    for para in doc.paragraphs:
        if para.text:
            text.append(para.text)
    return "\n".join(text)

def parse_document(file_bytes: bytes, filename: str) -> str:
    """Parses a document based on its extension."""
    if filename.lower().endswith(".pdf"):
        return parse_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        return parse_docx(file_bytes)
    elif filename.lower().endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file format for {filename}. Please upload PDF, DOCX, or TXT.")
