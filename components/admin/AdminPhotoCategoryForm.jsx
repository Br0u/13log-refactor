"use client";

import React, { useActionState, useEffect, useState } from "react";
import AdminSubmitButton from "./AdminSubmitButton";

const INITIAL_FORM_STATE = {
  error: "",
};

function noopAction(previousState) {
  return previousState;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminPhotoCategoryForm({
  action,
  initialValue = null,
  formState: controlledFormState = null,
  successMessage = "",
  submitLabel = "Save category",
  pendingLabel = "Saving...",
  mode = "full",
}) {
  const [formState, formAction] = useActionState(action || noopAction, INITIAL_FORM_STATE);
  const currentState = controlledFormState || formState;
  const isQuickCreate = mode === "quick-create";
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
  const [nameValue, setNameValue] = useState(values.name);
  const [slugValue, setSlugValue] = useState(values.slug);
  const [slugDirty, setSlugDirty] = useState(Boolean(values.slug));

  useEffect(() => {
    setNameValue(values.name);
    setSlugValue(values.slug);
    setSlugDirty(Boolean(values.slug));
  }, [values.name, values.slug]);

  function handleNameChange(event) {
    const nextName = event.target.value;
    setNameValue(nextName);
    if (isQuickCreate && !slugDirty) {
      setSlugValue(slugify(nextName));
    }
  }

  function handleSlugChange(event) {
    setSlugDirty(true);
    setSlugValue(event.target.value);
  }

  return (
    <form action={formAction} className="admin-post-form admin-form admin-card">
      <div className="admin-card__header">
        <p className="admin-eyebrow">Structure</p>
        <h2>{isQuickCreate ? "Create album" : "Photo categories"}</h2>
        <p className="admin-page-copy">
          {isQuickCreate
            ? "先创建一个相册，再进入相册页补文案和上传照片。"
            : "Keep gallery labels tidy so uploads stay easy to browse."}
        </p>
      </div>
      {successMessage ? <p className="admin-form-notice">{successMessage}</p> : null}
      {currentState?.error ? <p className="admin-form-notice">{currentState.error}</p> : null}
      <label>
        <span>Name</span>
        <input name="name" value={nameValue} onChange={handleNameChange} required />
      </label>
      <label>
        <span>Slug</span>
        <input name="slug" value={slugValue} onChange={handleSlugChange} required />
      </label>
      {!isQuickCreate ? (
        <>
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
        </>
      ) : null}
      <label>
        <span>Status</span>
        <select name="status" defaultValue={values.status}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      {!isQuickCreate ? (
        <label>
          <span>Sort Order</span>
          <input name="sortOrder" type="number" defaultValue={values.sortOrder} />
        </label>
      ) : null}
      <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
