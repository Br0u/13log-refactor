// 48px sprite coordinates shared by the drawn paw and the carried glyph.
// Frame 5 of reach makes contact; return frame 5 releases at the same point.
export const LETTER_PAWS = {
  letter_reach: [[29, 32], [29, 33], [30, 35], [31, 38], [32, 40], [32, 42], [32, 42], [32, 42]],
  letter_lift: [[32, 42], [32, 41], [33, 39], [34, 36], [35, 33], [36, 31], [36, 30], [36, 30]],
  letter_play: [[36, 30], [34, 29], [33, 30], [34, 32], [36, 33], [38, 32], [39, 30], [37, 29]],
  letter_return: [[36, 30], [36, 31], [35, 33], [34, 36], [32, 40], [32, 42], [31, 38], [29, 32]],
};
export const LETTER_FRAME_MS = 140;
export const LETTER_CONTACT_FRAME = 5;
export function letterGrip(action, frame, facing = 1) {
  const [x, y] = LETTER_PAWS[action][frame];
  return { x: (facing === 1 ? x : 48 - x) * 2, y: y * 2 };
}
