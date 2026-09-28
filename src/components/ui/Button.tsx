import type React from 'react';
import Link from 'next/link';
import Icon from '@/components/icons/Icon';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg' | 'sm';

const VARIANTS: Record<Variant, string> = {
  // Black pill → orange with a black label on hover.
  primary: 'btn-primary',
  // Outlined pill.
  secondary: 'btn-secondary',
  // Text-only.
  ghost: 'btn-ghost',
};
const SIZES: Record<Size, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  /** Trailing arrow that nudges right on hover. */
  arrow?: boolean;
  className?: string;
};

type ButtonProps = CommonProps &
  (
    | ({ href: string } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'>)
    | ({ href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
  );

/**
 * Voltage pill button. Renders a Next <Link> when `href` is set, otherwise a
 * <button> (default `type="button"`).
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  arrow = false,
  className,
  ...rest
}: ButtonProps) {
  const classes = ['group', VARIANTS[variant], SIZES[size], className].filter(Boolean).join(' ');
  const content = (
    <>
      {children}
      {arrow && (
        <Icon
          name="arrow-right"
          className="ml-2 size-4 transition-transform duration-200 ease-expo-out group-hover:translate-x-1"
        />
      )}
    </>
  );

  if ('href' in rest && rest.href) {
    const { href, ...linkProps } = rest;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    );
  }
  const { type = 'button', ...buttonProps } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
