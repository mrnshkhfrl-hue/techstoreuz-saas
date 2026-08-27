"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  // Touch tracking refs
  const touchStart = useRef({ x: 0, y: 0 });
  const touchDist = useRef(0);
  const lastTap = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = images.length > 0;

  // Reset when changing images
  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setIsZoomed(false);
  }, []);

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < images.length) {
      resetZoom();
      setCurrentIndex(idx);
    }
  }, [images.length, resetZoom]);

  const goPrev = useCallback(() => goTo((currentIndex - 1 + images.length) % images.length), [currentIndex, images.length, goTo]);
  const goNext = useCallback(() => goTo((currentIndex + 1) % images.length), [currentIndex, images.length, goTo]);

  // Double-tap to zoom
  const handleDoubleTap = useCallback(() => {
    if (isZoomed) {
      resetZoom();
    } else {
      setScale(2.5);
      setIsZoomed(true);
    }
  }, [isZoomed, resetZoom]);

  // Touch distance for pinch
  const getTouchDist = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      touchDist.current = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDragging.current = true;

      // Double tap detection
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handleDoubleTap();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const newDist = getTouchDist(e.touches);
      if (touchDist.current > 0) {
        const delta = newDist / touchDist.current;
        setScale(prev => Math.max(1, Math.min(5, prev * delta)));
        setIsZoomed(true);
      }
      touchDist.current = newDist;
    } else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;

      if (isZoomed) {
        // Pan when zoomed
        setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, [isZoomed]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isZoomed && isDragging.current && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;

      // Horizontal swipe detection (min 60px, more horizontal than vertical)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) goPrev();
        else goNext();
      }
      // Vertical swipe down = close
      if (dy > 100 && Math.abs(dy) > Math.abs(dx) * 2) {
        onClose();
      }
    }

    isDragging.current = false;
    touchDist.current = 0;

    // Snap back if scale ≤ 1
    if (scale <= 1.05) {
      resetZoom();
    }
  }, [isZoomed, scale, goPrev, goNext, onClose, resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black"
          ref={containerRef}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 z-10">
            <span className="text-white/50 text-sm font-semibold">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 active:scale-90 transition-all"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt=""
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-[95vw] max-h-[75vh] object-contain"
                style={{
                  transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                  transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
                }}
                draggable={false}
              />
            </AnimatePresence>

            {/* Desktop arrows */}
            {images.length > 1 && !isZoomed && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 pb-8 pt-4">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "bg-white w-6" : "bg-white/30 w-2"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Zoom hint */}
          {!isZoomed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/20 text-xs font-medium pb-4"
            >
              Двойной тап для увеличения
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
