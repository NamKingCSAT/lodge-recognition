"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { members, type Member } from "../data/members";

type Tab = "directory" | "attendance" | "recognition";

const STORAGE_KEY = "lodge-recognition-attendance";
const HOME_LODGE = "Forest City Lodge";

const ATTENDANCE_EVENT = "lodge-attendance-updated";

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
    ? member.pastMasterYears.join(", ")
    : "Unknown";
}

function getDistrictLabel(member: Member) {
  return member.districtPositions
    .map((position) => {
      const prefix = position.status === "past" ? "Past " : "";

      return `${prefix}${position.title}`;
    })
    .join(" · ");
}

function MemberPhoto({ member }: { member: Member }) {
  const [failed, setFailed] = useState(false);

  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  if (!member.photo || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-lg font-bold text-slate-600">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={member.photo}
      alt={member.name}
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-xl object-cover"
    />
  );
}

function MemberCard({
  member,
  selectable = false,
  checked = false,
  onToggle,
}: {
  member: Member;
  selectable?: boolean;
  checked?: boolean;
  onToggle?: () => void;
}) {
  const homePM = isHomePastMaster(member);
  const districtLabel = getDistrictLabel(member);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <MemberPhoto member={member} />

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">
          {member.honorific && <span>{member.honorific} </span>}
          {member.name}
        </h3>

        <p className="text-sm text-slate-600">
          {homePM
            ? `Forest City Past Master · ${getYearLabel(member)}`
            : `Visiting Officer · ${member.lodge}`}
        </p>

        {!homePM && (
          <p className="text-xs text-slate-500">
            Past Master · {getYearLabel(member)}
          </p>
        )}

        {districtLabel && (
          <p className="mt-1 text-sm font-medium text-blue-700">
            {districtLabel}
          </p>
        )}

        {member.currentLodgeOffice && (
          <p className="text-sm text-slate-600">{member.currentLodgeOffice}</p>
        )}
      </div>

      {selectable && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Mark ${member.name} present`}
          className="h-6 w-6 shrink-0 cursor-pointer accent-blue-800"
        />
      )}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("attendance");
  const [search, setSearch] = useState("");

  const attendanceSnapshot = useSyncExternalStore(
    subscribeToAttendance,
    getAttendanceSnapshot,
    getServerAttendanceSnapshot,
  );

  const selected = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(attendanceSnapshot);
      const validIds = new Set(members.map((m) => m.id));

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (id): id is string => typeof id === "string" && validIds.has(id),
      );
    } catch {
      return [];
    }
  }, [attendanceSnapshot]);

  function setSelected(value: string[] | ((previous: string[]) => string[])) {
    const next = typeof value === "function" ? value(selected) : value;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(ATTENDANCE_EVENT));
    } catch {
      console.warn("Unable to save attendance.");
    }
  }

  function toggleMember(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }

  const filteredMembers = members.filter((member) => {
    const searchable = [
      member.name,
      member.lodge,
      member.honorific ?? "",
      member.currentLodgeOffice ?? "",
      member.pastMasterYears.join(" "),
      ...member.districtPositions.map((position) => position.title),
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  const homeMembers = filteredMembers
    .filter(isHomePastMaster)
    .sort((a, b) => getFirstYear(a) - getFirstYear(b));

  const visitingMembers = filteredMembers
    .filter((member) => !isHomePastMaster(member))
    .sort((a, b) => a.name.localeCompare(b.name));

  const attending = members.filter((member) => selected.includes(member.id));

  const attendingHome = attending
    .filter(isHomePastMaster)
    .sort((a, b) => getFirstYear(a) - getFirstYear(b));

  const attendingVisitors = attending
    .filter((member) => !isHomePastMaster(member))
    .sort((a, b) => a.name.localeCompare(b.name));

  function renderGroup(title: string, group: Member[], selectable: boolean) {
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
              checked={selected.includes(member.id)}
              onToggle={() => toggleMember(member.id)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Lodge Recognition
          </h1>

          <p className="mt-2 text-slate-600">Forest City Lodge</p>

          <p className="text-sm text-slate-500">
            Past Masters & District Officers
          </p>
        </header>

        <nav className="mb-6 grid grid-cols-3 gap-2">
          {(["directory", "attendance", "recognition"] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl px-2 py-3 text-sm font-semibold capitalize transition ${
                tab === item
                  ? "bg-blue-800 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {tab !== "recognition" && (
          <input
            type="search"
            placeholder="Search name, office, lodge, or year..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-6 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-600"
          />
        )}

        {tab === "directory" && (
          <>
            <h2 className="mb-5 text-2xl font-bold">Member Directory</h2>

            {renderGroup("Forest City Past Masters", homeMembers, false)}

            {renderGroup("Visiting District Officers", visitingMembers, false)}

            {filteredMembers.length === 0 && (
              <p className="text-center text-slate-500">No members found.</p>
            )}
          </>
        )}

        {tab === "attendance" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Attendance</h2>
                <p className="text-sm text-slate-600">
                  {selected.length} brethren present
                </p>
              </div>

              <button
                onClick={() => {
                  if (window.confirm("Clear all attendance selections?")) {
                    setSelected([]);
                  }
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              >
                Clear All
              </button>
            </div>

            {renderGroup("Forest City Past Masters", homeMembers, true)}

            {renderGroup("Visiting District Officers", visitingMembers, true)}

            <button
              onClick={() => setTab("recognition")}
              className="mt-4 w-full rounded-xl bg-blue-800 px-4 py-4 font-semibold text-white"
            >
              View Recognition List →
            </button>
          </>
        )}

        {tab === "recognition" && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Recognition List</h2>

              <p className="text-sm text-slate-600">
                {attending.length} brethren selected
              </p>
            </div>

            {attending.length === 0 && (
              <div className="rounded-xl bg-white p-6 text-center text-slate-600">
                Nobody has been selected yet. Return to Attendance to check in
                the brethren who are present.
              </div>
            )}

            {renderGroup("Forest City Past Masters", attendingHome, false)}

            {renderGroup(
              "Visiting District Officers",
              attendingVisitors,
              false,
            )}

            {attending.length > 0 && (
              <p className="mt-5 text-xs text-slate-500">
                Forest City Past Masters are ordered by their earliest year of
                service. Visiting officers are listed alphabetically. Confirm
                ceremonial precedence with your lodge protocol.
              </p>
            )}

            <button
              onClick={() => setTab("attendance")}
              className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800"
            >
              ← Back to Attendance
            </button>
          </>
        )}
      </div>
    </main>
  );
}
