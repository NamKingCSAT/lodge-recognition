"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import type { ComponentType } from "react";

// Only these props are needed for our photo editor.
type PhotoCropperProps = {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  cropShape?: "rect" | "round";
  showGrid?: boolean;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (area: Area, pixels: Area) => void;
};

const CompatibleCropper =
  Cropper as unknown as ComponentType<PhotoCropperProps>;

type Props = {
  memberId: string;
  memberName: string;
  initialPhoto: string | null;
};

async function makeCroppedImage(source: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.src = source;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 600;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Image editing is not supported.");
  }

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, 600, 600);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not crop image."));
      },
      "image/webp",
      0.85,
    );
  });
}

export default function PhotoEditor({
  memberId,
  memberName,
  initialPhoto,
}: Props) {
  const router = useRouter();

  const [photoUrl, setPhotoUrl] = useState(initialPhoto);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!source) return;
    return () => URL.revokeObjectURL(source);
  }, [source]);

  function chooseFile(file?: File) {
    if (!file) return;

    setError("");
    setSuccess("");

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size === 0 ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP under 5 MB.");
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);
    setSource(URL.createObjectURL(file));
  }

  async function savePhoto() {
    if (!source || !cropPixels || uploading) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const cropped = await makeCroppedImage(source, cropPixels);

      const formData = new FormData();

      formData.append(
        "photo",
        new File([cropped], "portrait.webp", {
          type: "image/webp",
        }),
      );

      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/photo`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Upload failed.");
      }

      setPhotoUrl(result.photo);
      setSource(null);
      setSuccess("Photograph saved successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="mb-4 font-semibold text-slate-900">Member Photograph</h2>

      {!source ? (
        <div className="flex flex-wrap items-center gap-5">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={`Portrait of ${memberName}`}
              className="h-28 w-28 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-200 text-sm text-slate-500">
              No Photo
            </div>
          )}

          <div className="min-w-0 flex-1">
            <label
              htmlFor="photo-input"
              className="mb-2 block text-sm font-medium"
            >
              {photoUrl ? "Replace Photograph" : "Upload Photograph"}
            </label>

            <input
              id="photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                chooseFile(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-800 file:px-3 file:py-2 file:text-white"
            />

            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG or WebP. Maximum 5 MB.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Drag the photo to position the face inside the square. Use the
            slider to zoom.
          </p>

          <div className="relative h-80 overflow-hidden rounded-xl bg-slate-900">
            <CompatibleCropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCropPixels(pixels)}
            />
          </div>

          <label className="block text-sm font-medium">
            Zoom: {zoom.toFixed(1)}×
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full accent-blue-800"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSource(null)}
              disabled={uploading}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={savePhoto}
              disabled={uploading || !cropPixels}
              className="flex-1 rounded-xl bg-blue-800 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Save Photo"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {success}
        </p>
      )}
    </section>
  );
}
