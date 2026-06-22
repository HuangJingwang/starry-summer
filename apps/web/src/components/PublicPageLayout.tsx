import type { ReactNode } from 'react';

interface PublicPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

interface PublicContentSectionProps {
  id?: string;
  ariaLabel?: string;
  eyebrow?: string;
  title?: string;
  meta?: ReactNode;
  headingRow?: boolean;
  className?: string;
  children: ReactNode;
}

export function PublicPageHeader({ actions, className = '', description, eyebrow, title }: PublicPageHeaderProps) {
  return (
    <div className={['page-title-row', className].filter(Boolean).join(' ')}>
      <div className="page-title">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="posts-page-actions">{actions}</div> : null}
    </div>
  );
}

export function PublicContentSection({
  ariaLabel,
  children,
  className = '',
  eyebrow,
  headingRow = false,
  id,
  meta,
  title,
}: PublicContentSectionProps) {
  const heading = title ? (
    <div className={['section-heading', headingRow ? 'section-heading--row' : ''].filter(Boolean).join(' ')}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {meta ? <span>{meta}</span> : null}
    </div>
  ) : null;

  return (
    <section className={['content-section', className].filter(Boolean).join(' ')} id={id} aria-label={ariaLabel}>
      {heading}
      {children}
    </section>
  );
}
