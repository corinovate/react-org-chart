import React, { useLayoutEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export interface PanZoomCanvasProps {
  contentWidth: number;
  contentHeight: number;
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
}

function ZoomButton({ label, title, onClick }: { label: string; title?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '1px solid var(--oc-card-border)',
        background: 'var(--oc-card-bg-hover)',
        color: 'var(--oc-text-primary)',
        fontSize: 16,
        lineHeight: '1',
        cursor: 'pointer',
        boxShadow: 'var(--oc-card-shadow)',
      }}
    >
      {label}
    </button>
  );
}

export function PanZoomCanvas({
  contentWidth,
  contentHeight,
  children,
  minScale = 0.2,
  maxScale = 2.5,
}: PanZoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState<number | null>(null);

  // Fit-to-screen on mount / whenever the tree's overall size changes (e.g. a
  // person was added), rather than always opening at 100% and risking part of
  // a large tree landing off-screen, or a tiny tree looking lost in the canvas.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || contentWidth === 0 || contentHeight === 0) return;
    const { width, height } = el.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const fit = Math.min(width / contentWidth, height / contentHeight, 1);
    setFitScale(Math.max(minScale, Math.min(maxScale, fit * 0.92)));
  }, [contentWidth, contentHeight, minScale, maxScale]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--oc-background)' }}
    >
      {fitScale !== null && (
        <TransformWrapper
          key={`${contentWidth}x${contentHeight}`}
          initialScale={fitScale}
          minScale={minScale}
          maxScale={maxScale}
          centerOnInit
          limitToBounds={false}
          wheel={{ step: 0.15 }}
          doubleClick={{ mode: 'zoomIn' }}
          // Without this, the library can treat the tiniest cursor movement during a click on a
          // node card as the start of a pan and suppress the click — intermittent and hard to
          // reproduce with a scripted mouse, but very noticeable with a real mouse/trackpad.
          panning={{ excluded: ['oc-node-card'] }}
          pinch={{ excluded: ['oc-node-card'] }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: contentWidth, height: contentHeight }}
              >
                {children}
              </TransformComponent>
              <div
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  zIndex: 10,
                }}
              >
                <ZoomButton label="+" title="Zoom in" onClick={() => zoomIn()} />
                <ZoomButton label="–" title="Zoom out" onClick={() => zoomOut()} />
                <ZoomButton label="⤢" title="Fit to screen" onClick={() => resetTransform()} />
              </div>
            </>
          )}
        </TransformWrapper>
      )}
    </div>
  );
}
