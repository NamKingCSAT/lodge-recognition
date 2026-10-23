import { Suspense } from "react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import EditMemberForm from "./edit-member-form";

type Props = {
  params: Promise<{ id: string }>;
};

async function EditMemberContent({ params }: Props) {
  await connection();

  const session = await auth();

  if (!session?.user) {
    redirect("/admin");
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      districtPositions: true,
    },
  });

  if (!member) {
    notFound();
  }

  return (
    <EditMemberForm
      member={{
        id: member.id,
        name: member.name,
        lodge: member.lodge,
        pastMasterYears: member.pastMasterYears,
        honorific: member.honorific,
        currentLodgeOffice: member.currentLodgeOffice,
        notes: member.notes,
        isArchived: member.isArchived,
        districtPositions: member.districtPositions.map((position) => ({
          title: position.title,
          status: position.status,
          startYear: position.startYear,
          endYear: position.endYear,
        })),
      }}
    />
  );
}

export default function EditMemberPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-8 text-center">
          <p className="text-slate-600">Loading brother information...</p>
        </main>
      }
    >
      <EditMemberContent params={params} />
    </Suspense>
  );
}
