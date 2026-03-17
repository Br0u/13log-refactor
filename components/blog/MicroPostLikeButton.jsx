"use client";

import React, { useState } from "react";

export default function MicroPostLikeButton({ id, initialCount = 0, dataTestId }) {
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleLike(event) {
    event.preventDefault();
    event.stopPropagation();

    if (pending) return;
    setPending(true);

    try {
      const response = await fetch(`/api/micro-posts/${encodeURIComponent(id)}/like`, {
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
    <button
      type="button"
      className="micro-post-like-button"
      data-testid={dataTestId}
      onClick={handleLike}
      disabled={pending}
      aria-label={`点赞 ${count}`}
    >
      <span aria-hidden="true" className="micro-post-like-button__icon">♡</span>
      <span className="micro-post-like-button__count">{count}</span>
    </button>
  );
}
