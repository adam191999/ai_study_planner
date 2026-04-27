from flask import Flask, render_template, request, jsonify, Response
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

print("RUNNING FILE:", __file__)

load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')

# user name and password check:
APP_USERNAME = os.getenv("APP_USERNAME")
APP_PASSWORD = os.getenv("APP_PASSWORD")


def check_auth(username, password):
    return username == APP_USERNAME and password == APP_PASSWORD


def require_auth():
    return Response(
        "Authentication required",
        401,
        {"WWW-Authenticate": 'Basic realm="AI Study Planner"'}
    )


@app.before_request
def protect_site():
    if not APP_USERNAME or not APP_PASSWORD:
        return None

    auth = request.authorization

    if not auth or not check_auth(auth.username, auth.password):
        return require_auth()



api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("⚠ WARNING: OPENAI_API_KEY not configured!")
    client = None
else:
    client = OpenAI(api_key=api_key)
    print("✓ OpenAI client initialized")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate-steps', methods=['POST'])
def generate_steps():
    try:
        data = request.json
        brief = data.get('brief', '').strip()

        if not brief:
            return jsonify({
                "success": False,
                "error": "צריך להוסיף בריף למטלה כדי לייצר שלבים"
            }), 400

        if not client:
            return jsonify({
                "success": False,
                "error": "OpenAI client not configured"
            }), 500

        title = data.get('title', '')
        deadline = data.get('deadline', '')
        course = data.get('course', '')

        prompt = f"""You are helping a design student break down a studio assignment into a small number of meaningful work stages.

Assignment title: {title}
Course: {course}
Deadline: {deadline}
Brief: {brief}

Instructions:

Language
- Write in Hebrew only.

Structure
- Return 2 to 4 steps only. In most cases, prefer 3 steps.
- Each step should be a major work stage, not a tiny action.
- Do not write recipe-like micro-steps.
- Usually the structure should be:
  1. planning / design development
  2. execution / making / development
  3. submission materials, only if the brief explicitly requires them
  But it may change, according to the specific task.
- This structure may change according to the specific task.
- Do not invent submission requirements if they are not mentioned in the brief.

Tone
- Write in simple, natural Hebrew.
- The wording should feel like practical studio guidance, not like robotic instructions.
- Prefer concise, concrete phrasing.
- Avoid generic project-management language.

Additional emphasis
- Do not invent submission requirements if they are not mentioned in the brief.
- Focus on the main moves of the work, not on every small technical action.
- A good step is a central phase of the task, not a checklist item.
- Keep each step short: one sentence only.
- Keep it simple!

Return ONLY valid JSON in this exact format:
{{"steps": ["שלב 1", "שלב 2", "שלב 3"]}}
"""

        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt
        )

        response_text = response.output_text
        result = json.loads(response_text)

        return jsonify({
            "success": True,
            "steps": result.get("steps", [])
        })

    except json.JSONDecodeError:
        return jsonify({
            "success": False,
            "error": "התקבלה תשובה לא תקינה מה-AI"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"שגיאה: {str(e)}"
        }), 500

if __name__ == "__main__":
    # app.run(debug=True)
    app.run(debug=False, use_reloader=False)