"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { members, type Member } from "../data/members";

type Tab = "directory" | "attendance" | "recognition";
type SortOption = "year-asc" | "year-desc" | "name-asc" | "name-desc";
type MemberFilter =
  | "all"
  | "home"
  | "district-all"
  | "district-current"
  | "district-past"
  | "district-none";

const HOME_LODGE = "Forest City Lodge";
const STORAGE_KEY = "lodge-recognition-attendance";
const ATTENDANCE_EVENT = "lodge-attendance-updated";

// --------------------
// Attendance storage
// --------------------

function getAttendanceSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerAttendanceSnapshot() {
  return "[]";
}

function subscribeToAttendance(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ATTENDANCE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ATTENDANCE_EVENT, callback);
  };
}

// --------------------
// Member utilities
// --------------------

function isHomePastMaster(member: Member) {
  return member.lodge === HOME_LODGE;
}

function getFirstYear(member: Member) {
  return member.pastMasterYears.length
    ? Math.min(...member.pastMasterYears)
    : Number.MAX_SAFE_INTEGER;
}

function getYearLabel(member: Member) {
  return member.pastMasterYears.length
    ? [...member.pastMasterYears].sort((a, b) => a - b).join(", ")
    : "Unknown";
}

function getDistrictLabel(member: Member) {
  return member.districtPositions
    .map((position) =>
      position.status === "past" ? `Past ${position.title}` : position.title,
    )
    .join(" · ");
}

function hasDistrictStatus(member: Member, status: "current" | "past") {
  return member.districtPositions.some(
    (position) => position.status === status,
  );
}

function matchesMemberFilter(member: Member, filter: MemberFilter) {
  switch (filter) {
    case "home":
      return isHomePastMaster(member);

    case "district-all":
      return member.districtPositions.length > 0;

    case "district-current":
      return hasDistrictStatus(member, "current");

    case "district-past":
      return hasDistrictStatus(member, "past");

    case "district-none":
      return member.districtPositions.length === 0;

    default:
      return true;
  }
}

function sortMembers(list: Member[], sort: SortOption) {
  return [...list].sort((a, b) => {
    switch (sort) {
      case "year-desc":
        return (
          getFirstYear(b) - getFirstYear(a) || a.name.localeCompare(b.name)
        );
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return (
          getFirstYear(a) - getFirstYear(b) || a.name.localeCompare(b.name)
        );
    }
  });
}

// --------------------
// Member photo
// --------------------

function MemberPhoto({
  member,
  size = "normal",
}: {
  member: Member;
  size?: "compact" | "normal" | "large";
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);

  const sizes = {
    compact: "h-11 w-11 text-sm",
    normal: "h-16 w-16 text-lg",
    large: "h-24 w-24 text-2xl",
  };

  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  if (!member.photo || failedPhoto === member.photo) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-slate-200 font-bold text-slate-600 ${sizes[size]}`}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={member.photo}
      alt={member.name}
      onError={() => setFailedPhoto(member.photo ?? null)}
      className={`shrink-0 rounded-xl object-cover ${sizes[size]}`}
    />
  );
}

// --------------------
// Member card
// --------------------

function MemberCard({
  member,
  selectable,
  checked,
  onToggle,
  size = "normal",
}: {
  member: Member;
  selectable?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  size?: "compact" | "normal" | "large";
}) {
  const homePM = isHomePastMaster(member);
  const districtLabel = getDistrictLabel(member);

  const content = (
    <>
      <MemberPhoto member={member} size={size} />

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">
          {member.honorific ? `${member.honorific} ` : ""}
          {member.name}
        </h3>

        <p className="text-sm text-slate-600">
          Past Master · {getYearLabel(member)}
        </p>

        <p className="text-xs text-slate-500">{member.lodge}</p>

        {districtLabel && (
          <p className="mt-1 text-sm font-medium text-blue-700">
            {districtLabel}
          </p>
        )}

        {member.currentLodgeOffice && (
          <p className="text-sm text-slate-700">{member.currentLodgeOffice}</p>
        )}

        {!homePM && (
          <span className="mt-2 inline-block rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900">
            Visiting Officer
          </span>
        )}
      </div>

      {selectable && (
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-sm font-bold ${
            checked
              ? "border-blue-800 bg-blue-800 text-white"
              : "border-slate-400 bg-white"
          }`}
        >
          {checked ? "✓" : ""}
        </span>
      )}
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={`${member.name}: ${
          checked ? "present" : "absent"
        }. Toggle attendance.`}
        className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition ${
          checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-slate-200 bg-white shadow-sm ${
        size === "compact" ? "p-2" : "p-4"
      }`}
    >
      {content}
    </div>
  );
}

// --------------------
// Main application
// --------------------

export default function Home() {
  const [tab, setTab] = useState<Tab>("attendance");
  const [search, setSearch] = useState("");

  const [sort, setSort] = useState<SortOption>("year-asc");
  const [recognitionSort, setRecognitionSort] =
    useState<SortOption>("year-asc");

  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");
  const attendanceSnapshot = useSyncExternalStore(
    subscribeToAttendance,
    getAttendanceSnapshot,
    getServerAttendanceSnapshot,
  );

  const [recognitionView, setRecognitionView] = useState<
    "compact" | "detailed"
  >("detailed");
  const selected = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(attendanceSnapshot);
      const validIds = new Set(members.map((member) => member.id));

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (id): id is string => typeof id === "string" && validIds.has(id),
      );
    } catch {
      return [];
    }
  }, [attendanceSnapshot]);

  const selectedIds = new Set(selected);

  function saveAttendance(next: string[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(ATTENDANCE_EVENT));
    } catch {
      console.warn("Could not save attendance.");
    }
  }

  function toggleMember(id: string) {
    const next = selectedIds.has(id)
      ? selected.filter((value) => value !== id)
      : [...selected, id];

    saveAttendance(next);
  }

  // --------------------
  // Search and filtering
  // --------------------

  const filteredMembers = members.filter((member) => {
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

    const matchesType = matchesMemberFilter(member, memberFilter);

    return matchesSearch && matchesType;
  });

  // IMPORTANT: This goes AFTER the closing });
  const sortedFilteredMembers = sortMembers(filteredMembers, sort);

  // Recognition uses ALL selected members, regardless
  // of directory search/filter settings.
  const attending = members.filter((member) => selectedIds.has(member.id));

  const attendingDistrictOfficers = sortMembers(
    attending.filter((member) => member.districtPositions.length > 0),
    recognitionSort,
  );

  const attendingPastMasters = sortMembers(
    attending.filter(
      (member) =>
        isHomePastMaster(member) && member.districtPositions.length === 0,
    ),
    recognitionSort,
  );
  const attendingHome = sortMembers(
    attending.filter(isHomePastMaster),
    recognitionSort,
  );

  const attendingVisitors = sortMembers(
    attending.filter((member) => !isHomePastMaster(member)),
    recognitionSort,
  );

  function renderGroup(
    title: string,
    group: Member[],
    selectable: boolean,
    size: "compact" | "normal" | "large" = "normal",
  ) {
    if (group.length === 0) return null;

    return (
      <section className="mb-7">
        <h3 className="mb-3 text-lg font-bold text-slate-800">
          {title}
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({group.length})
          </span>
        </h3>

        <div className="space-y-3">
          {group.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              selectable={selectable}
              checked={selectedIds.has(member.id)}
              onToggle={() => toggleMember(member.id)}
              size={size}
            />
          ))}
        </div>
      </section>
    );
  }

  const sortOptions: {
    value: SortOption;
    label: string;
  }[] = [
    { value: "year-asc", label: "PM Year: Oldest First" },
    { value: "year-desc", label: "PM Year: Newest First" },
    { value: "name-asc", label: "Name: A–Z" },
    { value: "name-desc", label: "Name: Z–A" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-7 text-center">
          <h1 className="text-3xl font-bold">Lodge Recognition</h1>
          <p className="mt-2 text-slate-600">Forest City Lodge</p>
          <p className="text-sm text-slate-500">
            Past Masters & District Officers
          </p>
        </header>

        {/* Navigation */}
        <nav className="mb-6 grid grid-cols-3 gap-2">
          {(["directory", "attendance", "recognition"] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl px-2 py-3 text-sm font-semibold capitalize ${
                tab === item
                  ? "bg-blue-800 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Directory and attendance controls */}
        {tab !== "recognition" && (
          <div className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="search"
              placeholder="Search name, year, lodge, or office..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Sort by
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Member Type
                <select
                  value={memberFilter}
                  onChange={(event) =>
                    setMemberFilter(event.target.value as MemberFilter)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
                >
                  <option value="all">All Brethren</option>
                  <option value="home">Forest City Past Masters</option>
                  <option value="district-all">All District Officers</option>
                  <option value="district-current">
                    Current District Officers
                  </option>
                  <option value="district-past">Past District Officers</option>
                  <option value="district-none">No District Position</option>
                </select>
              </label>
            </div>

            <p className="text-xs text-slate-500">
              Showing {filteredMembers.length} of {members.length} brethren.
              Sorting and filtering do not change attendance.
            </p>
          </div>
        )}

        {/* Directory */}
        {tab === "directory" && (
          <>
            <h2 className="mb-5 text-2xl font-bold">Member Directory</h2>

            {renderGroup("All Brethren", sortedFilteredMembers, false)}

            {filteredMembers.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-center text-slate-500">
                No matching brethren.
              </p>
            )}
          </>
        )}

        {/* Attendance */}
        {tab === "attendance" && (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Attendance</h2>
                <p className="text-sm text-slate-600">
                  {selected.length} of {members.length} present
                </p>
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Clear all attendance selections?")) {
                    saveAttendance([]);
                  }
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              >
                Clear All
              </button>
            </div>

            {renderGroup(
              "Select Brethren Present",
              sortedFilteredMembers,
              true,
            )}

            {filteredMembers.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-center text-slate-500">
                No matching brethren.
              </p>
            )}

            <button
              onClick={() => setTab("recognition")}
              className="mt-4 w-full rounded-xl bg-blue-800 px-4 py-4 font-semibold text-white"
            >
              View Recognition List →
            </button>
          </>
        )}

        {/* Recognition */}
        {tab === "recognition" && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Recognition List</h2>
              <p className="text-sm text-slate-600">
                {attending.length} brethren selected
              </p>
            </div>

            <div className="mb-5 flex gap-2 rounded-xl bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setRecognitionView("compact")}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold ${
                  recognitionView === "compact"
                    ? "bg-blue-800 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Compact
              </button>

              <button
                type="button"
                onClick={() => setRecognitionView("detailed")}
                className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold ${
                  recognitionView === "detailed"
                    ? "bg-blue-800 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Detailed
              </button>
            </div>

            <label className="mb-6 block rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium shadow-sm">
              Recognition Order
              <select
                value={recognitionSort}
                onChange={(event) =>
                  setRecognitionSort(event.target.value as SortOption)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {attending.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-center text-slate-600">
                Nobody selected yet. Go to Attendance to check in the brethren.
              </p>
            )}
            {renderGroup(
              "District Officers",
              attendingDistrictOfficers,
              false,
              recognitionView === "compact" ? "compact" : "large",
            )}

            {renderGroup(
              "Forest City Past Masters",
              attendingPastMasters,
              false,
              recognitionView === "compact" ? "compact" : "large",
            )}

            {attending.length > 0 && (
              <p className="mt-5 text-xs text-slate-500">
                Each brother appears once. The two groups are sorted
                independently. This is a roster order, not verified ceremonial
                precedence.
              </p>
            )}

            <button
              onClick={() => setTab("attendance")}
              className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold"
            >
              ← Back to Attendance
            </button>
          </>
        )}
      </div>
    </main>
  );
}
