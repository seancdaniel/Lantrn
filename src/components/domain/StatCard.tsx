import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Primitives';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: IconName;
  foot?: ReactNode;
  size?: 'md' | 'sm';
  loading?: boolean;
}

export function StatCard({ label, value, unit, icon, foot, size = 'md', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="stat">
        <div className="stat__head">
          <Skeleton width={72} height={10} />
        </div>
        <Skeleton width="60%" height={32} />
        <Skeleton width="45%" height={11} />
      </div>
    );
  }

  return (
    <div className="stat">
      <div className="stat__head">
        <span className="card__label">{label}</span>
        {icon ? (
          <span className="stat__icon">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <p className="stat__figure">
        <span className={`stat__value${size === 'sm' ? ' stat__value--sm' : ''}`}>{value}</span>
        {unit ? <span className="stat__unit">{unit}</span> : null}
      </p>
      {foot ? <p className="stat__foot">{foot}</p> : null}
    </div>
  );
}
