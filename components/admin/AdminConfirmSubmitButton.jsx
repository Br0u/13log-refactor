"use client";

import React from "react";

export default function AdminConfirmSubmitButton({
  label,
  confirmMessage,
  className = "",
}) {
  function handleClick(event) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <button type="submit" className={className} onClick={handleClick}>
      {label}
    </button>
  );
}
