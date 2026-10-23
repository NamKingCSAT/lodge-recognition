import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.member.findMany({
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

    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members:", error);

    return NextResponse.json(
      { error: "Unable to load members" },
      { status: 500 },
    );
  }
}
