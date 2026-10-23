"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Position = {
  title: string;
  status: "current" | "past";
  startYear: number | null;
  endYear: number | null;
};

type Member = {
  id: string;
  name: string;
  lodge: string;
  pastMasterYears: number[];
  honorific: string | null;
  currentLodgeOffice: string | null;
  notes: string | null;
  isArchived: boolean;
  districtPositions: Position[];
};

export default function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter();

  const [name, setName] = useState(member.name);
  const [lodge, setLodge] = useState(member.lodge);
  const [years, setYears] = useState(member.pastMasterYears.join(", "));
  const [honorific, setHonorific] = useState(member.honorific ?? "");
  const [currentOffice, setCurrentOffice] = useState(
    member.currentLodgeOffice ?? "",
  );
  const [notes, setNotes] = useState(member.notes ?? "");

  const [positions, setPositions] = useState(
    member.districtPositions.map((p) => ({
      ...p,
      startYear: p.startYear?.toString() ?? "",
      endYear: p.endYear?.toString() ?? "",
    })),
  );

  const [isArchived, setIsArchived] = useState(member.isArchived);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900";

  function updatePosition(
    index: number,
    changes: Partial<(typeof positions)[number]>,
  ) {
    setPositions((previous) =>
      previous.map((p, i) => (i === index ? { ...p, ...changes } : p)),
    );
  }

  function parseOptionalYear(value: string) {
    return value.trim() === "" ? null : Number(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const rawYears = years.split(",").map((y) => y.trim());
    const parsedYears = rawYears.map(Number);
    const currentYear = new Date().getFullYear();

    if (
      rawYears.some((y) => !y) ||
      parsedYears.some(
        (y) => !Number.isInteger(y) || y < 1700 || y > currentYear,
      )
    ) {
      setError("Enter valid PM years separated by commas.");
      return;
    }

    const parsedPositions = positions.map((p) => ({
      title: p.title.trim(),
      status: p.status,
      startYear: parseOptionalYear(p.startYear),
      endYear: p.status === "current" ? null : parseOptionalYear(p.endYear),
    }));

    if (
      parsedPositions.some(
        (p) =>
          !p.title ||
          [p.startYear, p.endYear].some(
            (year) =>
              year !== null &&
              (!Number.isInteger(year) || year < 1700 || year > currentYear),
          ) ||
          (p.startYear !== null &&
            p.endYear !== null &&
            p.endYear < p.startYear),
      )
    ) {
      setError("Check District titles and service years.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(member.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            lodge,
            pastMasterYears: parsedYears,
            honorific,
            currentLodgeOffice: currentOffice,
            notes,
            districtPositions: parsedPositions,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Save failed");
      }

      setMessage("Member updated successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function changeArchiveStatus() {
    const action = isArchived ? "restore" : "archive";

    if (
      !window.confirm(
        action === "archive"
          ? "Archive this brother? He will disappear from the public roster."
          : "Restore this brother to the active roster?",
      )
    )
      return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(member.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Update failed");
      }

      setIsArchived(action === "archive");
      setMessage(
        action === "archive" ? "Brother archived." : "Brother restored.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/members"
          className="mb-5 inline-block text-sm font-medium text-blue-700"
        >
          ← Back to Manage Roster
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Edit Brother</h1>
          <p className="mt-2 text-sm text-slate-600">
            Update information and District positions.
          </p>

          {isArchived && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This brother is archived.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              Full Name *
              <input
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Lodge *
              <input
                required
                maxLength={150}
                value={lodge}
                onChange={(e) => setLodge(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Past Master Year(s) *
              <input
                required
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Separate multiple years with commas.
              </span>
            </label>

            <label className="block text-sm font-medium">
              Honorific
              <input
                maxLength={50}
                value={honorific}
                onChange={(e) => setHonorific(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Current Lodge Office
              <input
                maxLength={150}
                value={currentOffice}
                onChange={(e) => setCurrentOffice(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Notes
              <textarea
                maxLength={2000}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">District Positions</h2>

                <button
                  type="button"
                  onClick={() =>
                    setPositions((prev) => [
                      ...prev,
                      {
                        title: "",
                        status: "current",
                        startYear: "",
                        endYear: "",
                      },
                    ])
                  }
                  className="rounded-lg bg-blue-800 px-3 py-2 text-sm font-semibold text-white"
                >
                  + Add Position
                </button>
              </div>

              {positions.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  No District positions recorded.
                </p>
              )}

              <div className="mt-4 space-y-4">
                {positions.map((position, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Position {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() =>
                          setPositions((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-sm font-medium text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <label className="block text-sm font-medium">
                      Position Title
                      <input
                        required
                        maxLength={150}
                        value={position.title}
                        onChange={(e) =>
                          updatePosition(index, {
                            title: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="District Deputy Grand Master"
                      />
                    </label>

                    <label className="mt-3 block text-sm font-medium">
                      Status
                      <select
                        value={position.status}
                        onChange={(e) =>
                          updatePosition(index, {
                            status: e.target.value as "current" | "past",
                            endYear: "",
                          })
                        }
                        className={inputClass}
                      >
                        <option value="current">Current</option>
                        <option value="past">Past</option>
                      </select>
                    </label>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="block text-sm font-medium">
                        Start Year
                        <input
                          type="number"
                          min={1700}
                          max={new Date().getFullYear()}
                          value={position.startYear}
                          onChange={(e) =>
                            updatePosition(index, {
                              startYear: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-sm font-medium">
                        End Year
                        <input
                          type="number"
                          min={1700}
                          max={new Date().getFullYear()}
                          disabled={position.status === "current"}
                          value={position.endYear}
                          onChange={(e) =>
                            updatePosition(index, {
                              endYear: e.target.value,
                            })
                          }
                          className={`${inputClass} disabled:bg-slate-200`}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-800 px-4 py-4 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <h2 className="font-semibold">Roster Status</h2>
            <p className="my-2 text-sm text-slate-600">
              Archiving preserves this record in Neon but removes it from the
              active public roster.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={changeArchiveStatus}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {isArchived ? "Restore Brother" : "Archive Brother"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
