import { ReactNode } from 'react';

export function SystemWindow({
  title,
  children,
  style,
}: {
  title: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="system-window" style={style}>
      <div className="system-window-title">{title}</div>
      {children}
    </div>
  );
}
