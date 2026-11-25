import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.PLAYWRIGHT_NEXT_DIST_DIR ?? ".next",
  transpilePackages: [
    "@muslim-ayat/database",
    "@muslim-ayat/quran-data",
    "@muslim-ayat/shared",
    "@muslim-ayat/ui",
  ],
  async headers() {
    const publicContent = [{ key: "X-Muslim-Ayat-Cache", value: "public" }];
    return [
      { source: "/quran/:path*", headers: publicContent },
      { source: "/surah/:surahId/:path*", headers: publicContent },
    ];
  },
};

export default nextConfig;
