"use client";

import { useState } from "react";
import Link from "next/link";

type DistrictPosition = {
  id: string;
  title: string;
  status: "current" | "past";
  startYear: number | null;
  endYear: number | null;
};

type RosterMember = {
  id: string;
  name: string;
  lodge: string;
  photo: string | null;
  honorific: string | null;
  currentLodgeOffice: string | null;
  pastMasterYears: number[];
  isArchived: boolean;
  districtPositions: DistrictPosition[];
};

export default function RosterList({ members }: { members: RosterMember[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");

  const filtered = members.filter((member) => {
    const searchable = [
      member.name,
      member.lodge,
      member.honorific ?? "",
      member.currentLodgeOffice ?? "",
      ...member.pastMasterYears.map(String),
      ...member.districtPositions.map((p) => p.title),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(search.trim().toLowerCase());

    const matchesStatus =
      status === "all" ||
      (status === "active" && !member.isArchived) ||
      (status === "archived" && member.isArchived);

    return matchesSearch && matchesStatus;
  });

  const activeCount = members.filter((member) => !member.isArchived).length;

  return (
    <section>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            {activeCount} active brethren · {members.length} total
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, lodge, title, or year..."
          className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 outline-none focus:border-blue-600"
        />

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(["active", "archived", "all"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                status === option
                  ? "bg-blue-800 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-slate-500">
        Showing {filtered.length} brethren
      </p>

      <div className="space-y-3">
        {filtered.map((member) => (
          <article
            key={member.id}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo}
                alt={member.name}
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-lg font-bold text-slate-600">
                {member.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900">
                {member.honorific ? `${member.honorific} ` : ""}
                {member.name}
              </h2>

              <p className="text-sm text-slate-600">
                Past Master · {member.pastMasterYears.join(", ") || "Unknown"}
              </p>

              <p className="text-xs text-slate-500">{member.lodge}</p>

              {member.districtPositions.map((position) => (
                <p
                  key={position.id}
                  className="mt-1 text-xs font-medium text-blue-700"
                >
                  {position.status === "past" ? "Past " : ""}
                  {position.title}
                </p>
              ))}

              {member.currentLodgeOffice && (
                <p className="mt-1 text-xs text-slate-600">
                  {member.currentLodgeOffice}
                </p>
              )}

              {member.isArchived && (
                <span className="mt-2 inline-block rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-600">
                  Archived
                </span>
              )}
            </div>

            <Link
              href={`/admin/members/${member.id}/edit`}
              className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
            >
              Edit
            </Link>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">
            No brethren found.
          </div>
        )}
      </div>
    </section>
  );
}
