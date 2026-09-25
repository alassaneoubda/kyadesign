"use client";

import { useState } from "react";

/** Copie le message (lien + code) à envoyer au client. */
export function ShareBox({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bo-share">
      <pre>{message}</pre>
      <button
        className="btn"
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(message);
          setCopied(true);
        }}
      >
        {copied ? "Message copié" : "Copier le message"}
      </button>
      <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
        Envoyer sur WhatsApp
      </a>
    </div>
  );
}
