
import { useEffect, useRef } from 'react';

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e: TouchEvent) {
      touchEndX.current = e.changedTouches[0].screenX;
      handleSwipe();
    }

    function handleSwipe() {
      const swipeThreshold = 75; // Increased threshold to prevent accidental swipes
      const diff = touchStartX.current - touchEndX.current;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diff < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}
