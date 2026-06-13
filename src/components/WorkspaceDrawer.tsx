import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface WorkspaceDrawerItem {
  id: string;
  label: string;
  description: string;
  active?: boolean;
}

export interface WorkspaceDrawerSection {
  title: string;
  items: WorkspaceDrawerItem[];
}

interface WorkspaceDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  sections: WorkspaceDrawerSection[];
  footer?: ReactNode;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function WorkspaceDrawer({
  open,
  title,
  subtitle,
  sections,
  footer,
  onSelect,
  onClose,
}: WorkspaceDrawerProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className={open ? 'workspace-drawer-backdrop visible' : 'workspace-drawer-backdrop'}
        aria-label="Закрыть меню"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <aside
        className={open ? 'workspace-drawer open' : 'workspace-drawer'}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="workspace-drawer-header">
          <div className="workspace-drawer-title-block">
            <p className="section-kicker">Навигация</p>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <button
            type="button"
            className="workspace-drawer-close"
            aria-label="Закрыть меню"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="workspace-drawer-sections">
          {sections.map((section) => (
            section.items.length ? (
              <section key={section.title} className="workspace-drawer-section">
                <p className="section-kicker">{section.title}</p>
                <div className="workspace-drawer-nav">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={item.active ? 'workspace-drawer-button active' : 'workspace-drawer-button'}
                      onClick={() => {
                        onSelect(item.id);
                        onClose();
                      }}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null
          ))}
        </div>

        {footer ? (
          <div className="workspace-drawer-footer">
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  );
}

export default WorkspaceDrawer;
