import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useDocumentMeta } from '@/hooks';

export function NotFound() {
  useDocumentMeta('We lost the trail · Milepost');

  return (
    <div className="page">
      <div className="state" style={{ marginTop: 'var(--s-9)' }}>
        <span className="state__art">
          <Icon name="compass" size={34} />
        </span>
        <h1 className="state__title">We lost the trail.</h1>
        <p className="state__body">
          There is nothing at this address. Even the best-mapped routes have a wrong turn or two.
        </p>
        <div className="state__actions">
          <ButtonLink to="/" variant="primary" icon="home">
            Back to the dashboard
          </ButtonLink>
          <ButtonLink to="/map">Open the map</ButtonLink>
        </div>
      </div>
    </div>
  );
}
