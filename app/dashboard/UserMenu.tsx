"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Props = {
  fullName: string | null;
  photoUrl: string | null;
  email: string;
};

export default function UserMenu({
  fullName,
  photoUrl,
  email,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial =
    (fullName || email)?.charAt(0)?.toUpperCase() ?? "?";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={fullName || "Profile"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium shrink-0">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
          <Link
            href="/dashboard/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Account
          </Link>
          <form action="/auth/signout" method="post" className="border-t border-gray-100">
            <button
              type="submit"
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
