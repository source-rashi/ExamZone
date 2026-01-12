from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import random
import os
import logging
import shutil
from typing import List, Optional
from pathlib import Path
import pdfplumber
import docx
import zipfile
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import re
import google.generativeai as genai
from google.api_core import exceptions
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY not set. Please set it in .env file.")
    raise RuntimeError("GOOGLE_API_KEY environment variable is required")
else:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        models = genai.list_models()
        logger.info(f"Attempting to list models with API key: {GOOGLE_API_KEY[:8]}...")
        if models:
            logger.info(f"Available models and methods: {[(model.name, getattr(model, 'supported_generation_methods', 'N/A')) for model in models]}")
            available_model = next((model.name for model in models if "gemini-2.0-flash" in model.name.lower()), None)
            if not available_model:
                available_model = next((model.name for model in models if any("generate" in method.lower() for method in getattr(model, 'supported_generation_methods', []))), None)
                if not available_model:
                    logger.warning("No suitable model found with generateContent. Forcing fallback to gemini-2.0-flash-001.")
                    available_model = "models/gemini-2.0-flash-001"
                else:
                    logger.info(f"Using fallback model with potential generate support: {available_model}")
            else:
                logger.info(f"Using Gemini 2.0 Flash model: {available_model}")
        else:
            logger.error("No models returned by genai.list_models(). Check API key and service status.")
            GOOGLE_API_KEY = None
    except exceptions.GoogleAPIError as e:
        logger.error(f"Gemini API configuration error: {str(e)}")
        GOOGLE_API_KEY = None
    except Exception as e:
        logger.error(f"Unexpected error during Gemini API setup: {str(e)}")
        GOOGLE_API_KEY = None

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Ensure static directory exists
Path("static").mkdir(exist_ok=True)

def shuffle_array(array: List[str]) -> List[str]:
    array_copy = array.copy()
    random.shuffle(array_copy)
    return array_copy

def extract_text_from_pdf(file: UploadFile) -> List[str]:
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
    
    questions = []
    current_question = []
    question_start_pattern = re.compile(r"^\s*(\d+\.|\d+\)|\d+\s*-|\s*[A-Z]\d*\.|Q\d+\.)")
    
    try:
        with pdfplumber.open(temp_file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if not text:
                    continue
                
                lines = text.split("\n")
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    is_short = len(line) < 25
                    is_all_caps = line.isupper()
                    has_no_number = not any(c.isdigit() for c in line)
                    if is_short and (is_all_caps or has_no_number):
                        continue
                    
                    match = question_start_pattern.match(line)
                    if match:
                        if current_question:
                            question_text = " ".join(current_question).strip()
                            questions.append(question_text)
                            current_question = []
                        line = re.sub(question_start_pattern, "", line).strip()
                    current_question.append(line)
                
                if current_question:
                    question_text = " ".join(current_question).strip()
                    questions.append(question_text)
                    current_question = []
    
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
    
    questions = [q for q in questions if q and len(q) > 15]
    logger.info(f"Extracted {len(questions)} questions from PDF: {questions}")
    return questions

def extract_text_from_docx(file: UploadFile) -> List[str]:
    doc = docx.Document(file.file)
    text = "\n".join([para.text for para in doc.paragraphs])
    questions = [q.strip() for q in text.split("\n") if q.strip()]
    questions = [re.sub(r"^\s*\d+\.?\s*", "", q).strip() for q in questions]
    return questions

def extract_text_from_txt(file: UploadFile) -> List[str]:
    content = file.file.read().decode("utf-8")
    questions = [q.strip() for q in content.split("\n") if q.strip()]
    questions = [re.sub(r"^\s*\d+\.?\s*", "", q).strip() for q in questions]
    return questions

def validate_and_complete_question(question: str) -> str:
    if not GOOGLE_API_KEY:
        logger.warning("Gemini API unavailable; attempting manual completion.")
        return complete_question_manually(question)
    
    is_math_related = any(char in question for char in "+-*/=x") or any(char.isdigit() for char in question)
    is_incomplete = (question.strip().endswith(("given", "if", "when")) or 
                     any(sub in question for sub in ["(a)", "(b)", "(c)"]) or 
                     question.strip().endswith("the")) and not question.endswith("?") and not any(char in question for char in "?.!")

    try:
        model = genai.GenerativeModel(available_model if available_model else 'models/gemini-2.0-flash-001')
        prompt = f"""
        Check if the following question is complete and well-formatted. If it’s incomplete, assume it’s a math or probability question unless clearly otherwise, and complete it into a clear, proper question with a solvable context or solution. Return only the final question.

        Question: "{question}"

        Instructions:
        - For incomplete math or probability questions, add missing numbers, operators, phrasing, or a solution context.
        - Ensure the output is a complete, grammatically correct question.
        - If it’s not math-related, complete it appropriately based on context.

        Examples:
        Input: "What is 2+2"
        Output: "What is 2 + 2?"
        Input: "Solve 5x ="
        Output: "Solve for x: 5x = 10"
        Input: "What 3 +"
        Output: "What is 3 + 4?"
        Input: "Multiply 6"
        Output: "What is 6 multiplied by 8?"
        Input: "A box contains 3 white, 2 red, and 1 blue ball. One is drawn and found white. What is the probability the next is red, given"
        Output: "A box contains 3 white, 2 red, and 1 blue balls. One ball is drawn at random and found to be white. What is the probability that the next ball drawn will be red, given that one white ball has been removed? (Calculate: P(Red | White drawn) = 2/5)"
        Input: "Area triangle"
        Output: "What is the area of a triangle?"
        Input: "Photosynthesis"
        Output: "What is photosynthesis?"
        """
        response = model.generate_content(prompt)
        completed_question = response.text.strip()
        
        if is_incomplete and is_math_related:
            if "probability" in question.lower():
                completed_question = f"{question.strip()} that one ball has been removed? (Calculate: P(Red | White drawn) = 2/5)"
            elif "+" in question or "-" in question or "*" in question or "/" in question:
                completed_question = f"What is {question.strip()} 5?"
            else:
                completed_question = f"Solve: {question.strip()} = 10"
        
        logger.info(f"Completed question: '{question}' -> '{completed_question}'")
        return completed_question
    except exceptions.GoogleAPIError as e:
        logger.error(f"Gemini API error: {str(e)}")
        return complete_question_manually(question)
    except Exception as e:
        logger.error(f"Unexpected error in Gemini API call: {str(e)}")
        return complete_question_manually(question)

def complete_question_manually(question: str) -> str:
    is_math_related = any(char in question for char in "+-*/=x") or any(char.isdigit() for char in question)
    is_incomplete = (question.strip().endswith(("given", "if", "when")) or 
                     any(sub in question for sub in ["(a)", "(b)", "(c)"]) or 
                     question.strip().endswith("the")) and not question.endswith("?") and not any(char in question for char in "?.!")
    
    if is_incomplete and is_math_related:
        if "probability" in question.lower():
            return f"{question.strip()} that one ball has been removed? (Calculate: P(Red | White drawn) = 2/5)"
        elif "+" in question or "-" in question or "*" in question or "/" in question:
            return f"What is {question.strip()} 5?"
        else:
            return f"Solve: {question.strip()} = 10"
    return question + "?" if not question.endswith("?") else question

def generate_pdf(student_name: str, reg_no: str, set_no: str, custom_title: str, course_name: str, section: str, total_marks: int, questions: List[str], output_path: str):
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(300, 750, custom_title)
    c.setFont("Helvetica", 12)
    right_x = 550
    c.drawRightString(right_x, 680, f"Course: {course_name}")
    c.drawRightString(right_x, 665, f"Section: {section}")
    c.drawRightString(right_x, 650, f"Total Marks: {total_marks}")
    c.drawString(50, 680, f"Name: {student_name}")
    c.drawString(50, 665, f"Reg No: {reg_no}")
    c.drawString(50, 650, f"Set No: {set_no}")
    c.line(50, 640, 550, 640)
    y = 620
    line_height = 18
    max_width = 500

    for i, question in enumerate(questions, 1):
        parts = re.split(r"(\([a-z]\)|[A-Z]\.)", question)
        main_text = parts[0].strip()
        text_object = c.beginText(50, y)
        text_object.setFont("Helvetica-Bold", 12)
        text_object.textLine(f"{i}. ")
        text_object.setFont("Helvetica", 12)
        words = main_text.split()
        current_line = ""
        for word in words:
            test_line = current_line + word + " "
            if c.stringWidth(test_line, "Helvetica", 12) < max_width:
                current_line = test_line
            else:
                text_object.textLine(current_line)
                current_line = word + " "
                y -= line_height
                if y < 50:
                    c.drawText(text_object)
                    c.showPage()
                    y = 750
                    text_object = c.beginText(50, y)
                    text_object.setFont("Helvetica-Bold", 12)
                    text_object.textLine(f"{i}. ")
                    text_object.setFont("Helvetica", 12)
        if current_line:
            text_object.textLine(current_line)
            y -= line_height
        c.drawText(text_object)

        if len(parts) > 1:
            for j in range(1, len(parts), 2):
                option_marker = parts[j].strip()
                option_text = parts[j + 1].strip() if j + 1 < len(parts) else ""
                y -= line_height
                if y < 50:
                    c.showPage()
                    y = 750
                text_object = c.beginText(70, y)
                text_object.setFont("Helvetica", 12)
                option_line = f"{option_marker} {option_text}"
                words = option_line.split()
                current_line = ""
                for word in words:
                    test_line = current_line + word + " "
                    if c.stringWidth(test_line, "Helvetica", 12) < (max_width - 20):
                        current_line = test_line
                    else:
                        text_object.textLine(current_line)
                        current_line = word + " "
                        y -= line_height
                        if y < 50:
                            c.drawText(text_object)
                            c.showPage()
                            y = 750
                            text_object = c.beginText(70, y)
                            text_object.setFont("Helvetica", 12)
                if current_line:
                    text_object.textLine(current_line)
                    y -= line_height
                c.drawText(text_object)
        y -= 15
        if y < 50:
            c.showPage()
            y = 750

    c.setFont("Helvetica", 10)
    c.drawString(50, 40, f"End of Paper - Total Questions: {len(questions)}")
    c.showPage()
    c.save()

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload-and-generate/")
async def upload_and_generate(
    files: List[UploadFile] = File(...),
    student_count: int = Form(...),
    questions_per_bank: int = Form(...),
    student_names_file: Optional[UploadFile] = File(None),
    zip_download: bool = Form(False),
    custom_title: str = Form("Class 10 Examination Paper"),
    course_name: str = Form("Mathematics"),
    section: str = Form("A"),
    total_marks: int = Form(100)
):
    question_banks = []
    for file in files:
        if file.filename.endswith(".pdf"):
            questions = extract_text_from_pdf(file)
        elif file.filename.endswith(".docx"):
            questions = extract_text_from_docx(file)
        elif file.filename.endswith(".txt"):
            questions = extract_text_from_txt(file)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.filename}")
        logger.info(f"Extracted {len(questions)} questions from {file.filename}")
        question_banks.append(questions)

    student_details = []
    if student_names_file:
        temp_file_path = f"temp_{student_names_file.filename}"
        with open(temp_file_path, "wb") as temp_file:
            shutil.copyfileobj(student_names_file.file, temp_file)
        
        try:
            if student_names_file.filename.endswith((".csv", ".txt")):
                df = pd.read_csv(temp_file_path)
            elif student_names_file.filename.endswith(".xlsx"):
                df = pd.read_excel(temp_file_path)
            else:
                raise HTTPException(status_code=400, detail="Unsupported student file type. Use .csv, .txt, or .xlsx")
            
            required_columns = ["name", "reg_no"]
            if not all(col.lower() in [c.lower() for c in df.columns] for col in required_columns):
                raise HTTPException(status_code=400, detail=f"Student file must contain columns: {required_columns}")
            
            student_details = df[["name", "reg_no"]].dropna().to_dict("records")
            if len(student_details) < student_count:
                raise HTTPException(status_code=400, detail=f"Not enough student records provided. Need at least {student_count}, got {len(student_details)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    else:
        student_details = [{"name": f"Student {i+1}", "reg_no": f"{i+1:03d}"} for i in range(student_count)]
    logger.info(f"Student details: {student_details}")

    number_of_banks = len(question_banks)
    questions_per_student = questions_per_bank * number_of_banks
    total_questions_needed = student_count * questions_per_student
    for i, bank in enumerate(question_banks):
        if len(bank) < questions_per_bank:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough questions in bank {i+1}! Need {questions_per_bank} per student, but only {len(bank)} available."
            )
        if len(bank) < questions_per_bank * student_count:
            logger.warning(f"Bank {i+1} has {len(bank)} questions, but {questions_per_bank * student_count} unique questions are needed. Some questions will be reused.")

    assignments = {}
    used_questions_per_bank = [set() for _ in range(number_of_banks)]
    unique_sets = {}
    
    for i in range(student_count):
        student_name = f"Student_{i+1}"
        assignments[student_name] = []
        
        for bank_idx, bank in enumerate(question_banks):
            available_questions = [q for idx, q in enumerate(bank) if idx not in used_questions_per_bank[bank_idx]]
            if len(available_questions) < questions_per_bank:
                used_questions_per_bank[bank_idx].clear()
                available_questions = bank.copy()
            
            shuffled_questions = shuffle_array(available_questions)
            selected = shuffled_questions[:questions_per_bank]
            
            for question in selected:
                question_idx = bank.index(question)
                used_questions_per_bank[bank_idx].add(question_idx)
            
            assignments[student_name].extend(selected)
        
        assignments[student_name] = [validate_and_complete_question(q) for q in assignments[student_name]]
        unique_sets[student_name] = assignments[student_name].copy()
        logger.info(f"Generated unique set for {student_name}: {assignments[student_name]}")

    # Store PDFs and collect download links
    pdf_links = {}
    base_path = Path(__file__).parent.parent.parent / "pdfs"  # Relative to project root
    logger.info(f"Base path set to: {base_path}")  # Debug log
    for i, student in enumerate(student_details):
        student_name = student["name"]
        reg_no = student["reg_no"]
        set_no = f"Set {min(i + 1, student_count)}"
        if i < student_count:
            assignments[student_name] = unique_sets[f"Student_{i+1}"].copy()
        else:
            random_set_key = random.choice(list(unique_sets.keys()))
            assignments[student_name] = unique_sets[random_set_key].copy()
            set_no = f"Set {int(random_set_key.split('_')[1])}"
        logger.info(f"Assigned to {student_name} (Reg No: {reg_no}, Set: {set_no}): {assignments[student_name]}")

        output_path = base_path / f"{reg_no}.pdf"
        logger.info(f"Saving PDF to: {output_path}")  # Debug log
        output_path.parent.mkdir(parents=True, exist_ok=True)
        generate_pdf(student_name, reg_no, set_no, custom_title, course_name, section, total_marks, assignments[student_name], str(output_path))

        # Store link to the PDF
        pdf_links[reg_no] = f"/get-pdf/{reg_no}"

    zip_link = None
    if zip_download and len(student_details) > 1:
        zip_path = base_path / "student_questions.zip"
        with zipfile.ZipFile(zip_path, 'w') as zf:
            for reg_no in [student["reg_no"] for student in student_details]:
                pdf_path = base_path / f"{reg_no}.pdf"
                zf.write(pdf_path, f"{reg_no}.pdf")
        logger.info(f"Generated ZIP: {zip_path}")
        zip_link = "/get-zip"

    # Return JSON with download links
    return JSONResponse(content={
        "message": "PDFs generated successfully",
        "pdf_links": pdf_links,
        "zip_link": zip_link
    })

@app.get("/get-pdf/{reg_no}")
async def get_pdf(reg_no: str):
    base_path = Path(__file__).parent.parent.parent / "pdfs"
    pdf_path = base_path / f"{reg_no}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found for roll number")
    return FileResponse(pdf_path, media_type='application/pdf', filename=f"{reg_no}.pdf")

@app.get("/get-zip")
async def get_zip():
    base_path = Path(__file__).parent.parent.parent / "pdfs"
    zip_path = base_path / "student_questions.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="ZIP file not found")
    return FileResponse(zip_path, media_type='application/zip', filename="student_questions.zip")

# PHASE 6.3 - AI Integration Bridge Endpoint
# This endpoint accepts structured JSON from Node.js backend
# NO CHANGES TO EXISTING AI LOGIC - only new interface
from pydantic import BaseModel

class StudentDetail(BaseModel):
    name: str
    reg_no: str
    student_id: str

class GeneratePapersRequest(BaseModel):
    exam_id: str
    class_id: str
    student_count: int
    questions_per_bank: int
    sets_per_student: int
    custom_title: str
    course_name: str
    section: str
    total_marks: int
    student_details: List[StudentDetail]
    question_sources: Optional[List[str]] = []  # Optional: list of file paths or question texts

# PHASE 6.3 - New Request Models
class QuestionSourceRequest(BaseModel):
    source_type: str  # 'text', 'latex', 'pdf'
    content: str
    file_path: str
    total_marks: int
    exam_title: str

class QuestionNormalized(BaseModel):
    questionText: str
    marks: int
    topic: str
    difficulty: str
    options: Optional[List[str]] = []
    correctAnswer: Optional[str] = ""

class GenerateSetsRequest(BaseModel):
    questions: List[QuestionNormalized]
    number_of_sets: int
    total_marks: int
    minimum_questions: int
    balance_difficulty: bool
    shuffle_variants: bool


# PHASE 6.3 - AI Normalization Endpoint
@app.post("/api/normalize-questions")
async def normalize_questions(request: QuestionSourceRequest):
    """
    TASK 2 - AI Question Normalization
    
    Reads teacher input, extracts questions, normalizes formatting,
    and tags questions by topic, difficulty, marks.
    """
    try:
        logger.info(f"[Normalize] Processing {request.source_type} source")
        
        normalized_questions = []
        
        # Extract raw questions based on source type
        if request.source_type == 'text' or request.source_type == 'latex':
            raw_text = request.content
            # Split by common question delimiters
            question_patterns = re.findall(r'(?:Q\d+[\.:)]|Question\s+\d+[\.:)]|\d+[\.:)])\s*(.+?)(?=Q\d+[\.:)]|Question\s+\d+[\.:)]|\d+[\.:)]|$)', raw_text, re.DOTALL | re.IGNORECASE)
            
            if not question_patterns:
                # Fallback: split by newlines and filter
                question_patterns = [q.strip() for q in raw_text.split('\n') if q.strip() and len(q.strip()) > 10]
            
            # Use AI to normalize and tag questions
            for idx, q_text in enumerate(question_patterns):
                if not q_text.strip():
                    continue
                
                try:
                    normalized_q = normalize_single_question_with_ai(q_text, idx + 1, request.total_marks, len(question_patterns))
                    if normalized_q:
                        normalized_questions.append(normalized_q)
                except Exception as e:
                    logger.warning(f"[Normalize] Failed to normalize question {idx + 1}: {str(e)}")
                    # Add with defaults if AI fails
                    normalized_questions.append({
                        "questionText": q_text.strip(),
                        "marks": max(1, request.total_marks // max(1, len(question_patterns))),
                        "topic": "General",
                        "difficulty": "medium",
                        "options": [],
                        "correctAnswer": ""
                    })
        
        elif request.source_type == 'pdf':
            # Use existing PDF extraction logic would go here
            logger.info("[Normalize] Extracting from PDF...")
            return JSONResponse(content={
                "success": False,
                "error": "PDF extraction not yet implemented in normalization endpoint"
            }, status_code=501)
        
        logger.info(f"[Normalize] Normalized {len(normalized_questions)} questions")
        
        return JSONResponse(content={
            "success": True,
            "questions": normalized_questions,
            "count": len(normalized_questions)
        })
        
    except Exception as e:
        logger.error(f"[Normalize] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Normalization failed: {str(e)}")


def normalize_single_question_with_ai(question_text: str, question_num: int, total_marks: int, total_questions: int) -> dict:
    """
    Use Gemini AI to normalize a single question and extract metadata
    """
    if not GOOGLE_API_KEY:
        # Return basic normalization without AI
        return {
            "questionText": question_text.strip(),
            "marks": max(1, total_marks // max(1, total_questions)),
            "topic": "General",
            "difficulty": "medium",
            "options": [],
            "correctAnswer": ""
        }
    
    try:
        model = genai.GenerativeModel(available_model)
        
        prompt = f"""Analyze this exam question and provide structured metadata:

Question: {question_text}

Provide response in this exact JSON format:
{{
    "questionText": "cleaned and complete question text",
    "marks": <suggested marks based on complexity>,
    "topic": "main topic (e.g., Mathematics, Physics, History)",
    "difficulty": "easy|medium|hard",
    "options": ["option1", "option2", ...] (if multiple choice, else empty array),
    "correctAnswer": "correct answer if obvious, else empty string"
}}

Total exam marks: {total_marks}
Total questions: {total_questions}
Suggested marks per question: {max(1, total_marks // max(1, total_questions))}
"""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            import json
            normalized = json.loads(json_match.group())
            return normalized
        
        raise ValueError("Could not extract JSON from AI response")
        
    except Exception as e:
        logger.warning(f"[AI Normalize] Error: {str(e)}")
        # Return basic normalization
        return {
            "questionText": question_text.strip(),
            "marks": max(1, total_marks // max(1, total_questions)),
            "topic": "General",
            "difficulty": "medium",
            "options": [],
            "correctAnswer": ""
        }


# PHASE 6.3 - Set Generation Endpoint
@app.post("/api/generate-sets")
async def generate_sets(request: GenerateSetsRequest):
    """
    TASK 3 - AI Exam Set Generation
    
    Generates N distinct question sets with:
    - Balanced difficulty
    - No similar question placement
    - Shuffled variants
    - Full paper coverage
    """
    try:
        logger.info(f"[Generate Sets] Creating {request.number_of_sets} sets from {len(request.questions)} questions")
        
        questions = [q.dict() for q in request.questions]
        
        # Group questions by difficulty
        easy_questions = [q for q in questions if q.get('difficulty') == 'easy']
        medium_questions = [q for q in questions if q.get('difficulty') == 'medium']
        hard_questions = [q for q in questions if q.get('difficulty') == 'hard']
        
        generated_sets = []
        
        for set_num in range(request.number_of_sets):
            # Balance difficulty across sets
            if request.balance_difficulty:
                # Calculate distribution
                questions_needed = max(request.minimum_questions, len(questions) // request.number_of_sets)
                
                # Distribute: 30% easy, 50% medium, 20% hard
                easy_count = max(1, int(questions_needed * 0.3))
                medium_count = max(1, int(questions_needed * 0.5))
                hard_count = max(1, questions_needed - easy_count - medium_count)
                
                # Sample questions
                set_questions = []
                
                if easy_questions:
                    set_questions.extend(random.sample(easy_questions, min(easy_count, len(easy_questions))))
                if medium_questions:
                    set_questions.extend(random.sample(medium_questions, min(medium_count, len(medium_questions))))
                if hard_questions:
                    set_questions.extend(random.sample(hard_questions, min(hard_count, len(hard_questions))))
                
                # If not enough questions, fill from all questions
                while len(set_questions) < questions_needed and len(set_questions) < len(questions):
                    remaining = [q for q in questions if q not in set_questions]
                    if remaining:
                        set_questions.append(random.choice(remaining))
                    else:
                        break
            else:
                # Simple random selection
                questions_per_set = max(request.minimum_questions, len(questions) // request.number_of_sets)
                set_questions = random.sample(questions, min(questions_per_set, len(questions)))
            
            # Shuffle if requested
            if request.shuffle_variants:
                random.shuffle(set_questions)
            
            generated_sets.append({
                "setId": f"SET-{str(set_num + 1).zfill(3)}",
                "questions": set_questions,
                "totalMarks": sum(q.get('marks', 0) for q in set_questions),
                "questionCount": len(set_questions)
            })
        
        logger.info(f"[Generate Sets] Generated {len(generated_sets)} sets")
        
        return JSONResponse(content={
            "success": True,
            "sets": generated_sets,
            "count": len(generated_sets)
        })
        
    except Exception as e:
        logger.error(f"[Generate Sets] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Set generation failed: {str(e)}")


@app.post("/api/generate-papers")
async def generate_papers_json(request: GeneratePapersRequest):
    """
    PHASE 6.3 - Generate papers from structured JSON payload
    Uses existing AI logic as BLACK BOX
    """
    try:
        logger.info(f"[AI Bridge] Received request for exam {request.exam_id}")
        
        # For now, generate sample questions (or load from question_sources if provided)
        # In production, this would integrate with existing question bank extraction
        sample_questions = [
            "What is the capital of France?",
            "Solve: 2 + 2 = ?",
            "What is the speed of light?",
            "Define photosynthesis.",
            "What is the Pythagorean theorem?",
            "Name the first President of the United States.",
            "What is the boiling point of water?",
            "Define Newton's first law of motion.",
            "What is the formula for area of a circle?",
            "Name three primary colors."
        ]
        
        # Use existing shuffle logic
        question_banks = [sample_questions]  # In production, load from actual sources
        
        # Prepare output directory
        output_base = Path(os.getenv("OUTPUT_DIR", "static/exam_papers"))
        exam_dir = output_base / request.exam_id
        exam_dir.mkdir(parents=True, exist_ok=True)
        
        generated_papers = []
        
        # Generate papers for each student
        for idx, student in enumerate(request.student_details):
            # Use existing question assignment logic
            shuffled_questions = shuffle_array(sample_questions)
            selected_questions = shuffled_questions[:request.questions_per_bank]
            
            # Validate and complete questions using existing AI logic
            completed_questions = [validate_and_complete_question(q) for q in selected_questions]
            
            # Generate PDF using existing function
            set_number = (idx % request.sets_per_student) + 1
            student_dir = exam_dir / student.student_id
            student_dir.mkdir(exist_ok=True)
            
            output_path = student_dir / f"set_{set_number}.pdf"
            
            # Use existing generate_pdf function (BLACK BOX)
            generate_pdf(
                student.name,
                student.reg_no,
                f"Set {set_number}",
                request.custom_title,
                request.course_name,
                request.section,
                request.total_marks,
                completed_questions,
                str(output_path)
            )
            
            logger.info(f"[AI Bridge] Generated paper for {student.name} at {output_path}")
            
            # Read PDF and encode as base64 for transport
            with open(output_path, 'rb') as pdf_file:
                pdf_base64 = __import__('base64').b64encode(pdf_file.read()).decode('utf-8')
            
            generated_papers.append({
                "student_id": student.student_id,
                "student_name": student.name,
                "reg_no": student.reg_no,
                "set_number": set_number,
                "set_code": f"SET-{set_number}",
                "pdf_base64": pdf_base64,  # Send as base64
                "question_count": len(completed_questions)
            })
        
        return JSONResponse(content={
            "success": True,
            "message": f"Generated {len(generated_papers)} question papers",
            "papers": generated_papers
        })
        
    except Exception as e:
        logger.error(f"[AI Bridge] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Paper generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # PHASE 6.3 - Run on port 5001 (separate from answer-checker on 5002)
    port = int(os.getenv("PORT", 5001))
    uvicorn.run(app, host="127.0.0.1", port=port)
