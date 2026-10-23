import { Suspense } from "react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RosterList from "./roster-list";

async function ManageRosterContent() {
  // Read authentication and database data at request time.
  await connection();

  const session = await auth();

  if (!session?.user) {
    redirect("/admin");
  }

  const members = await prisma.member.findMany({
    include: {
      districtPositions: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Pass plain, serializable data to the client component.
  const roster = members.map((member) => ({
    id: member.id,
    name: member.name,
    lodge: member.lodge,
    photo: member.photo,
    honorific: member.honorific,
    currentLodgeOffice: member.currentLodgeOffice,
    pastMasterYears: member.pastMasterYears,
    isArchived: member.isArchived,
    districtPositions: member.districtPositions.map((position) => ({
      id: position.id,
      title: position.title,
      status: position.status,
      startYear: position.startYear,
      endYear: position.endYear,
    })),
  }));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="mb-5 inline-block text-sm font-medium text-blue-700"
        >
          ← Back to Administration
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Manage Brethren</h1>
            <p className="mt-1 text-sm text-slate-600">
              Forest City Lodge Recognition
            </p>
          </div>

          <Link
            href="/admin/members/new"
            className="rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white"
          >
            + Add Brother
          </Link>
        </div>

        <RosterList members={roster} />
      </div>
    </main>
  );
}

export default function ManageRosterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-8 text-center text-slate-600">
          Loading roster...
        </main>
      }
    >
      <ManageRosterContent />
    </Suspense>
  );
}
