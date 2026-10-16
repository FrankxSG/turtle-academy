import { useEffect } from 'react'

/**
 * Blocks browser page zoom while a drawing trial is open, so a second finger
 * or resting palm while writing never zooms the page (seen on iPad Safari).
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
    document.addEventListener('touchmove', multiTouch, { passive: false })
    for (const name of gestures) document.addEventListener(name, block, { passive: false })
    document.documentElement.classList.add('t-zoom-locked')
    return () => {
      document.removeEventListener('touchmove', multiTouch)
      for (const name of gestures) document.removeEventListener(name, block)
      document.documentElement.classList.remove('t-zoom-locked')
    }
  }, [])
}
