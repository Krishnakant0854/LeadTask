import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function saveUpload(file: File, folder: "profiles" | "posters") {
  if (!isAllowedImage(file)) {
    throw Object.assign(new Error("Only PNG, JPG, and WebP images are allowed"), { status: 422 });
  }

  if (file.size > 5 * 1024 * 1024) {
    throw Object.assign(new Error("Image must be 5 MB or smaller"), { status: 422 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = extensionFromFile(file);
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}${extension}`;

  if (process.env.UPLOAD_DRIVER === "supabase") {
    return saveToSupabaseStorage(key, bytes, file);
  }

  if (process.env.UPLOAD_DRIVER === "vercel_blob" && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, bytes, {
      access: "public",
      contentType: file.type || "application/octet-stream"
    });
    return blob.url;
  }

  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const target = path.join(uploadRoot, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return `/uploads/${key.replaceAll("\\", "/")}`;
}

async function saveToSupabaseStorage(key: string, bytes: Buffer, file: File) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "employee-leads";

  if (!supabaseUrl || !serviceRoleKey) {
    throw Object.assign(new Error("Supabase storage is not configured"), { status: 500 });
  }

  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodedKey}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": file.type,
      "x-upsert": "true"
    },
    body: new Blob([new Uint8Array(bytes)], { type: file.type })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw Object.assign(new Error(detail || "Unable to upload to Supabase Storage"), {
      status: 502
    });
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedKey}`;
}

export function isAllowedImage(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

export function isSafeImageUrl(value: string) {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return (
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function extensionFromFile(file: File) {
  const fromName = path.extname(file.name || "");
  if (fromName) return fromName.toLowerCase();

  if (file.type === "image/png") return ".png";
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/webp") return ".webp";
  return "";
}
