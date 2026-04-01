"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
  { href: "/link", label: "Link" },
  { href: "/playzone", label: "Playzone" },
  { href: "/photos/index.html", label: "Photos" },
];

function isActive(pathname, href) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <ul id="menu" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
