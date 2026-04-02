import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

const IMAGE_FILE_REGEX = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

export async function GET() {
  try {
    const writingFireDir = path.join(process.cwd(), "public", "writingfire");
    const files = await readdir(writingFireDir, { withFileTypes: true });

    const images = files
      .filter((entry) => entry.isFile() && IMAGE_FILE_REGEX.test(entry.name))
      .map((entry) => `/writingfire/${entry.name}`);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
