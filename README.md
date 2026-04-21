# AI Study Planner
AI Study Planner is a lightweight web app for managing academic assignments across multiple courses, with an AI-assisted feature that turns an assignment brief into a small number of practical work stages.
This project was built as a focused MVP for a portfolio submission related to programming and AI. The goal was not to build a large academic management system, but to create a small, real product around a meaningful use case.

## Why I built this
As a student, my academic workflow is fragmented across multiple courses, assignments, deadlines, devices, notes, and planning habits. In my case, this is even more pronounced because I study across two different academies.
Instead of building a generic AI demo, I wanted to build something small and useful around a real pain point: organizing multi-course academic work and using AI in a focused way inside that workflow.

## What the app does
- Create courses
- Add assignments under each course
- Store data locally in the browser
- Show deadlines and assignment progress
- Provide a simple two-week overview
- Keep important links for each course
- Open an assignment detail view
- Generate a short AI breakdown of an assignment brief into a few meaningful work stages
- Let the user edit the generated steps afterward

## Product focus
The AI feature is intentionally narrow.
It is not a general chatbot.  
It is a focused product feature that takes an assignment brief and turns it into 2–4 practical work stages.

A big part of the project was refining the AI output so that it would be:
- concise
- brief-specific
- natural in tone
- useful inside a real workflow
- not overly generic or overly detailed

## Tech stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Flask
- **Persistence:** localStorage
- **AI integration:** OpenAI API

## How it works
The user enters an assignment brief in the app.  
That data is sent through a Flask backend endpoint to the OpenAI API.  
The response is returned as structured steps and shown back in the UI as an editable task list.

## Running locally
### 1. Clone the repository
git clone https://github.com/adam191999/ai_study_planner.git
cd ai_study_planner

### 2. Create and activate a virtual environment
On Windows PowerShell:
python -m venv .venv
.venv\Scripts\Activate.ps1

### 3. Install dependencies
pip install -r requirements.txt

### 4. Create a .env file
Create a .env file in the project root and add your OpenAI API key:
OPENAI_API_KEY=your_api_key_here

### 5. Run the app
python app.py
Then open the local address shown in the terminal.

## Current scope
This project is an MVP. It was built to demonstrate:
- product thinking
- practical AI integration
- MVP scoping
- UI / UX sensitivity
- iterative refinement of model output
- the ability to build a small but real end-to-end project quickly

## Future improvements
- A dedicated chat agent for each course
- Support for linked or rolling assignments
- AI-generated stages with suggested dates integrated into the two-week overview
- A mobile version of the product
- Cloud sync and authentication

## Notes
- Data is currently stored locally with localStorage
- The AI-generated steps remain editable by the user
- This project is intentionally lightweight and focused rather than production-scale
