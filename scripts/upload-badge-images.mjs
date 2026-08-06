/**
 * Uploads bundled badge artwork to Supabase Storage and sets badges.image_url.
 *
 * Prerequisites:
 * 1. Run supabase/badge_storage_migration.sql in the SQL Editor
 * 2. SUPABASE_SERVICE_ROLE_KEY set in .env.local
 *
 * Usage: node scripts/upload-badge-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const FILES = [
  { slug: "joined_adult", file: "joined_adult.png" },
  { slug: "bleached", file: "bleached.png" },
  { slug: "blacked", file: "blacked.png" },
];

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bucket = "badges";

for (const item of FILES) {
  const localPath = join(root, "assets", "badges", item.file);
  if (!existsSync(localPath)) {
    console.error(`Missing file: ${localPath}`);
    process.exit(1);
  }

  const body = readFileSync(localPath);
  const objectPath = item.file;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, body, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error(`Upload failed for ${item.slug}:`, uploadError.message);
    process.exit(1);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  const { error: updateError } = await supabase
    .from("badges")
    .update({ image_url: publicUrl })
    .eq("slug", item.slug);

  if (updateError) {
    console.error(`DB update failed for ${item.slug}:`, updateError.message);
    process.exit(1);
  }

  console.log(`${item.slug} -> ${publicUrl}`);
}

console.log("Done.");
