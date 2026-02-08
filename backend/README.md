# MailFlowAI Backend

This is the backend for the MailFlowAI application, built with FastAPI. It handles Gmail OAuth authentication and exposes endpoints for managing emails.

## Setup

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in your Google Client ID and Secret.
    ```bash
    cp .env.example .env
    ```

3.  **Run the Server:**
    ```bash
    cd backend
    uvicorn app.main:app --reload
    ```

## API Documentation

Once the server is running, visit `http://localhost:8000/docs` to see the interactive API documentation (Swagger UI).
