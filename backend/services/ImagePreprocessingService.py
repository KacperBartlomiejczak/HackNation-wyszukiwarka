import cv2
import numpy as np


class ImagePreprocessingService:
    def __init__(self):
        self.background_is_white = True
        self.padding = 10
    def preprocess_image(self, image):
        image = self.cut_image(image)
        return self.resize_image(image)

    def cut_image(self, image):
        # konwersja na szarości do analizy
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # progowanie (binaryzacja) - bardziej agresywne
        if self.background_is_white:
            _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
        else:
            _, thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)

        # 3. operacje do czyszczenia
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        # 4. szukam kontury na masce
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return image

        # 5. największy kontur
        c = max(contours, key=cv2.contourArea)

        # 6. współrzędne prostokąta otaczającego z konturu
        x, y, w, h = cv2.boundingRect(c)

        h_img, w_img = image.shape[:2]

        # dla góry i dołu: logika z PADDING
        y_min = max(0, y - self.padding)
        y_max = min(h_img, y + h + self.padding)

        # dla boków: minimal padding na początku
        x_min = max(0, x - self.padding)
        x_max = min(w_img, x + w + self.padding)

        # 7. wucina pierwszy raz (pełnie z paddingiem od góry/dołu, mało z boków)
        cropped = image[y_min:y_max, x_min:x_max]

        # 8. 2gi pass: tylko dla boków - użyj średniej jasności kolumn aby znaleźć tło
        if self.background_is_white:
            crop_gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)

            # licz średnią jasność dla każdej kolumny (dla boków)
            col_means = crop_gray.mean(axis=0)

            # szukanie kolumny gdzie średnia jasność jest < 220 (obiekt)
            object_cols = np.where(col_means < 220)[0]

            if len(object_cols) > 0:
                left = max(0, object_cols[0] - self.padding)
                right = min(cropped.shape[1], object_cols[-1] + self.padding)

                # ciecie tylko od boków, zachowana góra/dół
                cropped = cropped[:, left:right]

        return cropped

    def resize_image(self, image, target_size=640):
        """
            Skaluje obraz zachowując proporcje (dodaje czarne pasy).
        """
        h, w = image.shape[:2]
        scale = target_size / max(h, w)  # Skalujemy tak, by dłuższy bok miał 640
        new_w = int(w * scale)
        new_h = int(h * scale)

        # Zwykły resize z zachowaniem proporcji
        resized_image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Tworzymy czarne płótno 640x640
        canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)

        # Centrujemy obraz na płótnie
        x_offset = (target_size - new_w) // 2
        y_offset = (target_size - new_h) // 2

        canvas[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized_image

        return canvas