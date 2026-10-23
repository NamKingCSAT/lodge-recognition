import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type MemberInput = {
  name?: unknown;
  lodge?: unknown;
  pastMasterYears?: unknown;
  honorific?: unknown;
  currentLodgeOffice?: unknown;
  districtTitle?: unknown;
  districtStatus?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: MemberInput = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const lodge = typeof body.lodge === "string" ? body.lodge.trim() : "";

    const years = body.pastMasterYears;

    if (
      !name ||
      name.length > 150 ||
      !lodge ||
      lodge.length > 150 ||
      !Array.isArray(years) ||
      years.length === 0 ||
      years.length > 20 ||
      !years.every(
        (year) =>
          Number.isInteger(year) &&
          year >= 1700 &&
          year <= new Date().getFullYear(),
      )
    ) {
      return NextResponse.json(
        { error: "Invalid name, lodge, or Past Master years." },
        { status: 400 },
      );
    }

    const honorific =
      typeof body.honorific === "string" ? body.honorific.trim() : "";

    const currentLodgeOffice =
      typeof body.currentLodgeOffice === "string"
        ? body.currentLodgeOffice.trim()
        : "";

    const districtTitle =
      typeof body.districtTitle === "string" ? body.districtTitle.trim() : "";

    const districtStatus = body.districtStatus === "past" ? "past" : "current";

    if (
      honorific.length > 50 ||
      currentLodgeOffice.length > 150 ||
      districtTitle.length > 150
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 },
      );
    }

    const member = await prisma.member.create({
      data: {
        name,
        lodge,
        pastMasterYears: [...new Set(years as number[])].sort((a, b) => a - b),
        honorific: honorific || null,
        currentLodgeOffice: currentLodgeOffice || null,
        districtPositions: districtTitle
          ? {
              create: [
                {
                  title: districtTitle,
                  status: districtStatus,
                },
              ],
            }
          : undefined,
      },
      include: {
        districtPositions: true,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to create member:", error);

    return NextResponse.json(
      { error: "Failed to save member." },
      { status: 500 },
    );
  }
}
