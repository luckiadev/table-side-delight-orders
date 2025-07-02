import * as React from "react"

const BREAKPOINTS = {
  mobile: 640,    // sm
  tablet: 768,    // md  
  desktop: 1024,  // lg
  wide: 1280      // xl
} as const

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.mobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<keyof typeof BREAKPOINTS | 'wide'>('mobile')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.mobile) setBreakpoint('mobile')
      else if (width < BREAKPOINTS.tablet) setBreakpoint('mobile') 
      else if (width < BREAKPOINTS.desktop) setBreakpoint('tablet')
      else if (width < BREAKPOINTS.wide) setBreakpoint('desktop')
      else setBreakpoint('wide')
    }
    
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet', 
    isDesktop: breakpoint === 'desktop',
    isWide: breakpoint === 'wide'
  }
}