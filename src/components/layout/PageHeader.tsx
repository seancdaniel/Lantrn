import type { ReactNode } from 'react';
import { useDocumentMeta } from '@/hooks';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Page title and description for the document head, for SEO and share previews. */
  documentTitle?: string;
  documentDescription?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  documentTitle,
  documentDescription,
}: Props) {
  useDocumentMeta(documentTitle ?? `${title} · Milepost`, documentDescription ?? description);

  return (
    <header className="pagehead">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="pagehead__title" style={{ marginTop: eyebrow ? 8 : 0 }}>
          {title}
        </h1>
        {description ? <p className="pagehead__sub">{description}</p> : null}
      </div>
      {actions ? <div className="pagehead__actions">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  action,
  id,
}: {
  title: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section__head">
      <h2 className="section__title" id={id}>
        {title}
      </h2>
      {action}
    </div>
  );
}
