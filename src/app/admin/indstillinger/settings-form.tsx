"use client";

import { useCallback, useEffect, useState } from "react";

type ApiSuccess = {
  success?: boolean;
};

type ApiError = {
  error?: string;
};

type AdminUser = {
  id: string;
  username: string;
  created_at: string;
  created_by: string | null;
};

type UsersResponse = {
  users: AdminUser[];
  currentUserId: string | null;
  currentUsername: string | null;
};

export function SettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [usersPending, setUsersPending] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [createPending, setCreatePending] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersPending(true);
    setUsersError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiError;
        setUsersError(data.error ?? "Kunne ikke hente brugere.");
        return;
      }
      const data = (await res.json()) as UsersResponse;
      setUsers(Array.isArray(data.users) ? data.users : []);
      setCurrentUserId(data.currentUserId);
    } catch {
      setUsersError("Kunne ikke hente brugere.");
    } finally {
      setUsersPending(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("Udfyld alle felter.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Ny adgangskode og bekræftelse er ikke ens.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiError;
        setError(data.error ?? "Kunne ikke opdatere adgangskode.");
        return;
      }

      const data = (await res.json()) as ApiSuccess;
      if (data.success) {
        setMessage(
          "Adgangskoden er opdateret. Ved Vercel: redeploy siden så den nye adgangskode træder i kraft.",
        );
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setError("Kunne ikke kontakte serveren.");
    } finally {
      setPending(false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setUsersError(null);
    if (!newUsername.trim() || !newUserPassword.trim()) {
      setUsersError("Brugernavn og adgangskode er påkrævet.");
      return;
    }
    setCreatePending(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newUserPassword,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiError;
        setUsersError(data.error ?? "Kunne ikke oprette bruger.");
        return;
      }
      setNewUsername("");
      setNewUserPassword("");
      await loadUsers();
    } catch {
      setUsersError("Kunne ikke oprette bruger.");
    } finally {
      setCreatePending(false);
    }
  }

  async function removeUser(userId: string) {
    setUsersError(null);
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as ApiError;
      setUsersError(data.error ?? "Kunne ikke slette bruger.");
      return;
    }
    await loadUsers();
  }

  return (
    <div className="space-y-8">
      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">Skift adgangskode</h2>
        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <label className="block text-sm text-ink-muted">
            Nuværende adgangskode
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Ny adgangskode
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Bekræft ny adgangskode
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" disabled={pending} className="btn-outline disabled:opacity-60">
            {pending ? "Gemmer..." : "Gem"}
          </button>
        </form>

        {message ? <p className="mt-4 whitespace-pre-wrap text-sm text-accent">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-dust">{error}</p> : null}
      </section>

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">Brugere</h2>
        <p className="mt-2 text-sm text-ink-muted">Administrer brugere med adgang til admin.</p>

        <form onSubmit={createUser} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block text-sm text-ink-muted">
            Brugernavn
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              required
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Adgangskode
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              required
            />
          </label>
          <button type="submit" className="btn-outline h-10" disabled={createPending}>
            {createPending ? "Gemmer..." : "Tilføj bruger"}
          </button>
        </form>

        {usersPending ? <p className="mt-4 text-sm text-ink-muted">Henter brugere...</p> : null}
        {usersError ? <p className="mt-4 text-sm text-rose-dust">{usersError}</p> : null}

        <ul className="mt-6 space-y-3">
          {users.map((user) => {
            const isSelf = currentUserId === user.id;
            return (
              <li
                key={user.id}
                className="flex flex-col gap-3 rounded border border-secondary/40 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{user.username}</p>
                  <p className="text-xs text-ink-muted">
                    Oprettet: {new Date(user.created_at).toLocaleDateString("da-DK")}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-outline border-rose-dust/50 text-rose-dust hover:bg-rose-dust/10 disabled:opacity-50"
                  disabled={isSelf}
                  onClick={() => void removeUser(user.id)}
                >
                  {isSelf ? "Kan ikke slette dig selv" : "Slet"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
