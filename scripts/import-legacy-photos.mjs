import { importLegacyPhotos } from "../lib/legacy-photo-import.js";
import { db } from "../lib/db.js";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  const summary = await importLegacyPhotos();

  console.log("Legacy photo import complete.");
  console.log(`Albums created: ${summary.createdAlbums}`);
  console.log(`Photos imported: ${summary.importedPhotos}`);
  console.log(`Photos skipped: ${summary.skippedPhotos}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
