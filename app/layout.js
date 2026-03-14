import "./globals.css";
import Link from "next/link";
import ClientEnhancements from "./components/ClientEnhancements";
import HeaderNav from "./components/HeaderNav";

export const metadata = {
  title: {
    default: "我的小小世界",
    template: "%s",
  },
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="auto">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap"
          rel="stylesheet"
        />
      </head>
      <body id="top" className="list" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (localStorage.getItem("pref-theme") === "dark") {
                document.body.classList.add("dark");
              } else if (localStorage.getItem("pref-theme") === "light") {
                document.body.classList.remove("dark");
              } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                document.body.classList.add("dark");
              }
            `,
          }}
        />
        <header className="header">
          <nav className="nav">
            <div className="logo">
              <Link href="/" accessKey="h" title="13log (Alt + H)">13log</Link>
              <div className="logo-switches">
                <button id="theme-toggle" accessKey="t" title="(Alt + T)" aria-label="Toggle theme">
                  <svg id="moon" xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <svg id="sun" xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </button>
              </div>
            </div>

            <HeaderNav />
          </nav>
        </header>

        <main className="main">{children}</main>

        <aside className="page-toc-rail" id="page-toc-rail" hidden aria-label="Table of Contents">
          <nav className="page-toc-rail__inner">
            <div className="page-toc-rail__title">Table of Contents</div>
            <ul className="page-toc-rail__list" id="page-toc-rail-list" />
          </nav>
        </aside>

        <footer className="footer">
          <span>&copy; {new Date().getFullYear()} <Link href="/">13log</Link></span>
          <span>By Br0u</span>
        </footer>

        <a href="#top" aria-label="go to top" title="Go to Top (Alt + G)" className="top-link" id="top-link" accessKey="g">
          <span className="top-link__label">top</span>
        </a>

        <ClientEnhancements />
      </body>
    </html>
  );
}
