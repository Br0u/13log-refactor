import { describe, expect, it, vi } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((href) => {
    throw new Error(`redirect:${href}`);
  }),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    redirect: redirectMock,
    notFound: vi.fn(),
  };
});

import PostsPaged from "../../app/posts/page/[page]/page.jsx";

describe("posts paged route", () => {
  it("redirects legacy paged URLs back to /posts", async () => {
    await expect(
      PostsPaged({
        params: Promise.resolve({ page: "2" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("redirect:/posts");

    expect(redirectMock).toHaveBeenCalledWith("/posts");
  });

  it("redirects tag-filtered legacy paged URLs back to the main posts page", async () => {
    await expect(
      PostsPaged({
        params: Promise.resolve({ page: "3" }),
        searchParams: Promise.resolve({ tag: "Notes" }),
      })
    ).rejects.toThrow("redirect:/posts?tag=Notes");

    expect(redirectMock).toHaveBeenCalledWith("/posts?tag=Notes");
  });
});
