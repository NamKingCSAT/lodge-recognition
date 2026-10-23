import { Suspense } from "react";
import { connection } from "next/server";
import prisma from "@/lib/prisma";
import RecognitionClient from "./recognition-client";
import type { Member } from "../data/members";

async function LiveRoster() {
  // Make sure the database query runs at request time.
  await connection();

  const records = await prisma.member.findMany({
    where: {
      isArchived: false,
    },
    include: {
      districtPositions: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Convert Neon records to the existing frontend format.
  const members: Member[] = records.map((record) => ({
    id: record.id,
    name: record.name,
    photo: record.photo ?? undefined,
    lodge: record.lodge,
    pastMasterYears: record.pastMasterYears,
    honorific: record.honorific ?? undefined,
    currentLodgeOffice: record.currentLodgeOffice ?? undefined,
    notes: record.notes ?? undefined,

    districtPositions: record.districtPositions.map((position) => ({
      title: position.title,
      status: position.status,
      startYear: position.startYear ?? undefined,
      endYear: position.endYear ?? undefined,
    })),
  }));

  return <RecognitionClient members={members} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
          <div className="text-center text-slate-700">
            <h1 className="text-xl font-semibold">
              Forest City Lodge Recognition
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Loading brethren from the roster...
            </p>
          </div>
        </main>
      }
    >
      <LiveRoster />
    </Suspense>
  );
}
