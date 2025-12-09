"use client";

import { useWebSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";
import { ScanImage, BackendMessage } from "@/types/api";

import Image from "next/image";
import FullscreenImage from "../components/FullscreenImage";

export default function Home() {
  const { status, lastMessage, isConnected } = useWebSocket<BackendMessage>(
    process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  );

  const [scannedImages, setScannedImages] = useState<ScanImage[]>([]);

  // 1. ODCZYT Z LOCALSTORAGE (Tylko raz przy uruchomieniu)
  useEffect(() => {
    const savedData = localStorage.getItem("kas_scans_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setScannedImages(parsed);
        console.log(
          "💾 Wczytano dane z localStorage:",
          parsed.length,
          "elementów"
        );
      } catch (e) {
        console.error("Błąd odczytu localStorage", e);
      }
    }
  }, []);

  // 2. ZAPIS DO LOCALSTORAGE (Za każdym razem jak zmieni się tablica zdjęć)
  useEffect(() => {
    // Zapisujemy tylko jeśli mamy jakieś zdjęcia, żeby nie nadpisać pustą tablicą przy starcie
    if (scannedImages.length > 0) {
      try {
        localStorage.setItem("kas_scans_data", JSON.stringify(scannedImages));
      } catch (e) {
        console.error("⚠️ Błąd zapisu (pewnie limit 5MB):", e);
        // Opcjonalnie: usuń najstarsze zdjęcie i spróbuj znowu (hackathon fix)
        if (scannedImages.length > 10) {
          const smallerArr = scannedImages.slice(0, 10); // Trzymaj tylko 10 ostatnich
          localStorage.setItem("kas_scans_data", JSON.stringify(smallerArr));
        }
      }
    }
  }, [scannedImages]);

  // --- LOGIKA WEBSOCKET (Tu nic nie psujemy, tylko dodajemy dane) ---
  useEffect(() => {
    if (!lastMessage) return;

    // A. ODBIERANIE GALERII (Z SERWERA)
    if (lastMessage.type === "GALLERY_DATA") {
      console.log("📥 Otrzymano galerię:", lastMessage.payload.images.length);
      const galleryImages: ScanImage[] = lastMessage.payload.images.map(
        (img) => ({
          id: img.filename,
          url: img.thumbnailBase64,
        })
      );

      // Łączymy to co przyszło z serwera z tym co mamy lokalnie (bez duplikatów)
      setScannedImages((prev) => {
        const newImgs = galleryImages.filter(
          (g) => !prev.some((p) => p.id === g.id)
        );
        return [...newImgs, ...prev];
      });
    }

    // B. NOWY PLIK Z FOLDERU
    if (lastMessage.type === "NEW_SCAN") {
      console.log("📸 Nowy plik wykryty:", lastMessage.payload.scanId);
      const newImage: ScanImage = {
        id: lastMessage.payload.scanId,
        url: lastMessage.payload.thumbnail || lastMessage.payload.url,
      };

      setScannedImages((prev) => {
        if (prev.some((p) => p.id === newImage.id)) return prev;
        return [newImage, ...prev];
      });
    }

    // C. WYNIK ANALIZY (ML)
    if (lastMessage.type === "ML_RESULT") {
      console.log("🧠 Otrzymano wynik analizy!");
      const rawBase64 = lastMessage.payload;

      console.log(lastMessage.name);
      const formattedUrl = `data:image/jpeg;base64,${rawBase64}`;

      const analyzedImage: ScanImage = {
        id: lastMessage.name, // Unikalne ID
        url: formattedUrl,
      };

      setScannedImages((prev) => [analyzedImage, ...prev]);
    }
  }, [lastMessage]);

  // --- FUNKCJA CZYSZCZĄCA (Dla Ciebie do testów) ---
  const clearHistory = () => {
    localStorage.removeItem("kas_scans_data");
    setScannedImages([]);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-24 gap-y-16 px-16 bg-white sm:items-start">
        {/* HEADER */}
        <div className="w-full flex justify-between items-start">
          <Image
            src="/kas.png"
            alt="Logo Krajowej Rady Skarbowej"
            width={250}
            height={50}
            priority
          />
          <div className="flex flex-col items-end gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                isConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isConnected ? "🟢 ONLINE" : "🔴 OFFLINE"}
            </div>
            {/* Przycisk do czyszczenia historii - przyda się na demo */}
            {scannedImages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[10px] text-zinc-400 hover:text-red-500 underline"
              >
                Wyczyść historię
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-sm text-3xl font-semibold leading-10 tracking-tight text-black">
            System Analizy RTG
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600">
            Obrazy przetwarzane przez AI pojawią się poniżej automatycznie i
            zostaną zapisane w pamięci.
          </p>
        </div>

        {/* LISTA WYNIKÓW */}
        <div className="flex flex-col gap-8 text-base font-medium w-full justify-center items-center">
          <div className="flex justify-between w-full items-end">
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black">
              Wyniki ({scannedImages.length}):
            </h1>
          </div>

          {scannedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 w-full border-2 border-dashed border-zinc-200 rounded-xl">
              {isConnected ? (
                <p className="text-zinc-500 font-medium">
                  Czekam na dane z silnika AI...
                </p>
              ) : (
                <p className="text-red-400 font-medium animate-pulse">
                  Łączenie z serwerem...
                </p>
              )}
            </div>
          ) : (
            // Renderujemy całą tablicę
            scannedImages.map((img) => (
              <div key={img.id} className="relative w-full group">
                <div className="absolute top-4 left-4 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                  {img.id}
                </div>
                <FullscreenImage
                  src={img.url}
                  alt={`Skan ${img.id}`}
                  className="rounded-2xl border border-zinc-200 shadow-lg"
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
