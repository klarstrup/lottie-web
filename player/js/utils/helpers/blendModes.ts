const blendModeEnums = {
  0: "source-over",
  1: "multiply",
  2: "screen",
  3: "overlay",
  4: "darken",
  5: "lighten",
  6: "color-dodge",
  7: "color-burn",
  8: "hard-light",
  9: "soft-light",
  10: "difference",
  11: "exclusion",
  12: "hue",
  13: "saturation",
  14: "color",
  15: "luminosity",
} as const;

export default function getBlendMode(mode: keyof typeof blendModeEnums) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return blendModeEnums[mode] || "";
}
