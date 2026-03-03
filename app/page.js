import Link from "next/link";

export default function HomePage() {
  return (
    <section className="profile">
      <div className="profile_inner">
        <img
          draggable="false"
          src="/images/avatar.jpg"
          alt="Avatar"
          title="Avatar"
          height="150"
          width="150"
        />
        <h1>花似伊，柳似伊</h1>
        <span>Books · Life</span>
        <div className="profile-links">
          <a target="_blank" rel="noopener noreferrer" href="mailto:wusg0315@qq.com">Email<span className="profile-links__arrow" aria-hidden="true">&#8599;</span></a>
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/Br0u">GitHub<span className="profile-links__arrow" aria-hidden="true">&#8599;</span></a>
          <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/nightknightbrou/">Instagram<span className="profile-links__arrow" aria-hidden="true">&#8599;</span></a>
        </div>
        <div className="social-icons" />

        <div className="buttons">
          <Link className="button" href="/posts/"><span className="button-inner">Posts</span></Link>
          <Link className="button" href="/about/"><span className="button-inner">About</span></Link>
          <a className="button" href="/photos/" target="_blank" rel="noopener noreferrer"><span className="button-inner">Photos</span></a>
          <Link className="button" href="/link/"><span className="button-inner">Link</span></Link>
        </div>
      </div>
    </section>
  );
}
