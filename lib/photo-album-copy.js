export const PHOTO_ALBUM_COPY = {
  car: {
    displayName: "世界は　ただ通り過ぎていく",
    coverTitleLines: ["世界は　ただ通り過ぎていく"],
    body: [
      "車窗之外，世界剛好經過。",
      "沒有停留，也沒有帶走什麼。",
    ],
  },
  random: {
    displayName: "日常才是最难被看见的东西。",
    coverTitleLines: ["日常才是最难被看见的东西。"],
    body: [
      "一些不重要的瞬間。",
      "剛好，被留下來。",
    ],
  },
  april: {
    displayName: "四月的空氣",
    coverTitleLines: ["四月的空氣"],
    body: [
      "光線變輕了。",
      "風裡開始有新的氣味。",
    ],
  },
  again: {
    displayName: "再一次，也可以",
    coverTitleLines: ["告诉你吧，世界", "我—不—相—信！"],
    body: [
      "有些事，不需要理由。",
      "只是想，再來一遍。",
    ],
  },
};

export function getPhotoAlbumCopy(slug, fallbackName, fallbackDescription = "") {
  const matched = PHOTO_ALBUM_COPY[String(slug || "").toLowerCase()];
  if (matched) return matched;

  return {
    displayName: fallbackName,
    coverTitleLines: [fallbackName],
    body: fallbackDescription ? [fallbackDescription] : [],
  };
}
