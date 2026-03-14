function BrandHeader({ eyebrow, title, compact = false }) {
  return (
    <div className={compact ? 'panel-header compact' : 'panel-header'}>
      <div className="brand-mark">MedSim</div>
      <div className="panel-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
    </div>
  );
}

export default BrandHeader;
