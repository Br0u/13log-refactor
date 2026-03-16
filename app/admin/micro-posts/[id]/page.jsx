import React from "react";
import { notFound } from "next/navigation";
import { deleteMicroPostAction, updateMicroPostAction } from "../../actions";
import AdminMicroPostForm from "../../../../components/admin/AdminMicroPostForm";
import { getMicroPostById } from "../../../../lib/repositories/micro-posts";

export const dynamic = "force-dynamic";

export default async function AdminEditMicroPostPage({ params }) {
  const { id } = await params;
  const microPost = await getMicroPostById(id);

  if (!microPost) {
    notFound();
  }

  const action = updateMicroPostAction.bind(null, microPost.id);
  const initialValue = {
    content: microPost.content,
    status: microPost.status,
    publishedAt: microPost.publishedAt,
    tags: microPost.tags.map((item) => item.tag.name),
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Writing</p>
          <h1>Edit Micro Post</h1>
          <p className="admin-page-copy">修改短句内容、标签和发布状态。</p>
        </div>
      </header>
      <div className="admin-page__panel">
        <AdminMicroPostForm action={action} initialValue={initialValue} />
      </div>
      <div className="admin-page__panel">
        <form action={deleteMicroPostAction.bind(null, microPost.id)} className="admin-danger-zone">
          <p>Danger zone</p>
          <button type="submit" className="admin-shell__logout">Delete micro post</button>
        </form>
      </div>
    </section>
  );
}
