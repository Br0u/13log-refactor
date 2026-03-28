"use client";

import React, { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSubmitButton from "./AdminSubmitButton";

const INITIAL_FORM_STATE = {
  error: "",
};

function noopAction(previousState) {
  return previousState;
}

export default function AdminPhotoForm({
  action,
  categories = [],
  albumId = "",
  albumName = "",
  initialValue = null,
  mode = "create",
  createEndpoint = "",
  formState: controlledFormState = null,
  successMessage = "",
  submitLabel = "Save photo",
  pendingLabel = "Saving...",
}) {
  const router = useRouter();
  const [formState, formAction] = useActionState(action || noopAction, INITIAL_FORM_STATE);
  const [clientError, setClientError] = useState("");
  const [clientSuccess, setClientSuccess] = useState("");
  const [clientPending, setClientPending] = useState(false);
  const formRef = useRef(null);
  const currentState = controlledFormState || formState;
  const values = {
    title: initialValue?.title || "",
    caption: initialValue?.caption || "",
    sortOrder: initialValue?.sortOrder ?? "",
    categoryId: initialValue?.categoryId || albumId || "",
  };
  const isEditMode = mode === "edit";
  const useClientCreateFlow = Boolean(createEndpoint) && !isEditMode;

  async function handleClientCreateSubmit(event) {
    event.preventDefault();

    if (!useClientCreateFlow || clientPending) {
      return;
    }

    const form = event.currentTarget;
    const submission = new FormData(form);
    const fileInput = form.querySelector('input[name="file"]');
    const files = Array.from(fileInput?.files || []).filter((entry) => entry instanceof File && entry.size > 0);

    if (!files.length) {
      setClientError("Only image uploads are supported.");
      return;
    }

    setClientPending(true);
    setClientError("");
    setClientSuccess("");

    try {
      const uploads = [];

      for (const file of files) {
        if (!String(file.type || "").startsWith("image/")) {
          throw new Error("Only image uploads are supported.");
        }

        const uploadFormData = new FormData();
        uploadFormData.set("file", file);

        const uploadResponse = await fetch("/api/admin/uploads/image", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadBody = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(uploadBody?.message || "Image upload failed.");
        }

        uploads.push({
          url: String(uploadBody?.url || ""),
          pathname: String(uploadBody?.pathname || ""),
          fileName: file.name,
        });
      }

      const createResponse = await fetch(createEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          categoryId: String(submission.get("categoryId") || ""),
          title: String(submission.get("title") || ""),
          caption: String(submission.get("caption") || ""),
          sortOrder: String(submission.get("sortOrder") || ""),
          uploads,
        }),
      });

      const createBody = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) {
        throw new Error(createBody?.message || "Unable to save photo right now.");
      }

      form.reset();
      setClientSuccess("Photos saved.");
      router.refresh();
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Unable to save photo right now.");
    } finally {
      setClientPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={useClientCreateFlow ? undefined : formAction}
      onSubmit={useClientCreateFlow ? handleClientCreateSubmit : undefined}
      className="admin-post-form admin-form admin-card"
    >
      <div className="admin-card__header">
        <p className="admin-eyebrow">{isEditMode ? "Manage" : "Upload"}</p>
        <h2>{isEditMode ? "Edit photo" : "Upload photo"}</h2>
        <p className="admin-page-copy">
          {isEditMode
            ? "Adjust metadata and ordering for this photo."
            : "Import an image, add metadata, and place it into the gallery."}
        </p>
      </div>
      {successMessage || clientSuccess ? <p className="admin-form-notice">{successMessage || clientSuccess}</p> : null}
      {currentState?.error || clientError ? <p className="admin-form-notice">{currentState?.error || clientError}</p> : null}
      {!isEditMode ? (
        <label>
          <span>Image</span>
          <input name="file" type="file" accept="image/*" multiple required />
          <small className="admin-form-hint">You can choose multiple images at once on mobile or desktop.</small>
        </label>
      ) : null}
      <label>
        <span>Title</span>
        <input name="title" defaultValue={values.title} />
        {!isEditMode ? (
          <small className="admin-form-hint">Leave title empty to reuse each file name during batch upload.</small>
        ) : null}
      </label>
      <label>
        <span>Caption</span>
        <textarea name="caption" rows={3} defaultValue={values.caption} />
      </label>
      {albumId ? (
        <label>
          <span>Album</span>
          <input value={albumName} readOnly />
          <input type="hidden" name="categoryId" value={albumId} />
        </label>
      ) : (
        <label>
          <span>Album</span>
          <select name="categoryId" defaultValue={values.categoryId} required>
            <option value="">Select album</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>Sort Order</span>
        <input name="sortOrder" type="number" defaultValue={values.sortOrder} />
        <small className="admin-form-hint">
          {isEditMode ? "Use a smaller number to move this photo earlier in the album." : "Leave empty to append after existing photos in this album."}
        </small>
      </label>
      {useClientCreateFlow ? (
        <button type="submit" className="admin-primary-button" disabled={clientPending} aria-busy={clientPending}>
          {clientPending ? pendingLabel : submitLabel}
        </button>
      ) : (
        <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      )}
    </form>
  );
}
