import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
  if (!(await auth())?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;

  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.member.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Brother not found" }, { status: 404 });
  }

  // Archive/restore requests only change the archive flag.
  if (body.action === "archive" || body.action === "restore") {
    try {
      const updated = await prisma.member.update({
        where: { id },
        data: { isArchived: body.action === "archive" },
      });
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json(
        { error: "Unable to update archive status" },
        { status: 500 },
      );
    }
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const lodge = typeof body.lodge === "string" ? body.lodge.trim() : "";
  const years = body.pastMasterYears;

  const optionalText = (value: unknown, max: number) =>
    typeof value === "string" && value.trim().length <= max
      ? value.trim() || null
      : value == null
        ? null
        : undefined;

  const honorific = optionalText(body.honorific, 50);
  const currentLodgeOffice = optionalText(body.currentLodgeOffice, 150);
  const notes = optionalText(body.notes, 2000);

  if (
    !name ||
    name.length > 150 ||
    !lodge ||
    lodge.length > 150 ||
    !Array.isArray(years) ||
    years.length < 1 ||
    years.length > 20 ||
    !years.every(
      (year: unknown) =>
        typeof year === "number" &&
        Number.isInteger(year) &&
        year >= 1700 &&
        year <= new Date().getFullYear(),
    ) ||
    honorific === undefined ||
    currentLodgeOffice === undefined ||
    notes === undefined
  ) {
    return NextResponse.json(
      { error: "Invalid member information" },
      { status: 400 },
    );
  }

  const rawPositions = body.districtPositions;

  if (!Array.isArray(rawPositions) || rawPositions.length > 20) {
    return NextResponse.json(
      { error: "Invalid District positions" },
      { status: 400 },
    );
  }

  const positions: {
    title: string;
    status: "current" | "past";
    startYear: number | null;
    endYear: number | null;
  }[] = [];

  for (const raw of rawPositions) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json(
        { error: "Invalid District position" },
        { status: 400 },
      );
    }

    const p = raw as Record<string, unknown>;
    const title = typeof p.title === "string" ? p.title.trim() : "";
    const validYear = (value: unknown) =>
      value === null ||
      (typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1700 &&
        value <= new Date().getFullYear());

    if (
      !title ||
      title.length > 150 ||
      (p.status !== "current" && p.status !== "past") ||
      !validYear(p.startYear) ||
      !validYear(p.endYear) ||
      (p.status === "current" && p.endYear !== null) ||
      (typeof p.startYear === "number" &&
        typeof p.endYear === "number" &&
        p.endYear < p.startYear)
    ) {
      return NextResponse.json(
        { error: "Invalid District title or service years" },
        { status: 400 },
      );
    }

    positions.push({
      title,
      status: p.status,
      startYear: p.startYear as number | null,
      endYear: p.endYear as number | null,
    });
  }

  try {
    const updated = await prisma.member.update({
      where: { id },
      data: {
        name,
        lodge,
        pastMasterYears: [...new Set(years as number[])].sort((a, b) => a - b),
        honorific,
        currentLodgeOffice,
        notes,
        districtPositions: {
          deleteMany: {},
          create: positions,
        },
      },
      include: { districtPositions: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Unable to update member:", error);
    return NextResponse.json(
      { error: "Unable to save changes" },
      { status: 500 },
    );
  }
}
