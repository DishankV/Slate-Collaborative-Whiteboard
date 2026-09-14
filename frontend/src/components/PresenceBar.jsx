function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';
}

export default function PresenceBar({ users }) {
  const visible = users.slice(0, 6);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <div
            key={u.socketId}
            title={u.userName}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-graphite-900 text-xs font-semibold text-graphite-950"
            style={{ backgroundColor: u.color }}
          >
            {initials(u.userName)}
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-graphite-900 bg-graphite-700 text-xs font-semibold text-paper">
            +{overflow}
          </div>
        )}
      </div>
      <span className="ml-3 text-sm text-graphite-600">
        {users.length} {users.length === 1 ? 'person' : 'people'} here
      </span>
    </div>
  );
}
