
export function SystemWindow({
  title,
  children,
  style
}) {
  return <div className="system-window" style={style}>
      <div className="system-window-title">{title}</div>
      {children}
    </div>;
}