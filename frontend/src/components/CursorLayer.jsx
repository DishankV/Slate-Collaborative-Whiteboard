export default function CursorLayer({ cursors }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Object.values(cursors).map((c) => (
        <div
          key={c.socketId}
          className="absolute -translate-x-0.5 -translate-y-0.5 transition-[left,top] duration-75 ease-linear"
          style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M2 1.5 L15.5 8 L9 9.5 L7 16 Z"
              fill={c.color}
              stroke="#15161A"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="ml-4 -mt-1 inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-graphite-950 shadow"
            style={{ backgroundColor: c.color }}
          >
            {c.userName}
          </span>
        </div>
      ))}
    </div>
  );
}
