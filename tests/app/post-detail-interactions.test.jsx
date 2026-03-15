import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PostLikeButton from "../../components/blog/PostLikeButton";
import PostComments from "../../components/blog/PostComments";

describe("post detail interactions", () => {
  it("renders like and comment UI building blocks", () => {
    const markup = renderToStaticMarkup(
      <div>
        <PostLikeButton slug="example-post" initialCount={1} />
        <PostComments slug="example-post" initialComments={[]} />
      </div>
    );

    expect(markup).toContain("点赞");
    expect(markup).toContain("发表评论");
    expect(markup).toContain('name="nickname"');
    expect(markup).toContain('name="content"');
  });
});
