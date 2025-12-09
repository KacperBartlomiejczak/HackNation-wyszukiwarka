import { useCallback, useEffect, useRef, useState } from "react";
import { BackendMessage } from "@/types/api";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<BackendMessage | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected"); // Startujemy od disconnected
  const socketRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      console.warn("WebSocket is not open. Cannot send message.");
    }
  }, []);

  useEffect(() => {
    // 1. ZABEZPIECZENIE: Jeśli socket już istnieje, nie robimy nic.
    // To przerywa pętlę nieskończonych połączeń!
    if (socketRef.current) return;

    console.log("🔄 Próba połączenia z:", url);
    setStatus("connecting");

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ Connected!");
      setStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data) as BackendMessage;
        console.log("📩 Actual data: ", parsedData);
        setLastMessage(parsedData);
      } catch (error) {
        console.error("⚠️ Error parsing message: ", error);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error: ", error);
      setStatus("error");
    };

    socket.onclose = (event) => {
      console.log("🔒 WebSocket closed code:", event.code);
      if (status !== "error") setStatus("disconnected");
      // Ważne: czyścimy referencję przy zamknięciu
      socketRef.current = null;
    };

    // Funkcja czyszcząca (odpala się tylko przy odmontowaniu komponentu)
    return () => {
      console.log("🧹 Cleaning up WebSocket");
      if (socket.readyState === 1) {
        // 1 = OPEN
        socket.close();
      }
      socketRef.current = null;
    };
  }, [url]); // <--- TYLKO URL W ZALEŻNOŚCIACH! To klucz do sukcesu.

  return {
    status,
    lastMessage,
    isConnected: status === "connected",
    sendMessage,
  };
}
