import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from torchvision import models, transforms

from services.ImagePreprocessingService import ImagePreprocessingService


def process_ws_message(image):
    preprocessed_image = ImagePreprocessingService().preprocess_image(image)
    predicted_img = predict(preprocessed_image)
    return predicted_img


def predict(image):
    IMG_SIZE = 640
    # 1. gpu cxy cpu
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Używam: {device}")

    # 2. architektura modelu
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)

    try:
        model.load_state_dict(torch.load("./model/van_model_the_best.pth", map_location=device))
        print("Model załadowany pomyślnie!")
    except FileNotFoundError:
        print("BŁĄD: Nie znaleziono pliku modelu!")
        return

    model.to(device)
    model.eval()

    preprocess = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Ładowanie obrazu
    raw_img = image.copy()
    input_tensor = preprocess(raw_img).unsqueeze(0).to(device)

    # Predykcja
    output = model(input_tensor)
    probabilities = torch.nn.functional.softmax(output[0], dim=0)
    confidence_dirty = probabilities[1].item()
    print(f"Pewnosc globalna (cały van): {confidence_dirty * 100:.2f}%")

    if confidence_dirty < 0.10:
        print("Model twierdzi, że van jest CZYSTY.")
        is_clean = True
    else:
        is_clean = False

    # --- LAYER 3 (Precyzja) ---
    target_layers = [model.layer3[-1]]

    cam = GradCAM(model=model, target_layers=target_layers)
    targets = [ClassifierOutputTarget(1)]
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]

    # 6. wizualkzacja
    # wczytuje oryginal do OpenCV zeby na nim rysowac
    orig_cv = image.copy()

    heatmap_uint8 = (grayscale_cam * 255).astype(np.uint8)

    # --- DYNAMICZNY PRÓG ---
    max_val = heatmap_uint8.max()
    dynamic_thresh = int(max_val * 0.60)

    _, binary_map = cv2.threshold(heatmap_uint8, dynamic_thresh, 255, cv2.THRESH_BINARY)

    # Erozja
    kernel = np.ones((3, 3), np.uint8)
    binary_map = cv2.erode(binary_map, kernel, iterations=1)

    contours, _ = cv2.findContours(binary_map, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours and not is_clean:
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        print(f"Znaleziono {len(contours)} kandydatów (przed filtrowaniem pewności).")

        valid_anomalies = 0

        for i, c in enumerate(contours):
            x, y, w, h = cv2.boundingRect(c)

            # 1. Filtr rozmiaru (bez zmian)
            if w < 20 or h < 20: continue

            image_area = IMG_SIZE * IMG_SIZE
            box_area = w * h
            if box_area > (image_area * 0.60):
                continue

            # --- NOWOŚĆ: FILTR PEWNOŚCI LOKALNEJ ---
            # Wycinamy fragment heatmapy odpowiadający temu kwadratowi
            # grayscale_cam ma wartości od 0.0 do 1.0
            roi_map = grayscale_cam[y:y+h, x:x+w]

            # Obliczamy średnią wartość heatmapy w tym regionie
            avg_confidence = roi_map.mean()

            # JEŚLI ŚREDNIA PEWNOŚĆ W TYM KWADRACIE JEST < 50% -> POMIŃ
            if avg_confidence < 0.50:
                # print(f"Odrzucono słaby sygnał: {avg_confidence*100:.1f}%")
                continue

            valid_anomalies += 1

            # Rysowanie (tylko jeśli przeszło filtr)
            cv2.rectangle(orig_cv, (x, y), (x + w, y + h), (0, 0, 255), 2)

            # Dodaję % do napisu, żebyś widział ile wyszło
            label = f"Anomalia{valid_anomalies} ({avg_confidence*100:.0f}%)"
            cv2.putText(orig_cv, label, (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,255), 1)

        print(f"Ostatecznie zaznaczono {valid_anomalies} silnych anomalii.")

    return orig_cv