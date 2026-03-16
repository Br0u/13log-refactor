import React from "react";

export default function AdminPostForm({
  action,
  categories = [],
  initialValue = {},
}) {
  return (
    <form action={action} className="admin-post-form admin-form">
      <label>
        <span>Title</span>
        <input name="title" defaultValue={initialValue.title || ""} required />
      </label>
      <label>
        <span>Slug</span>
        <input name="slug" defaultValue={initialValue.slug || ""} required />
      </label>
      <label>
        <span>Summary</span>
        <textarea name="summary" defaultValue={initialValue.summary || ""} rows={3} />
      </label>
      <label>
        <span>Markdown</span>
        <textarea name="markdown" defaultValue={initialValue.markdown || ""} rows={18} required />
      </label>
      <label>
        <span>Cover Image</span>
        <input name="coverImage" defaultValue={initialValue.coverImage || ""} />
      </label>
      <label>
        <span>Category</span>
        <select name="categoryId" defaultValue={initialValue.categoryId || ""}>
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Tags</span>
        <input
          name="tags"
          defaultValue={Array.isArray(initialValue.tags) ? initialValue.tags.join(", ") : ""}
          placeholder="backend, database"
        />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={initialValue.status || "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      <button type="submit" className="admin-primary-button">Save post</button>
    </form>
  );
}
