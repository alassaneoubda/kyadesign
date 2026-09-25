"use client";

import { useActionState } from "react";
import { loginAction, unlockAlbumAction } from "@/server/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="bo-form">
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="ton@email.com"
          required
        />
      </label>
      <label>
        Mot de passe
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </label>
      {state?.error && <p className="bo-error">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Vérification…" : "Entrer"}
      </button>
    </form>
  );
}

export function GateForm() {
  const [state, action, pending] = useActionState(unlockAlbumAction, null);
  return (
    <form id="gate-form" action={action}>
      <input id="code" name="code" type="text" placeholder="Code d’accès" autoComplete="off" required />
      <button className="btn" type="submit" disabled={pending}>{pending ? "Vérification…" : "Voir mes photos"}</button>
      <p className="error" id="gate-error">{state?.error ?? ""}</p>
    </form>
  );
}
