interface MenuToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
}

function MenuToggleButton({ expanded, onClick }: MenuToggleButtonProps) {
  return (
    <button
      type="button"
      className={expanded ? 'menu-toggle-button menu-toggle-button--expanded' : 'menu-toggle-button'}
      aria-label={expanded ? 'Закрыть меню' : 'Открыть меню'}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <span className="menu-toggle-icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}

export default MenuToggleButton;
