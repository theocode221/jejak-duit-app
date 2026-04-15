import type { ReactNode } from 'react';

type PageSectionProps = {
  title?: string;
  description?: string;
  aside?: ReactNode;
  children?: ReactNode;
};

export function PageSection({
  title,
  description,
  aside,
  children,
}: PageSectionProps) {
  const hasHead = Boolean(title || description || aside);
  return (
    <section className="bajet-section">
      {hasHead && (
        <div className="bajet-section__head">
          <div>
            {title && <h2 className="bajet-section__title">{title}</h2>}
            {description && <p className="bajet-section__desc">{description}</p>}
          </div>
          {aside && <div className="bajet-section__aside">{aside}</div>}
        </div>
      )}
      {children}
      <style>{`
        .bajet-section__aside {
          flex-shrink: 0;
        }
      `}</style>
    </section>
  );
}
