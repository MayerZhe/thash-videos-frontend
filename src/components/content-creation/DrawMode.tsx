'use client';

import { useState, useCallback } from 'react';

type DrawTool = 'pen' | 'arrow' | 'rect' | 'text';
type DrawColor = '#3ecf8e' | '#e94560' | '#ffd93d' | '#6366f1' | '#fafafa';

const COLORS: { hex: DrawColor; label: string }[] = [
  { hex: '#3ecf8e', label: '绿色' },
  { hex: '#e94560', label: '红色' },
  { hex: '#ffd93d', label: '黄色' },
  { hex: '#6366f1', label: '蓝色' },
  { hex: '#fafafa', label: '白色' },
];

const TOOLS: { key: DrawTool; label: string; icon: string }[] = [
  { key: 'pen', label: '钢笔', icon: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' },
  { key: 'arrow', label: '箭头', icon: 'M5 12h14 M12 5l7 7-7 7' },
  { key: 'rect', label: '矩形', icon: 'M3 3h18v18H3z' },
  { key: 'text', label: '文字', icon: 'M11 4H4v16h7M13 4h7v16h-7' },
];

interface DrawModeProps {
  active: boolean;
  onClose: () => void;
}

export default function DrawMode({ active, onClose }: DrawModeProps) {
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState<DrawColor>('#3ecf8e');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawings, setDrawings] = useState<Array<{ id: number; tool: DrawTool; color: string; width: number; x: number; y: number }>>([]);

  const handleClear = useCallback(() => {
    setDrawings([]);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDrawings((prev) => [...prev, {
      id: Date.now(),
      tool,
      color,
      width: strokeWidth,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }]);
  }, [tool, color, strokeWidth]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Semi-transparent overlay for drawing */}
      <div
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
      >
        {/* Render existing drawings */}
        {drawings.map((d) => (
          <div
            key={d.id}
            className="absolute pointer-events-none"
            style={{ left: d.x, top: d.y, color: d.color }}
          >
            {d.tool === 'pen' && (
              <svg width={d.width * 4} height={d.width * 4} viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r={d.width} />
              </svg>
            )}
            {d.tool === 'arrow' && (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={d.width} strokeLinecap="round">
                <line x1="4" y1="20" x2="20" y2="4" />
                <polyline points="14 4 20 4 20 10" />
              </svg>
            )}
            {d.tool === 'rect' && (
              <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth={d.width}>
                <rect x="2" y="2" width="36" height="26" rx="4" />
              </svg>
            )}
            {d.tool === 'text' && (
              <span className="text-sm font-medium" style={{ color: d.color, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                T
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="absolute top-[60px] left-1/2 -translate-x-1/2 bg-surface border border-border rounded-sm shadow-raised flex items-center p-1.5 gap-1">
        {/* Tools */}
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={(e) => { e.stopPropagation(); setTool(t.key); }}
            className={`p-1.5 rounded-sm transition-all ${tool === t.key ? 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] text-accent' : 'text-muted hover:text-fg-2'}`}
            title={t.label}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
          </button>
        ))}

        <div className="w-px h-5 bg-border-soft mx-1" />

        {/* Color picker */}
        {COLORS.map((c) => (
          <button
            key={c.hex}
            onClick={(e) => { e.stopPropagation(); setColor(c.hex); }}
            className={`w-4 h-4 rounded-pill transition-all ${color === c.hex ? 'ring-2 ring-fg scale-110' : 'hover:scale-110'}`}
            style={{ backgroundColor: c.hex }}
            title={c.label}
          />
        ))}

        <div className="w-px h-5 bg-border-soft mx-1" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 5].map((w) => (
            <button
              key={w}
              onClick={(e) => { e.stopPropagation(); setStrokeWidth(w); }}
              className={`rounded-pill transition-all ${strokeWidth === w ? 'bg-accent' : 'bg-border-soft'}`}
              style={{ width: 16, height: w * 3 + 2 }}
              title={`${w}px`}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-border-soft mx-1" />

        {/* Clear button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClear(); }}
          className="p-1.5 text-xs text-muted hover:text-danger transition-colors"
          title="清除全部"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>

        {/* Close */}
        <div className="w-px h-5 bg-border-soft mx-1" />
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1.5 text-xs text-muted hover:text-fg-2 transition-colors"
          title="退出绘制 (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface/90 border border-border rounded-sm px-4 py-2 text-xs text-muted">
        点击画布放置元素 · <kbd className="text-[10px] bg-bg border border-border px-1 rounded-sm">Esc</kbd> 退出绘制模式
      </div>
    </div>
  );
}
