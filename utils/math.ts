/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, amt: number): number => {
  return (1 - amt) * start + amt * end;
};

/**
 * Maps a value from one range to another (equivalent to np.interp)
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  // Clamp input
  if (value < inMin) value = inMin;
  if (value > inMax) value = inMax;

  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Calculate Euclidean distance between two points
 */
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.hypot(x2 - x1, y2 - y1);
};
