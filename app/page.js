import Link from "next/link";
import HomeAvatarParallax from "./components/HomeAvatarParallax";
import HomeBackgroundDepth from "./components/HomeBackgroundDepth";
import HomeRainLayer from "./components/HomeRainLayer";
import {
  FileText,
  Gamepad2,
  Github,
  ImageIcon,
  Instagram,
  Link2,
  Mail,
  UserRound,
} from "lucide-react";

export default function HomePage() {
  return (
    <section className="profile profile--rainy-mask">
      <HomeBackgroundDepth />
      <HomeRainLayer />
      <div className="profile_inner">
        <HomeAvatarParallax />
        <h1>花似伊，柳似伊</h1>
        <span className="profile-kicker">Books · Life</span>
        <div className="profile-links">
          <a target="_blank" rel="noopener noreferrer" href="mailto:wusg0315@qq.com">
            <Mail className="profile-links__icon" aria-hidden="true" size={22} strokeWidth={1.9} />
            Email<span className="profile-links__arrow" aria-hidden="true">&#8599;</span>
          </a>
          <a target="_blank" rel="noopener noreferrer" href="https://github.com/Br0u">
            <Github className="profile-links__icon" aria-hidden="true" size={22} strokeWidth={1.9} />
            GitHub<span className="profile-links__arrow" aria-hidden="true">&#8599;</span>
          </a>
          <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/nightknightbrou/">
            <Instagram className="profile-links__icon" aria-hidden="true" size={22} strokeWidth={1.9} />
            Instagram<span className="profile-links__arrow" aria-hidden="true">&#8599;</span>
          </a>
        </div>
        <div className="social-icons" />

        <div className="buttons">
          <Link className="button" href="/posts/"><FileText className="button-icon" aria-hidden="true" size={26} strokeWidth={1.8} /><span className="button-inner">Posts</span></Link>
          <Link className="button" href="/about/"><UserRound className="button-icon" aria-hidden="true" size={27} strokeWidth={1.8} /><span className="button-inner">About</span></Link>
          <Link className="button" href="/photos/"><ImageIcon className="button-icon" aria-hidden="true" size={27} strokeWidth={1.8} /><span className="button-inner">Photos</span></Link>
          <Link className="button" href="/link/"><Link2 className="button-icon" aria-hidden="true" size={27} strokeWidth={1.9} /><span className="button-inner">Link</span></Link>
          <Link className="button button--playzone" href="/playzone/"><Gamepad2 className="button-icon" aria-hidden="true" size={27} strokeWidth={1.8} /><span className="button-inner">Playzone</span></Link>
        </div>
      </div>
    </section>
  );
}
