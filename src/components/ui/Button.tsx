import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

type Variant = 'default' | 'primary' | 'accent' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const classes = (variant: Variant, size: Size, block?: boolean, iconOnly?: boolean, extra?: string) =>
  [
    'btn',
    variant !== 'default' ? `btn--${variant}` : '',
    size !== 'md' ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    iconOnly ? 'btn--icon' : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', block, icon, iconAfter, className, children, ...rest },
  ref,
) {
  const iconOnly = !children && (!!icon || !!iconAfter);
  return (
    <button
      ref={ref}
      type="button"
      className={classes(variant, size, block, iconOnly, className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
}

export function ButtonLink({
  variant = 'default',
  size = 'md',
  block,
  icon,
  iconAfter,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, block, false, className)} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === 'sm' ? 14 : 16} /> : null}
    </Link>
  );
}
