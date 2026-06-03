export const fmt = (n: number | string): string => {
  if (typeof n === "string") return n
  return new Intl.NumberFormat("en-US").format(n)
}