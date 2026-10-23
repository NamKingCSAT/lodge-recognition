import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

type Context = {
  params: Promise<{ id: string }>;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request, { params }: Context) {
  // Only authenticated administrators can upload photos.
  if (!(await auth())?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Brother not found" }, { status: 404 });
  }

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
  } = process.env;

  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME ||
    !R2_PUBLIC_URL
  ) {
    return NextResponse.json(
      { error: "Photo storage is not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a photograph" },
        { status: 400 },
      );
    }

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size === 0 ||
      file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, or WebP image under 5 MB." },
        { status: 400 },
      );
    }

    // Decode the image rather than trusting its filename or MIME type.
    // Strip metadata, resize, and encode as WebP.
    const input = Buffer.from(await file.arrayBuffer());

    const processed = await sharp(input, {
      limitInputPixels: 25_000_000,
    })
      .rotate()
      .resize(600, 600, {
        fit: "cover",
        position: "attention",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    const key = `members/${id}/${randomUUID()}.webp`;

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: processed,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    await prisma.member.update({
      where: { id },
      data: { photo: url },
    });

    return NextResponse.json({ photo: url });
  } catch (error) {
    console.error("Photo upload failed:", error);

    return NextResponse.json(
      { error: "Unable to upload photograph" },
      { status: 500 },
    );
  }
}
