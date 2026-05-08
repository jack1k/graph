export const sign = (x) => x / Math.abs(x)
export const floor = (x) => Math.floor(x)
export const ceil = (x) => Math.ceil(x)
export const max = (a, b) => Math.max(a, b)
export const min = (a, b) => Math.min(a, b)
export const clamp = (min, x, max) => Math.max(min, Math.min(x, max))
export const log = (a, b) => Math.log(b) / Math.log(a)
export const round = (n, precision = 10) => Math.round(n * 10 ** precision) / 10 ** precision
export const abs = (x) => Math.abs(x)