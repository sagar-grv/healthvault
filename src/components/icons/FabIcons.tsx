/**
 * Custom SVG icons for the FAB bottom sheet actions.
 * Purpose-built to be immediately understandable by any user.
 */

interface SvgIconProps {
  size?: number;
  color?: string;
}

/** Document with scan/viewfinder corners — "Scan a report" */
export function ScanReportIcon({ size = 32, color = 'currentColor' }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="3" width="20" height="22" rx="3" stroke={color} strokeWidth="2" fill="none" />
      <line x1="7" y1="9" x2="19" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="13" x2="19" y2="13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="17" x2="14" y2="17" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M25 8 L25 2 L19 2"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M25 28 L25 22 L19 22"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="25" cy="15" r="2.5" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Cloud with up arrow — universally understood as "upload" */
export function UploadCloudIcon({ size = 32, color = 'currentColor' }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 22C4.24 22 2 19.76 2 17C2 14.48 3.84 12.39 6.25 12.06C6.08 11.59 6 11.08 6 10.55C6 7.88 8.21 5.71 10.93 5.71C11.82 5.71 12.66 5.96 13.37 6.4C14.4 4.69 16.33 3.54 18.52 3.54C21.83 3.54 24.52 6.19 24.52 9.46C24.52 9.6 24.51 9.74 24.5 9.88C26.46 10.49 27.87 12.32 27.87 14.46C27.87 17.15 25.67 19.32 22.97 19.32"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="16"
        y1="28"
        x2="16"
        y2="16"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 20 L16 15 L21 20"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Heart with ECG/pulse line — "Emergency medical card" */
export function EmergencyHeartIcon({ size = 32, color = 'currentColor' }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Heart outline */}
      <path
        d="M16 27C16 27 4 19.5 4 11.5C4 8.462 6.462 6 9.5 6C11.42 6 13.1 7.02 14.1 8.55C14.58 9.3 15.24 9.3 16 9.3C16.76 9.3 17.42 9.3 17.9 8.55C18.9 7.02 20.58 6 22.5 6C25.538 6 28 8.462 28 11.5C28 19.5 16 27 16 27Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* ECG / pulse line inside heart */}
      <path
        d="M7 16 L10 16 L12 13 L14 19 L16 14 L18 16 L21 16 L25 16"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
