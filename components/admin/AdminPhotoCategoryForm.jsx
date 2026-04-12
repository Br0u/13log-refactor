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
  initialValue = null,
  formState: controlledFormState = null,
  successMessage = "",
  submitLabel = "Save category",
  pendingLabel = "Saving...",
}) {
  const [formState, formAction] = useActionState(action || noopAction, INITIAL_FORM_STATE);
  const currentState = controlledFormState || formState;
  const values = {
    name: initialValue?.name || "",
    slug: initialValue?.slug || "",
    description: initialValue?.description || "",
    albumAnnotation: initialValue?.albumAnnotation || "",
    displayTitle: initialValue?.displayTitle || "",
    coverTitle: initialValue?.coverTitle || "",
    indexDescription: initialValue?.indexDescription || "",
    detailDescription: initialValue?.detailDescription || "",
    status: initialValue?.status || "DRAFT",
    sortOrder: initialValue?.sortOrder ?? 0,
  };

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
        <input name="name" defaultValue={values.name} required />
      </label>
      <label>
        <span>Slug</span>
        <input name="slug" defaultValue={values.slug} required />
      </label>
      <label>
        <span>Description</span>
        <textarea name="description" rows={3} defaultValue={values.description} />
      </label>
      <label>
        <span>Annotation</span>
        <input name="albumAnnotation" defaultValue={values.albumAnnotation} />
      </label>
      <label>
        <span>Display Title</span>
        <input name="displayTitle" defaultValue={values.displayTitle} />
      </label>
      <label>
        <span>Cover Title</span>
        <textarea name="coverTitle" rows={3} defaultValue={values.coverTitle} />
      </label>
      <label>
        <span>Index Description</span>
        <textarea name="indexDescription" rows={3} defaultValue={values.indexDescription} />
      </label>
      <label>
        <span>Detail Description</span>
        <textarea name="detailDescription" rows={4} defaultValue={values.detailDescription} />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={values.status}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      <label>
        <span>Sort Order</span>
        <input name="sortOrder" type="number" defaultValue={values.sortOrder} />
      </label>
      <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
