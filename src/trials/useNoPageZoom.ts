import { useEffect } from 'react'

/**
 * Blocks browser page zoom and pull-to-refresh while a drawing trial is open,
 * so a second finger, resting palm or downward drag never zooms, bounces or
 * reloads the page (seen on iPad Safari).
 * Scoped to the component's lifetime: the trials hub and other pages keep
 * normal zoom. Double-tap zoom is handled by `touch-action: manipulation` in
 * trials.css (.t-zoom-locked).
 */
export function useNoPageZoom() {
  useEffect(() => {
    const block = (event: Event) => { if (event.cancelable) event.preventDefault() }
    // Pinch with two or more fingers anywhere on the page.
    const multiTouch = (event: TouchEvent) => { if (event.touches.length > 1 && event.cancelable) event.preventDefault() }
    // Safari's own pinch events (non-standard; ignored by other browsers).
    const gestures = ['gesturestart', 'gesturechange', 'gestureend']
    // Pull-to-refresh: a one-finger drag downwards while the page is already
    // at the top would stretch the page and reload it. Scrolling content
    // (dragging up, or down once scrolled) still works.
    let startY = 0
    const touchStart = (event: TouchEvent) => { startY = event.touches[0]?.clientY ?? 0 }
    const pullDown = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !event.cancelable) return
      const pullingDown = event.touches[0].clientY > startY
      if (pullingDown && window.scrollY <= 0) event.preventDefault()
    }
    document.addEventListener('touchstart', touchStart, { passive: true })
    document.addEventListener('touchmove', pullDown, { passive: false })
    document.addEventListener('touchmove', multiTouch, { passive: false })
    for (const name of gestures) document.addEventListener(name, block, { passive: false })
    document.documentElement.classList.add('t-zoom-locked')
    return () => {
      document.removeEventListener('touchstart', touchStart)
      document.removeEventListener('touchmove', pullDown)
      document.removeEventListener('touchmove', multiTouch)
      for (const name of gestures) document.removeEventListener(name, block)
      document.documentElement.classList.remove('t-zoom-locked')
    }
  }, [])
}
