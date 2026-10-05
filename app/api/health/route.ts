import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const services = {
    database: Boolean(process.env.DATABASE_URL),
    ai: Boolean(process.env.OPENAI_API_KEY),
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    search: Boolean(process.env.MEILI_HOST && process.env.MEILI_MASTER_KEY),
    redis: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  };

  return NextResponse.json({
    ok: true,
    mode: services.database ? "configured" : "demo",
    services,
    checkedAt: new Date().toISOString(),
  });
}
