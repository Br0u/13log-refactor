export const projects = [
  {
    slug: "pixel-cat",
    title: "小黑的排练室",
    description: "64 个像素动作、17 组连续行为。回到首页，点击头像，就能叫小猫出门。",
    href: "/playzone/pixel-cat",
    image: "/pixel-cat/preview.png",
    external: false,
    eyebrow: "Companion",
    cta: "看看小猫",
    tags: ["互动实验", "像素动画"],
  },
  {
    slug: "dance-text",
    title: "Dance Text",
    description:
      "一个将语言、动作与节奏视为同一舞台元素的互动实验，页面更像表演界面，而非静态文档。",
    href: "https://dancetext-rho.vercel.app",
    external: true,
    featured: true,
    eyebrow: "Project",
    cta: "进入项目",
    tags: ["互动实验", "创意表达"],
    preview: {
      kicker: "Words in motion",
      title: "Dance Text",
      body:
        "An expressive reading surface where text pacing, motion, and spacing carry the feeling of choreography.",
      tone: "Language as choreography",
    },
  },
  {
    slug: "play-text",
    title: "Play Text",
    description:
      "一个专注于交互、节奏与语言的极简文本实验。",
    href: "https://playtext-five.vercel.app",
    external: true,
    eyebrow: "Project",
    cta: "进入项目",
    tags: ["文本游戏", "极简交互"],
    preview: {
      kicker: "Playable text",
      title: "Play Text",
      body: "A minimal interactive reading surface where motion and text share the same frame.",
      tone: "Text as interface",
    },
  },
];
