"use client";

import { useEffect, useState } from "react";
import { CUSTOM_PALETTE, ICON_KEYS, ShelfIcon } from "@/lib/icons";

export function NewShelfModal({
  open,
  existingNames,
  onClose,
  onCreate,
}: {
  open: boolean;
  existingNames: string[];
  onClose: () => void;
  onCreate: (data: { name: string; icon: string; color: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("star");
  const [color, setColor] = useState(CUSTOM_PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset intenzionale del form ogni volta che il modale si (ri)apre.
    /* eslint-disable react-hooks/set-state-in-effect */
    setName("");
    setIcon("star");
    setColor(CUSTOM_PALETTE[Math.floor(Math.random() * CUSTOM_PALETTE.length)]);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Dai un nome allo scaffale.");
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError("Esiste già uno scaffale con questo nome.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ name: trimmed, icon, color });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-host" style={{ pointerEvents: open ? "auto" : "none" }}>
      <div className={`box-modal ${open ? "open" : ""}`} role="dialog" aria-label="Nuovo scaffale">
        <div className="modal-head">
          <h2>Nuovo scaffale</h2>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label htmlFor="sName">Nome dello scaffale</label>
            <input
              id="sName"
              type="text"
              placeholder="Es. Poesia, Fumetti, Biografie…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Icona</label>
            <div className="icon-grid">
              {ICON_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`icon-opt ${icon === k ? "sel" : ""}`}
                  onClick={() => setIcon(k)}
                >
                  <ShelfIcon name={k} size={17} />
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Colore</label>
            <div className="color-swatches">
              {CUSTOM_PALETTE.map((hex) => (
                <div
                  key={hex}
                  className={`color-swatch ${color === hex ? "sel" : ""}`}
                  style={{ background: hex }}
                  onClick={() => setColor(hex)}
                />
              ))}
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="btn-row">
            <button className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Creazione…" : "Crea scaffale"}
            </button>
            <button className="text-btn" onClick={onClose}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
