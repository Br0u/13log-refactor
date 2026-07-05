"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Gamepad2, Images, Link2, UserRound } from "lucide-react";

const NAV_ITEMS = [
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
  { href: "/link", label: "Link" },
  { href: "/playzone", label: "Playzone" },
  { href: "/photos", label: "Photos" },
];

const NAV_ICONS = {
  "/posts": FileText,
  "/about": UserRound,
  "/link": Link2,
  "/playzone": Gamepad2,
  "/photos": Images,
};

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
        const Icon = NAV_ICONS[item.href];

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              {Icon ? <Icon className="site-nav-icon" aria-hidden="true" size={22} strokeWidth={1.8} /> : null}
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
