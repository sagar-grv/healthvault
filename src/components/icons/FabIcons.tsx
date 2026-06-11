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
      {/* Document body */}
      <rect
        x="6"
        y="4"
        width="14"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      {/* Document lines (content) */}
      <line x1="9" y1="9" x2="17" y2="9" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="15" x2="14" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* Scan viewfinder corners (top-left) */}
      <path
        d="M18 6 L24 6 L24 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Scan viewfinder corners (bottom-right) */}
      <path
        d="M18 26 L24 26 L24 20"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Camera lens dot in center of viewfinder */}
      <circle cx="21" cy="16" r="2.5" stroke={color} strokeWidth="1.6" fill="none" />
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
      {/* Cloud shape */}
      <path
        d="M8 22C5.239 22 3 19.761 3 17C3 14.478 4.84 12.388 7.252 12.054C7.08 11.585 6.988 11.078 6.988 10.55C6.988 7.879 9.195 5.714 11.916 5.714C12.81 5.714 13.646 5.966 14.355 6.404C15.39 4.688 17.314 3.536 19.5 3.536C22.813 3.536 25.5 6.188 25.5 9.464C25.5 9.604 25.494 9.742 25.482 9.878C27.442 10.492 28.85 12.315 28.85 14.464C28.85 17.146 26.655 19.321 23.95 19.321"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Up arrow stem */}
      <line x1="16" y1="28" x2="16" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Up arrow head */}
      <path
        d="M11 20 L16 15 L21 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** QR code with scan frame — "Scan Doctor QR" */
export function QRIcon({ size = 32, color = 'currentColor' }: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Square with scan corners */}
      <path
        d="M3 9 L3 5 L3 3 L7 3 L9 3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M23 3 L27 3 L29 3 L29 7 L29 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M29 23 L29 27 L29 29 L25 29 L23 29"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 29 L5 29 L3 29 L3 25 L3 23"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner QR code pattern */}
      <rect x="8" y="8" width="3" height="3" rx="0.5" fill={color} />
      <rect x="14" y="8" width="3" height="3" rx="0.5" fill={color} />
      <rect x="20" y="8" width="3" height="3" rx="0.5" fill={color} />
      <rect x="8" y="14" width="3" height="3" rx="0.5" fill={color} />
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill={color} />
      <rect x="20" y="14" width="3" height="8" rx="0.5" fill={color} />
      <rect x="8" y="20" width="3" height="3" rx="0.5" fill={color} />
      <rect x="14" y="20" width="3" height="3" rx="0.5" fill={color} />
      {/* Scan line */}
      <line x1="3" y1="16" x2="29" y2="16" stroke={color} strokeWidth="1.2" strokeDasharray="2 2" />
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
