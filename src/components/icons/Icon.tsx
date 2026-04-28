type IconName =
  | 'arrow-right'
  | 'arrow-up-right'
  | 'eye'
  | 'clock'
  | 'check'
  | 'external';

type IconProps = {
  name: IconName;
  className?: string;
  size?: number | string;
  title?: string;
};

export default function Icon({
  name,
  className,
  size,
  title,
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <use href={`#i-${name}`} />
    </svg>
  );
}
