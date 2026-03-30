import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Minus } from 'lucide-react';

interface DraggablePanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  defaultPos?: { x: number; y: number };
  defaultSize?: { w: number; h: number };
  minWidth?: number;
  minHeight?: number;
}

export default function DraggablePanel({
  title,
  icon,
  children,
  onClose,
  defaultPos = { x: 60, y: 40 },
  defaultSize = { w: 260, h: 300 },
  minWidth = 200,
  minHeight = 120,
}: DraggablePanelProps) {
  const [pos, setPos] = useState(defaultPos);
  const [size, setSize] = useState(defaultSize);
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Drag handlers
  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const nx = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.current.x));
    const ny = Math.max(0, Math.min(window.innerHeight - 30, e.clientY - dragOffset.current.y));
    setPos({ x: nx, y: ny });
  }, []);

  const onDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Resize handlers
  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [size]);

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current) return;
    e.preventDefault();
    const dw = e.clientX - resizeStart.current.x;
    const dh = e.clientY - resizeStart.current.y;
    setSize({
      w: Math.max(minWidth, resizeStart.current.w + dw),
      h: Math.max(minHeight, resizeStart.current.h + dh),
    });
  }, [minWidth, minHeight]);

  const onResizeEnd = useCallback(() => {
    isResizing.current = false;
  }, []);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: minimized ? 'auto' : size.h,
      }}
    >
      {/* Title bar — draggable */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-white/5 cursor-grab active:cursor-grabbing select-none shrink-0"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <span className="text-white/40">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 flex-1">{title}</span>
        <button
          onClick={() => setMinimized(!minimized)}
          className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Minus size={10} />
        </button>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X size={10} />
        </button>
      </div>

      {/* Content */}
      {!minimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {children}
        </div>
      )}

      {/* Resize handle */}
      {!minimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        >
          <svg className="w-3 h-3 text-white/20 absolute bottom-0.5 right-0.5" viewBox="0 0 10 10">
            <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
