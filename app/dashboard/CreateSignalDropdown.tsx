"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const OPTIONS = [
  { label: "For a prospect", type: "prospecting", href: "/dashboard/new?type=prospecting" },
  { label: "Mid-deal", type: "mid_deal", href: "/dashboard/new?type=mid_deal" },
  { label: "Deal stalled", type: "deal_stalled", href: "/dashboard/new?type=deal_stalled" },
] as const;

export default function CreateSignalDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
      >
        Create Signal
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
          {OPTIONS.map((opt) => (
            <Link
              key={opt.type}
              href={opt.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {opt.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
