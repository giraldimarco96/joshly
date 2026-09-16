"use client";

import { useEffect, useRef, useState } from "react";

export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState("Avvio della fotocamera…");

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    let cancelled = false;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        if (cancelled) return;
        setMsg("Inquadra il codice a barre ISBN sul retro del libro.");
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result) {
            const text = result.getText();
            if (/^[0-9Xx-]{8,17}$/.test(text)) {
              onDetected(text.replace(/-/g, ""));
            }
          }
        });
      } catch {
        if (!cancelled) {
          setMsg(
            "Non riesco ad accedere alla fotocamera (permesso negato o non supportata su questo browser). Usa la ricerca per titolo o ISBN qui sopra."
          );
        }
      }
    }
    start();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="scanner-box">
      <video ref={videoRef} muted playsInline />
      <div className="scanner-frame" />
      <div className="scanner-msg">
        {msg}{" "}
        <button type="button" className="text-btn" onClick={onClose} style={{ display: "inline" }}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
