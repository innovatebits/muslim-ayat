import { NextResponse } from "next/server";
import { getStudyAyah } from "@muslim-ayat/quran-data/study";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ surahNumber: string; ayahNumber: string }> },
) {
  const { surahNumber: surahValue, ayahNumber: ayahValue } = await params;
  if (!/^\d+$/u.test(surahValue) || !/^\d+$/u.test(ayahValue)) {
    return new NextResponse(null, { status: 404 });
  }

  const studyAyah = getStudyAyah(Number(surahValue), Number(ayahValue));
  if (!studyAyah) return new NextResponse(null, { status: 404 });

  return NextResponse.json(studyAyah, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}