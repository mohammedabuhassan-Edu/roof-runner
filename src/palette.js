// STYLE: anime cel shaded | PALETTE: #1d1b2f #5b5f97 #ffc1cc #a0e7e5 #fef9ef #ff6b6b | OUTLINE: thin | SHADING: cel | DETAIL: smooth | MOOD: dreamy, heroic, vivid
export const PALETTE = {
  bgFar: 0x1d1b2f,
  bgNear: 0x5b5f97,
  player: 0xffc1cc,
  accent: 0xa0e7e5,
  light: 0xfef9ef,
  highlight: 0xff6b6b,
};

export function hex(c) {
  return `#${c.toString(16).padStart(6, '0')}`;
}
