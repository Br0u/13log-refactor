import React from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/comments", label: "Comments" },
];

export default async function AdminLayout({ children }) {
  return (
    <section className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand-wrap">
          <div className="admin-shell__brand">13log Admin</div>
          <p className="admin-shell__subcopy">Personal publishing console</p>
        </div>
        <nav className="admin-shell__nav" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="admin-shell__link">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="admin-shell__logout">Logout</button>
        </form>
      </aside>
      <div className="admin-shell__content">{children}</div>
    </section>
  );
}
