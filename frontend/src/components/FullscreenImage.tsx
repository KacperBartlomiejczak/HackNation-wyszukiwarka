"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";


interface FullscreenImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export default function FullscreenImage({
  src,
  alt = "",
  className = "",
}: FullscreenImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      {/* 1. Obrazek w treści strony (Miniatura) */}

      <div
        className={cn(
          "relative w-[90%] h-[200px] rounded-xl cursor-zoom-in overflow-hidden",
          className
        )}
        onClick={() => setIsFullscreen(true)}
      >
        <Image
          src={src}
          alt={alt}
          className="object-cover hover:scale-105 transition-transform duration-300"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* 2. Tryb pełnoekranowy (Overlay) */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Kontener na obrazek pełnoekranowy */}
          <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              priority // Ważne: ładujemy priorytetowo w trybie fullscreen
              sizes="100vw"
            />
          </div>

          {/* Opcjonalny przycisk zamknięcia */}
          <button className="absolute top-5 right-5 text-white p-2 bg-black/50 rounded-full hover:bg-white/20 transition">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
