export function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n)
}