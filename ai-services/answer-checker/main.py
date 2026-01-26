from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import google.generativeai as genai
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import PyPDF2
import io
import os
import logging
from pdf2image import convert_from_bytes
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import uuid
import json
import re
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
logger.info("Static files mounted at /static from directory: static")

# Set up templates
templates = Jinja2Templates(directory="templates")

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not set. Please set it in .env file.")
    raise RuntimeError("GEMINI_API_KEY environment variable is required")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
    logger.info("Gemini API initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini API: {str(e)}")
    raise

# Text extraction functions
async def preprocess_image(image: Image.Image) -> Image.Image:
    try:
        img = image.convert("L")
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(3.0)
        img = img.point(lambda x: 255 if x > 130 else 0, "1")
        img = img.filter(ImageFilter.MedianFilter(size=5))
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
        logger.info("Image preprocessed successfully")
        return img
    except Exception as e:
        logger.error(f"Image preprocessing failed: {str(e)}")
        return image

async def extract_text_from_image(image: Image.Image) -> str:
    try:
        processed_image = await preprocess_image(image)
        psm_configs = [
            r'--oem 3 --psm 6',
            r'--oem 3 --psm 4',
            r'--oem 3 --psm 7'
        ]
        text = ""
        for config in psm_configs:
            text = pytesseract.image_to_string(processed_image, config=config)
            if text.strip() and not text.startswith("Error"):
                logger.info(f"Text extracted with {config}: {text[:100]}...")
                return text
        logger.warning("No clear text extracted with default PSMs, using last attempt")
        return text if text.strip() else "No text detected with Tesseract"
    except Exception as e:
        logger.error(f"Tesseract extraction failed: {str(e)}")
        return f"Error during Tesseract extraction: {str(e)}"

async def extract_text_from_pdf(pdf_file: UploadFile) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file.file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            text += page_text or ""
        pdf_file.file.seek(0)
        if text.strip():
            logger.info("PDF text extracted successfully via PyPDF2")
            return text

        logger.info("No text extracted via PyPDF2, attempting OCR with pdf2image")
        pdf_bytes = await pdf_file.read()
        images = convert_from_bytes(pdf_bytes, dpi=600)
        if not images:
            return "No images extracted from PDF"
        text = ""
        for img in images:
            processed_img = await preprocess_image(img)
            psm_configs = [
                r'--oem 3 --psm 6',
                r'--oem 3 --psm 4',
                r'--oem 3 --psm 7'
            ]
            page_text = ""
            for config in psm_configs:
                page_text = pytesseract.image_to_string(processed_img, config=config)
                if page_text.strip() and not page_text.startswith("Error"):
                    text += page_text + "\n"
                    break
            if not page_text.strip():
                text += "No text detected on this page\n"
        return text if text.strip() else "No text detected in PDF via OCR"
    except Exception as e:
        logger.error(f"PDF text extraction failed: {str(e)}")
        return f"Error during PDF text extraction: {str(e)}"

async def enhance_extracted_text(raw_text: str) -> str:
    try:
        prompt = f"""
        You are an expert in interpreting garbled or poorly extracted text from handwritten answer sheets using OCR. The following text was extracted and may contain errors or misreadings due to OCR limitations. Your task is to correct and enhance it into a coherent answer based on common knowledge or context. If the text is unintelligible, provide a best guess or mark it as unclear.

        Extracted Text: {raw_text}

        Respond with the enhanced text only. If no meaningful enhancement is possible, return 'Unclear answer'.
        """
        response = model.generate_content(prompt)
        enhanced_text = response.text.strip()
        logger.info(f"Enhanced text from '{raw_text[:50]}...' to '{enhanced_text[:50]}...'")
        return enhanced_text if enhanced_text else "Unclear answer"
    except Exception as e:
        logger.error(f"Failed to enhance text: {str(e)}")
        return raw_text or "Unclear answer"

async def check_answer_with_gemini(question_text: str, answer_text: str, question_num: int) -> dict:
    try:
        prompt = f"""
        You are an expert answer checker for handwritten answer sheets. The following is the question and the enhanced extracted answer for Question {question_num}. Evaluate the answer's correctness.

        Question: {question_text or 'No question provided'}
        Enhanced Extracted Answer: {answer_text}

        Respond in the following format:
        Status: [Correct/Wrong/Unclear]
        Feedback: [Brief explanation of why the answer is correct, incorrect, or unclear]

        If you cannot determine correctness due to unclear text or lack of context, use:
        Status: Unclear
        Feedback: [Explanation of why evaluation was not possible]
        """
        response = model.generate_content(prompt)
        logger.info(f"Gemini API response for Question {question_num}: {response.text[:100]}...")
        return {"status": "", "feedback": response.text}
    except Exception as e:
        logger.error(f"Gemini API failed for Question {question_num}: {str(e)}")
        return {"status": "Error", "feedback": f"Error during answer checking: {str(e)}"}

def split_answers(extracted_text: str, num_questions: int, delimiter: str = None) -> List[str]:
    try:
        cleaned_text = extracted_text.strip()
        cleaned_text = re.sub(r'[lI|]', '1', cleaned_text)
        cleaned_text = re.sub(r'[oO]', '0', cleaned_text)
        cleaned_text = re.sub(r'[sS]', '5', cleaned_text)
        cleaned_text = re.sub(r'[\s\n]+', '\n', cleaned_text)
        cleaned_text = re.sub(r'[^\w\s\d\.\)\(\n:]+', '', cleaned_text)

        logger.debug(f"Cleaned text: {cleaned_text}")

        pattern = delimiter if delimiter else r'(?i)(?:\d+\.\s*|\d+\)\s*|q\d+\s*|Question\s*\d+\s*|\d+\s*[:]\s*|Answer\s*:)'
        try:
            segments = re.split(pattern, cleaned_text)
            answers = []
            current_answer = []
            for segment in segments:
                segment = segment.strip()
                if segment and not re.match(pattern, segment):
                    current_answer.append(segment)
                elif current_answer:
                    answers.append(" ".join(current_answer).strip())
                    current_answer = []
            if current_answer:
                answers.append(" ".join(current_answer).strip())
            answers = [a for a in answers if a]
        except re.error:
            logger.warning(f"Invalid delimiter pattern: {delimiter}. Falling back to default.")
            pattern = r'(?i)(?:\d+\.\s*|\d+\)\s*|q\d+\s*|Question\s*\d+\s*|\d+\s*[:]\s*|Answer\s*:)'
            segments = re.split(pattern, cleaned_text)
            answers = []
            current_answer = []
            for segment in segments:
                segment = segment.strip()
                if segment and not re.match(pattern, segment):
                    current_answer.append(segment)
                elif current_answer:
                    answers.append(" ".join(current_answer).strip())
                    current_answer = []
            if current_answer:
                answers.append(" ".join(current_answer).strip())
            answers = [a for a in answers if a]

        if len(answers) >= num_questions:
            logger.info(f"Split by question markers: {len(answers)} answers found")
            return answers[:num_questions]

        logger.info("Falling back to line-based splitting")
        lines = [line.strip() for line in cleaned_text.split('\n') if line.strip()]
        answers = []
        if lines:
            lines_per_answer = max(1, (len(lines) + num_questions - 1) // num_questions)
            for i in range(0, len(lines), lines_per_answer):
                chunk = " ".join(lines[i:i + lines_per_answer]).strip()
                if chunk:
                    answers.append(chunk)
            if len(answers) >= num_questions:
                logger.info(f"Split by lines: {len(answers)} answers found")
                return answers[:num_questions]

        logger.info("Falling back to word-count-based splitting")
        words = cleaned_text.split()
        if words:
            words_per_answer = max(1, (len(words) + num_questions - 1) // num_questions)
            answers = []
            for i in range(0, len(words), words_per_answer):
                chunk = " ".join(words[i:i + words_per_answer]).strip()
                answers.append(chunk)

        while len(answers) < num_questions:
            answers.append("Unclear answer")

        logger.info(f"Final split: {len(answers)} answers: {[a[:50] + '...' for a in answers]}")
        return answers[:num_questions]
    except Exception as e:
        logger.error(f"Answer splitting failed: {str(e)}")
        return [extracted_text.strip() if extracted_text.strip() else "Unclear answer"] * num_questions

def generate_pdf(results: list, total_marks: str) -> str:
    try:
        filename = f"result_{uuid.uuid4()}.pdf"
        filepath = os.path.join("static", filename)
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Handwritten Answer Checker Result", styles['Title']))
        story.append(Spacer(1, 12))

        for i, result in enumerate(results, 1):
            story.append(Paragraph(f"Question {i}", styles['Heading2']))
            if 'questionText' in result and result['questionText']:
                story.append(Paragraph("Question Text:", styles['Heading3']))
                story.append(Paragraph(result['questionText'].replace("\n", "<br/>"), styles['Normal']))
            story.append(Paragraph("Extracted Answer:", styles['Heading3']))
            story.append(Paragraph(result['extractedText'].replace("\n", "<br/>"), styles['Normal']))
            story.append(Paragraph("Feedback:", styles['Heading3']))
            story.append(Paragraph(result['feedback'].replace("\n", "<br/>"), styles['Normal']))
            story.append(Paragraph("Marks Awarded:", styles['Heading3']))
            story.append(Paragraph(result['marks'], styles['Normal']))
            story.append(Spacer(1, 12))

        story.append(Paragraph("Total Marks:", styles['Heading2']))
        story.append(Paragraph(total_marks, styles['Normal']))

        doc.build(story)
        logger.info(f"PDF generated successfully: {filename}")
        return filename
    except Exception as e:
        logger.error(f"PDF generation failed: {str(e)}")
        raise

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    logger.info("Serving root page")
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/check-answer")
async def check_answer(
    file: UploadFile = File(...),
    marks: str = Form(...)
):
    logger.info(f"Received file: {file.filename}, marks: {marks}")
    try:
        try:
            marks_list = json.loads(marks)
            if not isinstance(marks_list, list) or not all(isinstance(m, int) and m > 0 for m in marks_list):
                raise ValueError("Marks must be a list of positive integers")
            num_questions = len(marks_list)
        except json.JSONDecodeError:
            logger.error("Invalid marks format")
            return JSONResponse(status_code=400, content={"error": "Invalid marks format"})

        extracted_text = ""
        if file.filename.endswith('.pdf'):
            logger.info("Processing PDF file")
            extracted_text = await extract_text_from_pdf(file)
        else:
            logger.info("Processing image file")
            image = Image.open(file.file)
            extracted_text = await extract_text_from_image(image)

        if extracted_text.startswith("Error") or not extracted_text.strip():
            logger.error(f"Text extraction error or empty: {extracted_text}")
            return JSONResponse(status_code=400, content={"error": extracted_text or "No text extracted"})

        logger.info(f"Extracted text (first 100 chars): {extracted_text[:100]}...")
        logger.debug(f"Full extracted text: {extracted_text}")

        answers = split_answers(extracted_text, num_questions)
        if not answers or len(answers) < num_questions:
            logger.warning(f"Insufficient answers extracted: {len(answers)} found, {num_questions} expected")
            answers = answers + ["Unclear answer"] * (num_questions - len(answers))

        # Enhance every answer with Gemini
        enhanced_answers = []
        for answer in answers:
            enhanced_answer = await enhance_extracted_text(answer)
            enhanced_answers.append(enhanced_answer)
            logger.info(f"Original: '{answer[:50]}...' -> Enhanced: '{enhanced_answer[:50]}...'")

        results = []
        total_awarded = 0
        for i, (enhanced_answer, question_marks) in enumerate(zip(enhanced_answers, marks_list), 1):
            result = await check_answer_with_gemini("", enhanced_answer, i)
            feedback_lower = result['feedback'].lower()
            status = "Unclear"
            marks_awarded = 0

            if "status: correct" in feedback_lower:
                status = "Correct"
                marks_awarded = question_marks  # Full marks
                total_awarded += marks_awarded
            elif "status: wrong" in feedback_lower:
                status = "Wrong"
                marks_awarded = 0  # Zero marks
            elif "status: unclear" in feedback_lower:
                status = "Unclear"
                marks_awarded = question_marks // 2  # Half marks, rounded down
                total_awarded += marks_awarded

            result_item = {
                "extractedText": enhanced_answer,
                "feedback": result['feedback'],
                "marks": f"{marks_awarded}/{question_marks}",
                "status": status
            }
            results.append(result_item)
            logger.info(f"Question {i}: Status: {status}, Marks: {marks_awarded}/{question_marks}")

        total_marks = f"{total_awarded}/{sum(marks_list)}"

        pdf_filename = generate_pdf(results, total_marks)

        return JSONResponse(content={
            "results": results,
            "totalMarks": total_marks,
            "pdfFilename": pdf_filename,
            "splitAnswers": answers,
            "enhancedAnswers": enhanced_answers
        })
    except Exception as e:
        logger.error(f"General error in check-answer: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"An error occurred: {str(e)}", "traceback": str(e)})

@app.post("/check-answer-sheets")
async def check_answer_sheets(
    question_file: UploadFile = File(...),
    answer_file: UploadFile = File(...),
    marks: str = Form(...)
):
    logger.info(f"Received question file: {question_file.filename}, answer file: {answer_file.filename}, marks: {marks}")
    try:
        marks_list = json.loads(marks) if marks else [1] * 10
        if not isinstance(marks_list, list) or not all(isinstance(m, int) and m > 0 for m in marks_list):
            raise ValueError("Marks must be a list of positive integers")
        num_questions = len(marks_list)

        question_text = await extract_text_from_pdf(question_file)
        answer_text = await extract_text_from_pdf(answer_file)

        if question_text.startswith("Error") or not question_text.strip():
            logger.error(f"Question text extraction error or empty: {question_text}")
            return JSONResponse(status_code=400, content={"error": question_text or "No question text extracted"})
        if answer_text.startswith("Error") or not answer_text.strip():
            logger.error(f"Answer text extraction error or empty: {answer_text}")
            return JSONResponse(status_code=400, content={"error": answer_text or "No answer text extracted"})

        logger.info(f"Question text (first 100 chars): {question_text[:100]}...")
        logger.debug(f"Full question text: {question_text}")
        logger.info(f"Answer text (first 100 chars): {answer_text[:100]}...")
        logger.debug(f"Full answer text: {answer_text}")

        questions = split_answers(question_text, num_questions)
        answers = split_answers(answer_text, num_questions)

        min_count = min(len(questions), len(answers), num_questions)
        questions = questions[:min_count]
        answers = answers[:min_count]
        marks_list = marks_list[:min_count]
        if len(questions) != len(answers):
            logger.warning(f"Mismatch: {len(questions)} questions, {len(answers)} answers. Using minimum count: {min_count}")

        # Enhance every answer with Gemini
        enhanced_answers = []
        for answer in answers:
            enhanced_answer = await enhance_extracted_text(answer)
            enhanced_answers.append(enhanced_answer)
            logger.info(f"Original: '{answer[:50]}...' -> Enhanced: '{enhanced_answer[:50]}...'")

        results = []
        total_awarded = 0
        for i, (question_text, enhanced_answer, question_marks) in enumerate(zip(questions, enhanced_answers, marks_list), 1):
            result = await check_answer_with_gemini(question_text, enhanced_answer, i)
            feedback_lower = result['feedback'].lower()
            status = "Unclear"
            marks_awarded = 0

            if "status: correct" in feedback_lower:
                status = "Correct"
                marks_awarded = question_marks  # Full marks
                total_awarded += marks_awarded
            elif "status: wrong" in feedback_lower:
                status = "Wrong"
                marks_awarded = 0  # Zero marks
            elif "status: unclear" in feedback_lower:
                status = "Unclear"
                marks_awarded = question_marks // 2  # Half marks, rounded down
                total_awarded += marks_awarded

            result_item = {
                "questionText": question_text,
                "extractedText": enhanced_answer,
                "feedback": result['feedback'],
                "marks": f"{marks_awarded}/{question_marks}",
                "status": status
            }
            results.append(result_item)
            logger.info(f"Question {i}: Status: {status}, Marks: {marks_awarded}/{question_marks}")

        total_marks = f"{total_awarded}/{sum(marks_list)}"

        pdf_filename = generate_pdf(results, total_marks)

        return JSONResponse(content={
            "results": results,
            "totalMarks": total_marks,
            "pdfFilename": pdf_filename,
            "splitQuestions": questions,
            "splitAnswers": answers,
            "enhancedAnswers": enhanced_answers
        })
    except Exception as e:
        logger.error(f"General error in check-answer-sheets: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"An error occurred: {str(e)}", "traceback": str(e)})

@app.post("/check-answers")
async def check_answers_batch(request: Request):
    """
    PHASE 7.5.3 - Batch answer checking for exam evaluation
    Accepts questions with expected answers and student answers
    Returns suggested scores and feedback
    """
    try:
        data = await request.json()
        questions = data.get('questions', [])
        total_marks = data.get('totalMarks', 0)
        attempt_id = data.get('attemptId', 'unknown')

        logger.info(f"Batch checking {len(questions)} answers for attempt {attempt_id}")

        if not questions:
            return JSONResponse(status_code=400, content={
                "error": "No questions provided"
            })

        # Build evaluation prompt
        evaluation_prompt = f"""You are an expert examiner evaluating student answers.

Total Marks: {total_marks}

For each question, provide:
1. Marks awarded (based on the maximum marks for that question)
2. Brief feedback explaining the evaluation

Evaluate fairly and constructively. Award partial marks where appropriate.

Questions and Answers:
"""

        question_feedback = []
        for idx, q in enumerate(questions, 1):
            q_text = q.get('text', '')
            q_marks = q.get('marks', 0)
            expected = q.get('expectedAnswer', '')
            student = q.get('studentAnswer', '')

            evaluation_prompt += f"\n\nQuestion {idx} (Max {q_marks} marks):\n{q_text}\n"
            if expected:
                evaluation_prompt += f"Expected Answer: {expected}\n"
            evaluation_prompt += f"Student Answer: {student}\n"

        evaluation_prompt += """

Provide your evaluation in the following JSON format:
{
  "questionEvaluations": [
    {
      "questionNumber": 1,
      "marksAwarded": <marks>,
      "maxMarks": <max_marks>,
      "feedback": "<feedback>"
    },
    ...
  ],
  "overallFeedback": "<general comments about the student's performance>"
}
"""

        # Call Gemini AI
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(evaluation_prompt)
        response_text = response.text.strip()

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            eval_result = json.loads(json_match.group())
        else:
            logger.warning("Could not parse AI response as JSON, using fallback")
            eval_result = {
                "questionEvaluations": [],
                "overallFeedback": "AI evaluation completed but format was unclear"
            }

        # Calculate total score
        total_score = 0
        processed_feedback = []
        
        for idx, q in enumerate(questions):
            q_id = q.get('id', f'q{idx+1}')
            q_marks = q.get('marks', 0)
            
            # Find evaluation for this question
            eval_data = None
            if eval_result.get('questionEvaluations'):
                for ev in eval_result['questionEvaluations']:
                    if ev.get('questionNumber') == idx + 1:
                        eval_data = ev
                        break
            
            if eval_data:
                awarded = eval_data.get('marksAwarded', 0)
                feedback = eval_data.get('feedback', 'Evaluated')
            else:
                # Fallback: simple comparison
                student = q.get('studentAnswer', '').lower()
                expected = q.get('expectedAnswer', '').lower()
                
                if not student or student == '':
                    awarded = 0
                    feedback = "No answer provided"
                elif expected and expected in student:
                    awarded = q_marks
                    feedback = "Correct answer"
                elif expected:
                    awarded = int(q_marks * 0.5)  # Partial credit
                    feedback = "Partially correct"
                else:
                    awarded = int(q_marks * 0.7)  # No expected answer to compare
                    feedback = "Answer provided"
            
            total_score += awarded
            processed_feedback.append({
                "questionId": q_id,
                "suggestedMarks": awarded,
                "maxMarks": q_marks,
                "feedback": feedback
            })

        logger.info(f"AI evaluation complete: {total_score}/{total_marks}")

        return JSONResponse(content={
            "totalScore": total_score,
            "maxMarks": total_marks,
            "overallFeedback": eval_result.get('overallFeedback', 'Evaluation completed'),
            "questionFeedback": processed_feedback
        })

    except Exception as e:
        logger.error(f"Batch checking error: {str(e)}")
        return JSONResponse(status_code=500, content={
            "error": f"AI checking failed: {str(e)}"
        })

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 5002))
    uvicorn.run(app, host="0.0.0.0", port=port)