import React from "react";
import MarkdownEditorField from "./MarkdownEditorField";
import AdminSubmitButton from "./AdminSubmitButton";
import AdminPublishedAtField from "./AdminPublishedAtField";

export default function AdminMicroPostForm({
  action,
  initialValue = {},
  successMessage = "",
  submitLabel = "Save micro post",
  pendingLabel = "Saving...",
}) {
  return (
    <form action={action} className="admin-post-form admin-form">
      {successMessage ? <p className="admin-form-notice">{successMessage}</p> : null}
      <MarkdownEditorField
        name="content"
        label="Content"
        initialValue={initialValue.content || ""}
        rows={8}
        required
        mode="micro"
      />
      <label>
        <span>Tags</span>
        <input
          name="tags"
          defaultValue={Array.isArray(initialValue.tags) ? initialValue.tags.join(", ") : ""}
          placeholder="mood, notes"
        />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={initialValue.status || "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      {initialValue.status === "PUBLISHED" ? (
        <AdminPublishedAtField initialValue={initialValue.publishedAt || ""} />
      ) : (
        <p className="admin-form-hint">Publication time becomes editable after the micro post is published.</p>
      )}
      <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
