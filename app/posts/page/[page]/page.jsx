import { redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  return { title: `Posts | 我的小小世界` };
}

export default async function PostsPaged({ params, searchParams }) {
  const sp = await searchParams;
  const activeTag = typeof sp?.tag === "string" && sp.tag.trim() ? sp.tag.trim() : null;
  if (activeTag) redirect(`/posts?tag=${encodeURIComponent(activeTag)}`);
  redirect("/posts");
}
