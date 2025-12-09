# Wykrywacz Anomalii AI do Skanów Rentgenowskich

Ten projekt to aplikacja webowa typu full-stack, zaprojektowana w celu wspierania funkcjonariuszy celnych w identyfikacji anomalii na obrazach rentgenowskich pojazdów. Wykorzystuje model AI do automatycznego porównywania skanów RTG i podkreślania potencjalnych nieregularności, modyfikacji lub ukrytych obiektów, które mogą wskazywać na przemyt.

System został opracowany w celu wsparcia Krajowej Administracji Skarbowej (KAS) poprzez automatyzację analizy dużej ilości obrazów rentgenowskich z przejść granicznych, co czyni proces kontroli szybszym i bardziej efektywnym.

## Jak Zacząć

Całą aplikację można zbudować i uruchomić za pomocą Docker Compose.
Sztuczna inteligencja była trenowana na niebieskich zdjęciach.
Trzeba dodać zdjęcia luzem, bez folderów.
Po odpaleniu dockera dopiero wrzucić zdjęcia do folderu.

### Wymagania Wstępne

-   Docker i Docker Compose
-   Lokalny folder zawierający obrazy rentgenowskie, które chcesz analizować.

### Instalacja i Uruchomienie

1.  **Utwórz Plik Środowiskowy**:
    Utwórz plik `.env` w głównym katalogu projektu. Dodaj następującą linię, zastępując symbol zastępczy bezwzględną ścieżką do folderu z obrazami:
    ```
    SEARCH_FOLDER=<ścieżka_do_twojego_folderu_z_obrazami>
    ```
    Ta zmienna montuje folder z obrazami do kontenera backendu w celu ich przetwarzania.

2.  **Zbuduj i Uruchom za pomocą Docker Compose**:
    Otwórz terminal w głównym katalogu projektu i uruchom:
    ```bash
    docker-compose up -d --build
    ```

3.  **Dostęp do Aplikacji**:
    -   Frontend będzie dostępny pod adresem **`http://localhost:3000`**.
    -   API backendu będzie dostępne pod adresem **`http://localhost:8000`**.

## Problem

Operatorzy celni codziennie ręcznie sprawdzają tysiące obrazów rentgenowskich w poszukiwaniu przemycanych towarów ukrytych w konstrukcjach pojazdów lub w ładunku. Proces ten jest czasochłonny i podatny na błędy ludzkie, zwłaszcza w przypadku subtelnych modyfikacji. Ten projekt ma na celu dostarczenie inteligentnego narzędzia, które wspiera operatorów poprzez automatyczne oznaczanie podejrzanych obszarów.

## Rozwiązanie

Aplikacja dostarcza interfejs webowy, w którym użytkownicy mogą przeglądać i zarządzać skanami rentgenowskimi. Potężny backend, napędzany przez model uczenia maszynowego oparty na PyTorch, wykonuje detekcję anomalii.

### Główne Funkcje

-   **Wykrywanie Anomalii za pomocą AI**: Model głębokiego uczenia analizuje obrazy rentgenowskie w formacie `.bmp` w celu znalezienia odchyleń od normalnych wzorców.
-   **Porównywanie Obrazów**: System potrafi porównać skan rentgenowski pojazdu z "czystym" obrazem referencyjnym lub zidentyfikować anomalie na podstawie nauczonych wzorców.
-   **Wizualna Informacja Zwrotna**: Podejrzane obszary i wykryte anomalie są podświetlane bezpośrednio na obrazie w interfejsie użytkownika.
-   **Zautomatyzowany Przepływ Pracy**: Mechanizm obserwujący foldery automatycznie przetwarza nowe obrazy rentgenowskie, gdy tylko się pojawią.
-   **Skalowalna Architektura**: Zaprojektowana do obsługi dużych plików graficznych (~50MB każdy) i dużych zbiorów danych.

## Stos Technologiczny

-   **Frontend**: Next.js, React, TypeScript, Tailwind CSS
-   **Backend**: Python, FastAPI, PyTorch, OpenCV
-   **Orkiestracja**: Docker

## Architektura Systemu

Projekt wykorzystuje nowoczesną architekturę klient-serwer:
-   **Frontend** to aplikacja Next.js zapewniająca responsywny i interaktywny interfejs użytkownika do przeglądania wyników skanowania.
-   **Backend** to usługa FastAPI, która udostępnia REST API i WebSocket do przetwarzania obrazów. Uruchamia model AI do wykrywania anomalii i zarządza danymi obrazów.
-   **Docker Compose** koordynuje obie usługi, co ułatwia konfigurację i wdrożenie.

