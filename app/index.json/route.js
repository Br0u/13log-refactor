import { getPublicIndexJsonItems } from "../../lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const docs = await getPublicIndexJsonItems();

  return Response.json(docs, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
