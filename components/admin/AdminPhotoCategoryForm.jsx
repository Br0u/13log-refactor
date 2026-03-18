"use client";

import React, { useActionState } from "react";
import AdminSubmitButton from "./AdminSubmitButton";

const INITIAL_FORM_STATE = {
  error: "",
};

function noopAction(previousState) {
  return previousState;
}

export default function AdminPhotoCategoryForm({
  action,
  formState: controlledFormState = null,
  successMessage = "",
  submitLabel = "Save category",
  pendingLabel = "Saving...",
}) {
  const [formState, formAction] = useActionState(action || noopAction, INITIAL_FORM_STATE);
  const currentState = controlledFormState || formState;

  return (
    <form action={formAction} className="admin-post-form admin-form admin-card">
      <div className="admin-card__header">
        <p className="admin-eyebrow">Structure</p>
        <h2>Photo categories</h2>
        <p className="admin-page-copy">Keep gallery labels tidy so uploads stay easy to browse.</p>
      </div>
      {successMessage ? <p className="admin-form-notice">{successMessage}</p> : null}
      {currentState?.error ? <p className="admin-form-notice">{currentState.error}</p> : null}
      <label>
        <span>Name</span>
        <input name="name" required />
      </label>
      <label>
        <span>Slug</span>
        <input name="slug" required />
      </label>
      <label>
        <span>Description</span>
        <textarea name="description" rows={3} />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue="DRAFT">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      <label>
        <span>Sort Order</span>
        <input name="sortOrder" type="number" defaultValue="0" />
      </label>
      <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
