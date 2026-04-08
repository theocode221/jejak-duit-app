import type { ReactNode } from 'react';

type PageSectionProps = {
  kicker?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children?: ReactNode;
};

export function PageSection({
  kicker,
  title,
  description,
  aside,
  children,
}: PageSectionProps) {
  return (
    <section className="bajet-section">
      <div className="bajet-section__head">
        <div>
          {kicker && <p className="bajet-section__kicker">{kicker}</p>}
          <h2 className="bajet-section__title">{title}</h2>
          {description && <p className="bajet-section__desc">{description}</p>}
        </div>
        {aside && <div className="bajet-section__aside">{aside}</div>}
      </div>
      {children}
      <style>{`
        .bajet-section__aside {
          flex-shrink: 0;
        }
      `}</style>
    </section>
  );
}
