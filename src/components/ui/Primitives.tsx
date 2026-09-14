import {
  forwardRef,
  type ElementType,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import type { CharacterStatus } from '@/types';
import { Icon, type IconName } from './Icon';

/* Card ---------------------------------------------------------------------- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  flush?: boolean;
  sunken?: boolean;
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({ as: Tag = 'div', flush, sunken, interactive, className, children, ...rest }: CardProps) {
  return (
    <Tag
      className={[
        'card',
        flush ? 'card--flush' : '',
        sunken ? 'card--sunken' : '',
        interactive ? 'card--interactive' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...(rest as HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Tag>
  );
}

/* Pills --------------------------------------------------------------------- */

type PillTone = 'neutral' | 'locked' | 'progress' | 'ready' | 'complete' | 'gold';

export function Pill({
  tone = 'neutral',
  dot,
  plain,
  children,
  className,
}: {
  tone?: PillTone;
  dot?: boolean;
  plain?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        'pill',
        tone !== 'neutral' ? `pill--${tone}` : '',
        plain ? 'pill--plain' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot ? <span className="pill__dot" /> : null}
      {children}
    </span>
  );
}

const STATUS_COPY: Record<CharacterStatus, { label: string; tone: PillTone }> = {
  locked: { label: 'Locked', tone: 'locked' },
  'in-progress': { label: 'In progress', tone: 'progress' },
  ready: { label: 'Ready', tone: 'ready' },
  completed: { label: 'Completed', tone: 'complete' },
};

export function StatusPill({ status }: { status: CharacterStatus }) {
  const { label, tone } = STATUS_COPY[status];
  return (
    <Pill tone={tone} dot={status !== 'locked'}>
      {label}
    </Pill>
  );
}

/* Segmented control --------------------------------------------------------- */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__btn"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* Fields -------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={['input', className ?? ''].join(' ').trim()} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={['textarea', className ?? ''].join(' ').trim()} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={['select', className ?? ''].join(' ').trim()} {...rest}>
        {children}
      </select>
    );
  },
);

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  id?: string;
}) {
  return (
    <label className="switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
      <span>{label}</span>
    </label>
  );
}

/* Avatar — the implementation lives with the other image components. --------- */

export { Avatar } from '@/components/media/Avatar';

/* States -------------------------------------------------------------------- */

export function Skeleton({
  width,
  height = 14,
  radius,
  className,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
}) {
  return (
    <span
      className={['skeleton', className ?? ''].join(' ').trim()}
      style={{ display: 'block', width: width ?? '100%', height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  icon = 'boot',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <span className="state__art">
        <Icon name={icon} size={30} />
      </span>
      <h3 className="state__title">{title}</h3>
      <p className="state__body">{body}</p>
      {action ? <div className="state__actions">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, detail }: { onRetry?: () => void; detail?: string }) {
  return (
    <div className="state" role="alert">
      <span className="state__art">
        <Icon name="compass" size={30} />
      </span>
      <h3 className="state__title">We lost the trail.</h3>
      <p className="state__body">{detail ?? 'Something went wrong loading your adventure.'}</p>
      {onRetry ? (
        <div className="state__actions">
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
