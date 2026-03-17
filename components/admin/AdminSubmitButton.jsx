"use client";

import React from "react";
import { useFormStatus } from "react-dom";

export default function AdminSubmitButton({
  label = "Save",
  pendingLabel = "Saving...",
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="admin-primary-button" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
