import base64

import cv2
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.ml_service import process_ws_message
from utils.file_watcher import FolderWatcher
import asyncio

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Connected")

    # --- FIX: Define the callback INSIDE the endpoint ---
    # Now it has direct access to the 'websocket' variable above.
    async def on_new_image(fullpath,image):
        print(f"[WS] Processing new image: {image}")
        try:
            # 1. Process the image
            result = process_ws_message(image)

            success, buffer = cv2.imencode('.jpg', result)

            if success:
                # Convert to base64 bytes -> decode to utf-8 string
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            else:
                jpg_as_text = None
                print("[WS] Failed to encode image.")

            # 2. Send the result back using the captured 'websocket'
            await websocket.send_json({
                "name":fullpath.strip("images/"),
                "type": "ML_RESULT",
                "payload": jpg_as_text
            })
        except Exception as e:
            print(f"[WS] Error sending ML result: {e}")

    # Initialize watcher with the closure function
    # Note: We only pass 'on_new_image', not 'websocket', because the function already has it.
    watcher = FolderWatcher("images", on_new_image)

    # Start the watcher task
    # Note: Ensure watcher.start() is compatible with this setup
    watcher_task = asyncio.create_task(watcher.start())

    try:
        while True:
            # Keep the main loop alive to listen for client messages
            msg = await websocket.receive_text()

            # (Optional) Handle incoming text messages
            response_payload = process_ws_message(msg)
            await websocket.send_json({
                "type": "RESULT",
                "payload": response_payload
            })

    except WebSocketDisconnect:
        print("[WS] Disconnected")
        watcher.stop = True
        watcher_task.cancel()

    except Exception as e:
        print(f"[WS] Error: {e}")
        watcher.stop = True
        watcher_task.cancel()