import Link from "next/link";

export default function HomePage() {
  return (
    <section className="profile profile--rainy-mask">
      <div className="profile_inner">
        <div className="profile-avatar-card" tabIndex={0} aria-label="头像动画">
          <div className="profile-avatar-scene" aria-hidden="true">
            <img
              className="profile-avatar-frame profile-avatar-frame--base"
              draggable="false"
              src="/images/home/curious-cats-fallen-flower-base.png"
              alt=""
              height="240"
              width="240"
            />
            <img
              className="profile-avatar-frame profile-avatar-frame--hover"
              draggable="false"
              src="/images/home/curious-cats-fallen-flower-base.png"
              alt=""
              height="240"
              width="240"
            />
            <img
              className="profile-avatar-popout profile-avatar-popout--base"
              draggable="false"
              src="/images/home/curious-cats-fallen-flower-cat.png"
              alt=""
              height="372"
              width="380"
            />
            <img
              className="profile-avatar-popout profile-avatar-popout--hover"
              draggable="false"
              src="/images/home/curious-cats-wilted-flower-cat.png"
              alt=""
              height="372"
              width="380"
            />
          </div>
        </div>
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
          <Link className="button" href="/photos/"><span className="button-inner">Photos</span></Link>
          <Link className="button" href="/link/"><span className="button-inner">Link</span></Link>
          <Link className="button" href="/playzone/"><span className="button-inner">Playzone</span></Link>
        </div>
      </div>
    </section>
  );
}
