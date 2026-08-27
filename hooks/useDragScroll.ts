import { useCallback, useRef } from 'react';

export function useDragScroll() {
  const cleanupRef = useRef<(() => void) | null>(null);

  const ref = useCallback((ele: HTMLDivElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!ele) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let isDragging = false;

    const start = (e: MouseEvent) => {
      isDown = true;
      isDragging = false;
      ele.classList.add('active');
      startX = e.pageX - ele.offsetLeft;
      scrollLeft = ele.scrollLeft;
    };

    const move = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - ele.offsetLeft;
      const walk = (x - startX) * 1.5; 
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      ele.scrollLeft = scrollLeft - walk;
    };

    const end = () => {
      isDown = false;
      ele.classList.remove('active');
      setTimeout(() => { isDragging = false; }, 0);
    };

    const preventClick = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    ele.addEventListener('mousedown', start);
    ele.addEventListener('mousemove', move);
    ele.addEventListener('mouseup', end);
    ele.addEventListener('mouseleave', end);
    ele.addEventListener('click', preventClick, true);

    cleanupRef.current = () => {
      ele.removeEventListener('mousedown', start);
      ele.removeEventListener('mousemove', move);
      ele.removeEventListener('mouseup', end);
      ele.removeEventListener('mouseleave', end);
      ele.removeEventListener('click', preventClick, true);
    };
  }, []);

  return ref;
}
