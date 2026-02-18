"use client";

import { useState } from "react";

type Props = {
  teams: { id: string; name: string }[];
  onUpdate: () => void;
};

export default function TeamsSection({ teams, onUpdate }: Props) {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Team name"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Add team
        </button>
      </form>
      <ul className="space-y-2">
        {teams.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="font-medium">{t.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
