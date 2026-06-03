export default function Skeleton({
  w = 80,
  h = 28,
}: {
  w?: number | string
  h?: number | string
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: "var(--c-skeleton)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  )
}