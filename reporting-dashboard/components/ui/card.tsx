import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  variant = "default",
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & { 
  size?: "default" | "sm"
  variant?: "default" | "premium"
}) {
  if (variant === "premium") {
    const cardStyle: React.CSSProperties = {
      position: "relative",
      background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%), var(--c-surface)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 18,
      overflow: "hidden",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.22)",
      transition: "transform 220ms cubic-bezier(0.4,0,0.2,1), border-color 220ms ease, box-shadow 220ms ease",
    }
    
    return (
      <div
        data-slot="card"
        data-size={size}
        style={{ ...cardStyle, ...style }}
        className={cn(
          "group hover:-translate-y-0.5 hover:border-white/8 hover:shadow-[0_12px_32px_rgba(0,0,0,0.28)] flex flex-col gap-4 text-sm text-card-foreground",
          className
        )}
        {...props}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/6" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_55%)]" />
        <div className="relative z-10 w-full h-full flex flex-col">{children}</div>
      </div>
    )
  }

  return (
    <div
      data-slot="card"
      data-size={size}
      style={style}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

const PremiumCard = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Card>>((props, ref) => {
  return <Card ref={ref} variant="premium" {...props} />
})
PremiumCard.displayName = "PremiumCard"

export default PremiumCard
