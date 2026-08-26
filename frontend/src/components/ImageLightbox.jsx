import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const SWIPE_THRESHOLD = 50;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const touchDistance = (touches) => {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
};

export default function ImageLightbox({ images, activeIndex, onClose, onChangeIndex, alt }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const touchRef = useRef(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset pan/zoom whenever the active image changes.
  useEffect(() => {
    resetView();
  }, [activeIndex, resetView]);

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(+(z + ZOOM_STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = clampZoom(+(z - ZOOM_STEP).toFixed(2));
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const goPrev = useCallback(() => {
    if (images.length > 1) onChangeIndex((activeIndex - 1 + images.length) % images.length);
  }, [images.length, activeIndex, onChangeIndex]);

  const goNext = useCallback(() => {
    if (images.length > 1) onChangeIndex((activeIndex + 1) % images.length);
  }, [images.length, activeIndex, onChangeIndex]);

  // Keyboard controls: Escape to close, arrows to switch images, +/- to zoom.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-' || e.key === '_') zoomOut();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev, zoomIn, zoomOut]);

  // Lock page scroll while the lightbox is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const handleDoubleClick = () => {
    setZoom((z) => (z > 1 ? 1 : 2));
    setPan({ x: 0, y: 0 });
  };

  // --- Mouse drag-to-pan (desktop, only while zoomed in) ---
  const startDrag = (clientX, clientY) => {
    if (zoom <= 1) return;
    dragRef.current = { startX: clientX, startY: clientY, panX: pan.x, panY: pan.y };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.panX + (clientX - dragRef.current.startX), y: dragRef.current.panY + (clientY - dragRef.current.startY) });
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  // --- Touch: pinch-to-zoom, drag-to-pan while zoomed, swipe left/right to change image ---
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchRef.current = { mode: 'pinch', startDistance: touchDistance(e.touches), startZoom: zoom };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current =
        zoom > 1
          ? { mode: 'pan', startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y }
          : { mode: 'swipe', startX: t.clientX, startY: t.clientY };
    }
  };

  const handleTouchMove = (e) => {
    const state = touchRef.current;
    if (!state) return;

    if (state.mode === 'pinch' && e.touches.length === 2) {
      const ratio = touchDistance(e.touches) / state.startDistance;
      setZoom(clampZoom(+(state.startZoom * ratio).toFixed(2)));
    } else if (state.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      setPan({ x: state.panX + (t.clientX - state.startX), y: state.panY + (t.clientY - state.startY) });
    }
    // 'swipe' mode: resolved on touch end below, once the gesture direction is clear.
  };

  const handleTouchEnd = (e) => {
    const state = touchRef.current;
    if (state?.mode === 'swipe') {
      const t = e.changedTouches[0];
      const deltaX = t.clientX - state.startX;
      const deltaY = t.clientY - state.startY;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) goNext();
        else goPrev();
      }
    }
    if (zoom === MIN_ZOOM) setPan({ x: 0, y: 0 });
    touchRef.current = null;
  };

  const image = images[activeIndex];
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-ink/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="rounded-full border border-border-soft p-2 text-star disabled:opacity-40"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="font-mono-price w-12 text-center text-xs text-muted">{Math.round(zoom * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="rounded-full border border-border-soft p-2 text-star disabled:opacity-40"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          {zoom > 1 && (
            <button onClick={resetView} className="rounded-full border border-border-soft p-2 text-star" aria-label="Reset zoom">
              <RotateCcw size={16} />
            </button>
          )}
        </div>
        <button onClick={onClose} className="rounded-full border border-border-soft p-2 text-star" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4"
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full border border-border-soft bg-surface/80 p-2 text-star sm:left-4"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <img
          src={image.url}
          alt={alt}
          onDoubleClick={handleDoubleClick}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
            transition: dragRef.current || touchRef.current ? 'none' : 'transform 150ms ease',
          }}
        />

        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full border border-border-soft bg-surface/80 p-2 text-star sm:right-4"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto p-4">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => onChangeIndex(i)}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border ${
                i === activeIndex ? 'border-flare-hot' : 'border-border-soft'
              }`}
            >
              <img src={img.thumbnail || img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
