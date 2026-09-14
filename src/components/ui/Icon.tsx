import type { SVGProps } from 'react';

/**
 * One icon vocabulary for the whole product: 24px grid, 1.6 stroke, round caps.
 * Consistency here is most of what separates a designed interface from an assembled one.
 */
const paths: Record<string, JSX.Element> = {
  home: <path d="M4 10.6 12 4l8 6.6V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  activity: <path d="M3 13.5h3.6L9 7l3.4 10L15 11.5l1.6 2H21" />,
  characters: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5 20c.6-3.8 3.4-6 7-6s6.4 2.2 7 6" />
    </>
  ),
  map: (
    <>
      <path d="M3 6.6 9 4.4l6 2.2 6-2.2v13l-6 2.2-6-2.2-6 2.2z" />
      <path d="M9 4.4v13M15 6.6v13" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  flag: <path d="M6 21V4h9l-1.6 3.4L15 11H6" />,
  boot: <path d="M8 3v8.4c0 1-.4 1.8-1.2 2.6L5 15.6A3 3 0 0 0 4 18v3h16v-2.6a3 3 0 0 0-2.2-2.9l-4.2-1.2A3 3 0 0 1 11.4 11V3z" />,
  flame: <path d="M12 3.5s5 3.7 5 8.4a5 5 0 0 1-10 0c0-1.7.8-3 1.6-4 .2 1.3.9 2 1.8 2 1.2 0 1.8-1 1.8-2.6 0-1.4-.4-2.6-.2-3.8z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.4V12l3 1.8" />
    </>
  ),
  ruler: (
    <>
      <path d="m3.6 14.4 10.8-10.8 6 6L9.6 20.4z" />
      <path d="m7.2 10.8 2 2M10.2 7.8l2 2M13.2 4.8l2 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0z" />
      <path d="M8 5.5H5.4v1.2A3.4 3.4 0 0 0 8.6 10M16 5.5h2.6v1.2A3.4 3.4 0 0 1 15.4 10" />
      <path d="M12 12.5V16M9 20h6M10 16h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.6 19.4A6.2 6.2 0 0 1 9.5 15a6.2 6.2 0 0 1 5.9 4.4" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 6M17.6 15.4a6.2 6.2 0 0 1 2.8 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.9" />
      <path d="M19.4 14.2a1.4 1.4 0 0 0 .3 1.5l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-2.4 1v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.4 1.4 0 0 0-2.4-1l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0-1-2.4h-.3a1.7 1.7 0 0 1 0-3.4h.2a1.4 1.4 0 0 0 1-2.4l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 2.4-1v-.3a1.7 1.7 0 1 1 3.4 0v.2a1.4 1.4 0 0 0 2.4 1l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0 1 2.4h.3a1.7 1.7 0 0 1 0 3.4h-.2a1.4 1.4 0 0 0-1.3.9z" />
    </>
  ),
  shield: <path d="M12 3.4 19 6v6c0 4-3 7-7 8.6C8 19 5 16 5 12V6z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 13.6A8 8 0 0 1 10.4 4 8.2 8.2 0 1 0 20 13.6z" />,
  check: <path d="m5 12.6 4.4 4.4L19 7" />,
  close: <path d="M6 6 18 18M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  lock: (
    <>
      <rect x="4.8" y="10.4" width="14.4" height="9.6" rx="2.2" />
      <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" />
    </>
  ),
  star: <path d="m12 3.8 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 10l5.9-.8z" />,
  chevronRight: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevronUp: <path d="m5.5 14.5 6.5-6.5 6.5 6.5" />,
  chevronDown: <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />,
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  arrowLeft: <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />,
  arrowUp: <path d="M12 19.5v-15M6 10.5l6-6 6 6" />,
  alert: (
    <>
      <path d="M12 4.4 21 19.6H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  camera: (
    <>
      <path d="M3.6 8.6h3.2l1.4-2.2h7.6l1.4 2.2h3.2v10.2H3.6z" />
      <circle cx="12" cy="13.4" r="3.4" />
    </>
  ),
  pencil: <path d="M4.5 19.5h3.2L19 8.2a2.2 2.2 0 0 0-3.2-3.2L4.5 16.3z" />,
  trash: (
    <>
      <path d="M4.8 6.6h14.4M9.4 6.6V4.4h5.2v2.2" />
      <path d="M6.6 6.6 7.6 20h8.8l1-13.4M10.4 10.4v6M13.6 10.4v6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="3.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.6" width="16" height="14.4" rx="2.2" />
      <path d="M4 10h16M8.4 3.6v3.6M15.6 3.6v3.6" />
    </>
  ),
  sparkle: <path d="M12 3.6 13.8 9l5.4 1.8-5.4 1.8L12 18l-1.8-5.4L4.8 10.8 10.2 9z" />,
  link: (
    <>
      <path d="M10.4 13.6a3.6 3.6 0 0 0 5.2 0l2.6-2.6a3.7 3.7 0 0 0-5.2-5.2l-1.2 1.2" />
      <path d="M13.6 10.4a3.6 3.6 0 0 0-5.2 0l-2.6 2.6a3.7 3.7 0 0 0 5.2 5.2l1.2-1.2" />
    </>
  ),
  logout: (
    <>
      <path d="M14 5.6H6.4v12.8H14" />
      <path d="M11.6 12h8M16.4 8.4l3.6 3.6-3.6 3.6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6.4 6 12 6s9.2 6 9.2 6-3.6 6-9.2 6-9.2-6-9.2-6z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10.4v3.2a1.6 1.6 0 0 0 1.6 1.6h1.6L18 20V4L7.2 9.2H5.6A1.6 1.6 0 0 0 4 10.8z" />
      <path d="M7.6 15.2 9 20.4" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }: IconProps) {
  const filled = name === 'star' || name === 'flame' || name === 'sparkle';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
