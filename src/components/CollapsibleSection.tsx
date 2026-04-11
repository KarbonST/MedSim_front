import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  kicker: string;
  title: string;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({
  kicker,
  title,
  children,
  className = '',
  badge,
  actions,
  defaultExpanded = true,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggleExpanded = () => setExpanded((current) => !current);

  return (
    <section className={`participants-panel collapsible-section ${className}`.trim()}>
      <div className="collapsible-section-header">
        <button
          type="button"
          className="collapsible-section-trigger"
          onClick={toggleExpanded}
          aria-expanded={expanded}
        >
          <div>
            <p className="section-kicker">{kicker}</p>
            <h3>{title}</h3>
          </div>
        </button>

        {(badge || actions) ? (
          <div className="collapsible-section-side">
            {badge}
            {actions}
          </div>
        ) : null}

        <button
          type="button"
          className="collapsible-section-toggle"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? `Свернуть ${title}` : `Развернуть ${title}`}
        >
          <span
            className={`collapsible-section-chevron${expanded ? ' collapsible-section-chevron--expanded' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? <div className="collapsible-section-body">{children}</div> : null}
    </section>
  );
}

export default CollapsibleSection;
