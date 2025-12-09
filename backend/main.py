from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from routes.http import router as http_router
from routes.ws import router as ws_router
from utils.file_watcher import FolderWatcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(http_router)
app.include_router(ws_router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)