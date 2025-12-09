# Wirtualna Wyszukiwarka - Project Overview

This project is a full-stack web application composed of a Next.js frontend and a Python backend. The two services are managed using `docker-compose.yaml`.

## Key Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, PyTorch (for machine learning)
- **Orchestration**: Docker

## Building and Running the Project

The entire application can be built and run using Docker Compose.

1.  **Environment Setup**:
    This project requires a `.env` file in the root directory with the following variable:
    ```
    SEARCH_FOLDER=<path_to_your_images_folder>
    ```
    This variable points to the directory on your host machine that the backend will watch for image files.

2.  **Run with Docker Compose**:
    From the root of the project, run the following command:
    ```bash
    docker-compose up -d --build
    ```

This will:
- Build the `backend` Docker image.
- Pull the `node:21-alpine` image for the frontend.
- Start both services in detached mode.

The frontend will be accessible at `http://localhost:3000` and the backend at `http://localhost:8000`.

## Services

### Frontend

The frontend is a Next.js application located in the `/frontend` directory.

- **Purpose**: Provides the user interface for the application.
- **Development**:
    - To run the development server locally (without Docker), navigate to the `/frontend` directory and run:
      ```bash
      pnpm install
      pnpm dev
      ```
- **Scripts** (`package.json`):
    - `dev`: Starts the Next.js development server.
    - `build`: Creates a production build of the application.
    - `start`: Starts the production server.
    - `lint`: Runs the ESLint linter.

### Backend

The backend is a FastAPI application located in the `/backend` directory.

- **Purpose**: Serves a machine learning model (likely for image analysis) via a REST API and WebSockets. It also watches a specified folder for new images.
- **Dependencies**: The backend uses `fastapi`, `torch`, `torchvision`, and `opencv-python`, among others. Dependencies are managed with `uv`.
- **Development**:
    - The application is started with `uvicorn` inside the Docker container. The main application object is in `main.py`.
    - It includes routers for both HTTP and WebSocket connections.
