import os
import asyncio
import cv2

class FolderWatcher:
    def __init__(self, folder_path, on_image_callback):
        self.folder_path = folder_path
        self.on_image_callback = on_image_callback
        self.stop = False

    async def start(self):
        known_files = set(os.listdir(self.folder_path))

        while not self.stop:
            current_files = set(os.listdir(self.folder_path))
            new_files = current_files - known_files

            for filename in new_files:
                fullpath = os.path.join(self.folder_path, filename)
                print(f"[WATCHER] New file detected: {fullpath}")

                image = cv2.imread(fullpath)
                if image is None:
                    print(f"[WATCHER] ERROR: cv2.imread failed for: {fullpath}")
                    continue

                await self.on_image_callback(fullpath,image)

            known_files = current_files
            await asyncio.sleep(5)