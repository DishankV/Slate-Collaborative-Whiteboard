const COLORS = ['#1C1D21', '#DE5C5C', '#3E7CB1', '#4E9F63', '#D4A72C', '#8C7AE6'];
const WIDTHS = [
  { label: 'S', value: 3 },
  { label: 'M', value: 6 },
  { label: 'L', value: 12 },
];

export default function Toolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  width,
  onWidthChange,
  onUndo,
  onClear,
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-graphite-900 p-3 shadow-panel">
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          aria-pressed={tool === 'pen'}
          onClick={() => onToolChange('pen')}
          title="Pen"
          className={`h-10 w-10 rounded-xl text-lg transition ${
            tool === 'pen' ? 'bg-clay text-white' : 'bg-graphite-800 text-graphite-600 hover:text-paper'
          }`}
        >
          ✎
        </button>
        <button
          type="button"
          aria-pressed={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
          title="Eraser"
          className={`h-10 w-10 rounded-xl text-lg transition ${
            tool === 'eraser' ? 'bg-clay text-white' : 'bg-graphite-800 text-graphite-600 hover:text-paper'
          }`}
        >
          ⌫
        </button>
      </div>

      <div className="h-px w-8 bg-graphite-700" />

      <div className="flex flex-col gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            aria-pressed={color === c && tool === 'pen'}
            onClick={() => {
              onColorChange(c);
              if (tool !== 'pen') onToolChange('pen');
            }}
            className={`h-7 w-7 rounded-full border-2 transition ${
              color === c && tool === 'pen' ? 'border-paper scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="h-px w-8 bg-graphite-700" />

      <div className="flex flex-col gap-1.5">
        {WIDTHS.map((w) => (
          <button
            key={w.value}
            type="button"
            aria-pressed={width === w.value}
            onClick={() => onWidthChange(w.value)}
            title={`Stroke width ${w.label}`}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
              width === w.value ? 'bg-graphite-700 text-paper' : 'bg-graphite-800 text-graphite-600 hover:text-paper'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="h-px w-8 bg-graphite-700" />

      <button
        type="button"
        onClick={onUndo}
        title="Undo your last stroke"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-graphite-800 text-graphite-600 transition hover:text-paper"
      >
        ↺
      </button>
      <button
        type="button"
        onClick={onClear}
        title="Clear the whole board"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-graphite-800 text-graphite-600 transition hover:text-[#DE5C5C]"
      >
        ✕
      </button>
    </div>
  );
}
