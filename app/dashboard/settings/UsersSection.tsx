"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

export default function UsersSection() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message ?? "Invite sent." });
        setInviteEmail("");
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to send invite" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send invite" });
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    setUpdating(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
        setMessage({ type: "success", text: "Role updated." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error ?? "Failed to update" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update" });
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading users...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Invite AE</h3>
        <p className="text-sm text-gray-600 mb-4">
          Send an invite to an Account Executive. They&apos;ll receive an email to
          sign up and will join your account as an AE.
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="ae@company.com"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent"
            required
          />
          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {inviting ? "Sending..." : "Send invite"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">User management</h3>
        <p className="text-sm text-gray-600 mb-4">
          Change roles for users in your account. Admins can access Settings and
          invite AEs.
        </p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {u.full_name || u.email}
                    </span>
                    {u.full_name && (
                      <span className="text-gray-500 block text-xs">
                        {u.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value)
                      }
                      disabled={updating === u.id}
                      className="px-2 py-1 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-accent"
                    >
                      <option value="admin">Admin</option>
                      <option value="ae">AE</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
