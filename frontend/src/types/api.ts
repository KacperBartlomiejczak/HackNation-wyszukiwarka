// src/types/api.ts

// 1. Lista wszystkich dostępnych typów wiadomości
export type WebSocketMessageType =
  | "STATUS"
  | "PROGRESS"
  | "RESULT"
  | "ERROR"
  | "NEW_SCAN"
  | "GALLERY_DATA" // <--- Do ładowania listy plików na starcie
  | "ML_RESULT"; // <--- Do odbierania przetworzonego zdjęcia (Base64)

// 2. Pomocnicze interfejsy
export interface AnomalyBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
}

export interface GalleryImage {
  filename: string; // np. "skan_01.bmp"

  thumbnailBase64: string; // Pełny string "data:image/jpeg;base64,..."
}

// 3. GŁÓWNY KONTRAKT (Discriminated Union)
// To mówi TypeScriptowi, co siedzi w payloadzie zależnie od typu wiadomości
export type BackendMessage =
  // Wiadomość powitalna
  | {
      type: "STATUS";
      payload: { message: string; isReady: boolean };
    }
  // Pasek postępu (opcjonalne)
  | {
      type: "PROGRESS";
      payload: { percent: number; stepName: string };
    }
  // Wynik z ramkami (jeśli backend wysyła JSON z koordynatami)
  | {
      type: "RESULT";
      payload: {
        scanId: string;
        timestamp: string;
        hasAnomaly: boolean;
        anomalies: AnomalyBox[];
      };
    }
  // Nowy plik wykryty w folderze (pojedynczy)
  | {
      type: "NEW_SCAN";
      payload: {
        scanId: string;
        url: string;
        thumbnail?: string; // Opcjonalna miniaturka Base64
        timestamp: string;
      };
    }
  // --- NOWOŚCI POD TWÓJ KOD ---
  // 1. Cała galeria przy starcie (lista plików z backendu)
  | {
      type: "GALLERY_DATA";
      payload: {
        images: GalleryImage[];
      };
    }
  // 2. Wynik przetworzenia przez AI (surowy obrazek Base64)
  | {
      type: "ML_RESULT";
      payload: string; // Tu wpada surowy ciąg znaków Base64
    }
  // ---------------------------
  // Obsługa błędów
  | {
      type: "ERROR";
      payload: { code: number; message: string };
    };

// 4. Typ używany w stanie komponentu React (do wyświetlania listy)
export type ScanImage = {
  id: string; // Nazwa pliku lub ID
  url: string; // URL lub Base64 Data String
};
