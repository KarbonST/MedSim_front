import type { ReactNode } from 'react';

interface BrandHeaderProps {
  eyebrow: string;
  title: string;
  compact?: boolean;
  actions?: ReactNode;
}

function BrandHeader({ eyebrow, title, compact = false, actions }: BrandHeaderProps) {
  return (
    <div className={compact ? 'panel-header compact' : 'panel-header'}>
      <div className="panel-header-top">
        <div className="brand-mark">MedSim</div>
        {actions ? <div className="panel-header-actions">{actions}</div> : null}
      </div>
      <div className="panel-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
    </div>
  );
}

export default BrandHeader;
