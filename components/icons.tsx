import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

/** Base: 24×24 stroke icon, Lucide-style */
function I({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <I {...p}>
    <path d="M3 10.2 12 3l9 7.2" />
    <path d="M5 9.7V20a1 1 0 0 0 1 1h4v-6.5h4V21h4a1 1 0 0 0 1-1V9.7" />
  </I>
);

export const IconPlus = (p: P) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const IconPlusCircle = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </I>
);

export const IconBox = (p: P) => (
  <I {...p}>
    <path d="M21 8.1 12 3 3 8.1v7.8L12 21l9-5.1z" />
    <path d="M3.3 8.4 12 13.2l8.7-4.8" />
    <path d="M12 13.2V21" />
  </I>
);

export const IconSend = (p: P) => (
  <I {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </I>
);

export const IconRadar = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </I>
);

export const IconUsers = (p: P) => (
  <I {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </I>
);

export const IconTruck = (p: P) => (
  <I {...p}>
    <path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
    <path d="M14 8h3.6a1 1 0 0 1 .8.4l2.5 3.4a1 1 0 0 1 .2.6V17a1 1 0 0 1-1 1h-1" />
    <path d="M14 17h-5" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </I>
);

export const IconTag = (p: P) => (
  <I {...p}>
    <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
    <circle cx="7.5" cy="7.5" r="0.6" fill="currentColor" />
  </I>
);

export const IconClock = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </I>
);

export const IconSearch = (p: P) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </I>
);

export const IconMenu = (p: P) => (
  <I {...p}>
    <path d="M4 12h16M4 6h16M4 18h16" />
  </I>
);

export const IconX = (p: P) => (
  <I {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </I>
);

export const IconGrid = (p: P) => (
  <I {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </I>
);

export const IconLogout = (p: P) => (
  <I {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </I>
);

export const IconAlert = (p: P) => (
  <I {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </I>
);

export const IconTrend = (p: P) => (
  <I {...p}>
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </I>
);

export const IconWallet = (p: P) => (
  <I {...p}>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </I>
);

export const IconRupee = (p: P) => (
  <I {...p}>
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="m6 13 8.5 8" />
    <path d="M6 13h3" />
    <path d="M9 13c6.7 0 6.7-10 0-10" />
  </I>
);

export const IconCheck = (p: P) => (
  <I {...p}>
    <path d="M20 6 9 17l-5-5" />
  </I>
);

export const IconCheckCircle = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.5 2.5 4.8-5" />
  </I>
);

export const IconArrowRight = (p: P) => (
  <I {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </I>
);

export const IconChevronRight = (p: P) => (
  <I {...p}>
    <path d="m9 18 6-6-6-6" />
  </I>
);

export const IconChevronDown = (p: P) => (
  <I {...p}>
    <path d="m6 9 6 6 6-6" />
  </I>
);

export const IconPrinter = (p: P) => (
  <I {...p}>
    <path d="M6 9V3h12v6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </I>
);

export const IconMapPin = (p: P) => (
  <I {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </I>
);

export const IconSparkles = (p: P) => (
  <I {...p}>
    <path d="m12 3 1.9 5.7a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
  </I>
);

export const IconCalendar = (p: P) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2.5" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </I>
);

export const IconUser = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </I>
);

export const IconLock = (p: P) => (
  <I {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </I>
);

export const IconPhone = (p: P) => (
  <I {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
  </I>
);

export const IconFile = (p: P) => (
  <I {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </I>
);

export const IconLogo = (p: P) => (
  <I strokeWidth={2} {...p}>
    <path d="M2 7.5A1.5 1.5 0 0 1 3.5 6H13a1 1 0 0 1 1 1v9.5H2z" />
    <path d="M14 10h3.6a1 1 0 0 1 .78.37l2.42 3a1 1 0 0 1 .22.63V16.5h-2.02" />
    <path d="M14 16.5H8.02" />
    <circle cx="5.5" cy="18" r="1.8" />
    <circle cx="17.2" cy="18" r="1.8" />
  </I>
);

/** Icon registry — nav items reference icons by string key (server → client safe) */
export const ICONS: Record<string, (p: P) => React.ReactElement> = {
  home: IconHome,
  plusCircle: IconPlusCircle,
  box: IconBox,
  send: IconSend,
  radar: IconRadar,
  users: IconUsers,
  truck: IconTruck,
  tag: IconTag,
  clock: IconClock,
};
