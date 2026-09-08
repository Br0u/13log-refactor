import React from "react";
import Image from "next/image";
import HtmlContent from "../components/HtmlContent";
import AboutGuestbook from "../../components/about/AboutGuestbook";
import AboutScroll from "../../components/about/AboutScroll";
import AboutInkProgress from "../../components/about/AboutInkProgress";
import HangingPhoto from "../../components/about/HangingPhoto";
import { LocationMap } from "../../components/ui/expand-map";
import { getAboutPage, renderMarkdown } from "../../lib/content";
import { getPublicPhotoAlbumBySlug } from "../../lib/public-photos";
import styles from "./about.module.css";

export const metadata = { title: "About | 我的小小世界" };

// Fixed selections from the published Random album; unpublished items disappear.
const selections = [
  { imageUrl: "/images/gallery/R0001640.jpg", caption: "林间" },
  { imageUrl: "/images/gallery/IMG_4256.jpg", caption: "暮色" },
  { imageUrl: "/images/gallery/IMG_8441.jpg", caption: "猫与窗" },
  { imageUrl: "/images/gallery/R0002247.jpg", caption: "月色" },
  { imageUrl: "/images/gallery/IMG_4023.jpg", caption: "夕照" },
];

export default async function AboutPage() {
  const about = getAboutPage();
  const [me, blog = ""] = (about.content || "").split("<!-- photos -->");
  const [meHtml, blogHtml, album] = await Promise.all([
    renderMarkdown(me), renderMarkdown(blog), getPublicPhotoAlbumBySlug("random"),
  ]);
  const photos = selections.flatMap(({ imageUrl, caption }) => {
    const photo = album?.photos.find((item) => item.imageUrl === imageUrl);
    return photo ? [{ ...photo, caption }] : [];
  });

  return (
    <section className={styles.note} aria-label="关于 Brou">
      <AboutInkProgress />
      <noscript><style>{`.${styles.scrollTrack}{height:auto;margin-bottom:60px}.${styles.scrollStage}{position:static;height:auto}.${styles.paper}{clip-path:none!important}.${styles.bottomRod}{top:100%!important}.${styles.paperEdge},.${styles.rollTitle},.${styles.scrollFrame}::before{display:none!important}`}</style></noscript>
      <div className={styles.opening}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>关于 / ABOUT</p>
        <div className={styles.identity}>
          <h1>Brou<span aria-hidden="true">.</span></h1>
        </div>
        <p className={styles.subtitle}>懒，但尚未放弃。</p>
        <div className={styles.authorNote}>
          <Image src="/pics/about/tx.jpg" alt="Brou 的头像" width={44} height={44} />
          <p>写字、摄影，也写代码。<br />在这里留下一些生活的痕迹。</p>
        </div>
        <a className={`skip-link ${styles.skip}`} href="#about-body">向下展卷 <span aria-hidden="true">↓</span></a>
      </header>

      <AboutScroll>
        <div className={styles.inscription}>
          <p><span>竹影潭下绿</span><span>荷花镜里香</span></p>
          <span className={styles.smallSeal} aria-hidden="true">小记</span>
        </div>
      </AboutScroll>
      </div>

      <article id="about-body" tabIndex={-1} className={styles.body}>
        <div className={styles.chapter} data-ink-node="壹"><span>壹</span><span>一些关于我的事 / ABOUT ME</span></div>
        <HtmlContent html={meHtml} className={styles.prose} />
        {photos.length > 0 && (
          <section className={styles.memories} aria-label="照片小记" data-ink-node="影">
            <div className={styles.photos}>
              {photos.map((photo, index) => (
                <HangingPhoto photo={photo} index={index} key={photo.id} />
              ))}
            </div>
            <p className={styles.photoNote}>用镜头记录一些无意义的瞬间。<a href="/photos">翻翻相册 ↗</a></p>
          </section>
        )}
        <div className={styles.chapter} data-ink-node="贰"><span>贰</span><span>这一方小天地 / THE BLOG</span></div>
        <HtmlContent html={blogHtml} className={styles.prose} />
        <section className={styles.location} aria-labelledby="about-location" data-ink-node="叁">
          <div className={styles.chapter}><span>叁</span><span>此刻所在 / FROM</span></div>
          <h2 id="about-location">Toronto, Ontario</h2>
          <LocationMap className={styles.map} location="Toronto, Ontario" coordinates="43.6532° N, 79.3832° W" />
        </section>
        <footer className={styles.letter} data-ink-node="终">
          <div className={styles.chapter}><span>终</span><span>见字如面 / A LETTER</span></div>
          <AboutGuestbook />
        </footer>
        <p className={styles.endmark}>未完，待续。<span aria-hidden="true">○</span></p>
      </article>
    </section>
  );
}
