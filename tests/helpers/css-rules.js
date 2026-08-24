export function mediaBlockContaining(css, condition, needle) {
  const matcher = new RegExp(`@media\\s*\\(${condition}\\)\\s*\\{`, "g");
  let match;

  while ((match = matcher.exec(css))) {
    const openingBrace = css.indexOf("{", match.index);
    let depth = 1;
    let cursor = openingBrace + 1;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === "{") depth += 1;
      if (css[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    const block = css.slice(openingBrace + 1, cursor - 1);
    if (block.includes(needle)) return block;
    matcher.lastIndex = cursor;
  }

  return "";
}

export function centerMaskStops(ruleText) {
  const gradient = /(?:-webkit-)?mask-image:\s*(?:radial|linear)-gradient\(([^;]+)\);/s.exec(ruleText)?.[1] ?? "";
  const transparentStop = /transparent\s+(\d+(?:\.\d+)?)%/i.exec(gradient);
  const tail = transparentStop
    ? gradient.slice((transparentStop.index ?? 0) + transparentStop[0].length)
    : "";
  const outerStop = /(?:#[\da-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|black|white|var\([^)]*\))\s+(\d+(?:\.\d+)?)%/i.exec(tail);

  if (!transparentStop || !outerStop) return null;
  return {
    inner: Number(transparentStop[1]),
    outer: Number(outerStop[1]),
  };
}
