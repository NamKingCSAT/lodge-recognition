"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function NewMemberPage() {
  const [name, setName] = useState("");
  const [lodge, setLodge] = useState("Forest City Lodge");
  const [years, setYears] = useState("");
  const [honorific, setHonorific] = useState("");
  const [currentLodgeOffice, setCurrentLodgeOffice] = useState("");
  const [districtTitle, setDistrictTitle] = useState("");
  const [districtStatus, setDistrictStatus] = useState<"current" | "past">(
    "current",
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const rawYears = years.split(",").map((year) => year.trim());

    const parsedYears = rawYears.map(Number);

    if (
      rawYears.some((year) => year === "") ||
      parsedYears.some(
        (year) =>
          !Number.isInteger(year) ||
          year < 1700 ||
          year > new Date().getFullYear(),
      )
    ) {
      setError("Enter valid PM years separated by commas.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          lodge,
          pastMasterYears: parsedYears,
          honorific,
          currentLodgeOffice,
          districtTitle,
          districtStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save member.");
      }

      setMessage(`${name} was added successfully!`);

      // Reset for the next entry
      setName("");
      setYears("");
      setHonorific("");
      setCurrentLodgeOffice("");
      setDistrictTitle("");
      setDistrictStatus("current");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-xl">
        <Link
          href="/admin"
          className="mb-5 inline-block text-sm font-medium text-blue-700"
        >
          ← Back to Administration
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Add Brother</h1>

          <p className="mt-2 text-sm text-slate-600">
            Add a Past Master or District Officer to the roster.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              Full Name *
              <input
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                placeholder="e.g. John Smith"
              />
            </label>

            <label className="block text-sm font-medium">
              Lodge *
              <input
                required
                maxLength={150}
                value={lodge}
                onChange={(e) => setLodge(e.target.value)}
                className={inputStyle}
              />
            </label>

            <label className="block text-sm font-medium">
              Past Master Year(s) *
              <input
                required
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="e.g. 2005, 2008"
                className={inputStyle}
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
                placeholder="e.g. W.B. or R.W.B."
                className={inputStyle}
              />
            </label>

            <label className="block text-sm font-medium">
              Current Lodge Office
              <input
                maxLength={150}
                value={currentLodgeOffice}
                onChange={(e) => setCurrentLodgeOffice(e.target.value)}
                placeholder="e.g. Lodge Education Officer"
                className={inputStyle}
              />
            </label>

            <div className="border-t border-slate-200 pt-5">
              <h2 className="text-lg font-semibold">District Position</h2>
              <p className="mb-4 text-xs text-slate-500">
                Optional. Leave blank for a regular Past Master.
              </p>

              <label className="block text-sm font-medium">
                Position Title
                <input
                  maxLength={150}
                  value={districtTitle}
                  onChange={(e) => setDistrictTitle(e.target.value)}
                  placeholder="e.g. District Deputy Grand Master"
                  className={inputStyle}
                />
              </label>

              {districtTitle.trim() && (
                <label className="mt-4 block text-sm font-medium">
                  Position Status
                  <select
                    value={districtStatus}
                    onChange={(e) =>
                      setDistrictStatus(e.target.value as "current" | "past")
                    }
                    className={inputStyle}
                  >
                    <option value="current">Current</option>
                    <option value="past">Past</option>
                  </select>
                </label>
              )}
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
              {saving ? "Saving..." : "Save Brother"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
