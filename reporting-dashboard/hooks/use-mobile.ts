import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const updateIsMobile = () => {
      setIsMobile(mql.matches)
    }

    // Set nilai awal setelah mount (client-only)
    updateIsMobile()

    mql.addEventListener("change", updateIsMobile)
    return () => mql.removeEventListener("change", updateIsMobile)
  }, [])

  return !!isMobile
}