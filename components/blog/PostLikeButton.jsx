"use client";

import React, { useState } from "react";

export default function PostLikeButton({ slug, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleLike() {
    if (pending) return;
    setPending(true);

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/like`, {
        method: "POST",
      });
      const body = await response.json();
      if (response.ok) {
        setCount(body.count);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className="post-like-button" onClick={handleLike} disabled={pending}>
      点赞 {count}
    </button>
  );
}
