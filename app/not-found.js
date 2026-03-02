import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <h2>页面不存在</h2>
      <p>
        返回 <Link href="/">首页</Link>
      </p>
    </section>
  );
}