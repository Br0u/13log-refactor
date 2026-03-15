"use client";

import React, { useState } from "react";

export default function PostComments({ slug, initialComments = [] }) {
  const [comments, setComments] = useState(initialComments);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ nickname, content }),
      });

      if (!response.ok) {
        return;
      }

      const listResponse = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`);
      const body = await listResponse.json();
      setComments(body.comments || []);
      setNickname("");
      setContent("");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="post-comments">
      <h2>发表评论</h2>
      <form onSubmit={handleSubmit} className="post-comments__form">
        <label>
          <span>昵称</span>
          <input name="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} required />
        </label>
        <label>
          <span>内容</span>
          <textarea
            name="content"
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={pending}>提交评论</button>
      </form>
      <ul className="post-comments__list">
        {comments.map((comment) => (
          <li key={comment.id} className="post-comments__item">
            <strong>{comment.nickname}</strong>
            <p>{comment.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
