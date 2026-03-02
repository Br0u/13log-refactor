import { getIndexJsonItems } from "../../lib/content";

export async function GET() {
  const docs = getIndexJsonItems();

  return Response.json(docs, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
