import { buildPlainSummary, preprocessShortcodes } from "./markdown";
import { getPostBySlug as getFilePostBySlug, getPosts as getFilePosts } from "./content";
import { getPublishedPostBySlug, getPublishedPosts } from "./repositories/posts";

function mapDbPost(post) {
  if (!post) return null;

  const processedMarkdown = preprocessShortcodes(post.markdown || "");

  return {
    id: post.id,
    slug: post.slug,
    urlSlug: post.slug,
    title: post.title,
    description: post.summary || "",
    summary: post.summary || buildPlainSummary(processedMarkdown).slice(0, 220),
    content: processedMarkdown,
    draft: post.status !== "PUBLISHED",
    date: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    tags: (post.tags || []).map((item) => item.tag.name),
    categories: post.category ? [post.category.name] : [],
    status: post.status,
    likeCount: post.likeCount || 0,
    commentCount: post.commentCount || 0,
    data: {
      slug: post.slug,
    },
  };
}

export async function getPublicPosts() {
  const dbPosts = await getPublishedPosts();
  if (dbPosts.length > 0) {
    return dbPosts.map(mapDbPost);
  }

  return getFilePosts().map((post) => ({
    ...post,
    status: "PUBLISHED",
    likeCount: 0,
    commentCount: 0,
  }));
}

export async function getPublicPostBySlug(slug) {
  const dbPost = await getPublishedPostBySlug(slug);
  if (dbPost) {
    return mapDbPost(dbPost);
  }

  const filePost = getFilePostBySlug(slug);
  if (!filePost) {
    return null;
  }

  return {
    ...filePost,
    status: "PUBLISHED",
    likeCount: 0,
    commentCount: 0,
  };
}

export async function getHomepagePosts(limit = 5) {
  const posts = await getPublicPosts();
  return posts.slice(0, limit);
}

export async function getPublicIndexJsonItems() {
  const posts = await getPublicPosts();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.13log.live").replace(/\/+$/, "");

  return posts.map((post) => ({
    title: post.title,
    content: buildPlainSummary(post.content || ""),
    permalink: `${siteUrl}/posts/${encodeURIComponent(post.urlSlug || post.slug)}`,
    summary: post.summary || "",
  }));
}

export async function getPublicRssItems(limit = 50) {
  const posts = await getPublicPosts();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.13log.live").replace(/\/+$/, "");

  return posts.slice(0, limit).map((post) => ({
    title: post.title,
    description: post.description || post.summary || "",
    date: post.date,
    link: `${siteUrl}/posts/${encodeURIComponent(post.urlSlug || post.slug)}`,
  }));
}
