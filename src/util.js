export const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];
export const M0 = IDENTITY_MATRIX;
export const M90 = [0, 1, -1, 0, 0, 0];
export const M180 = [-1, 0, 0, -1, 0, 0];
export const M270 = [0, -1, 1, 0, 0, 0];


// For 2d affine transforms
export function applyTransform(p, m) {
  const xt = p[0] * m[0] + p[1] * m[2] + m[4];
  const yt = p[0] * m[1] + p[1] * m[3] + m[5];
  return [xt, yt];
}

export function rotate(rot, x, y) {
  const p = [x,y];
  let m = IDENTITY_MATRIX;
  if (rot === 90) {
    m = M270;
  } else if (rot === 180) {
    m = M180;
  } else if (rot === 270) {
    m = M90;
  } else {
    m = IDENTITY_MATRIX;
  }
  return applyTransform(p,m);
}

