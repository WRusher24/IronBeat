export function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#1C1C1E" />
      <g fill="#D4A373">
        <rect x="104" y="196" width="40" height="120" rx="14" />
        <rect x="150" y="164" width="40" height="184" rx="14" />
        <rect x="322" y="164" width="40" height="184" rx="14" />
        <rect x="368" y="196" width="40" height="120" rx="14" />
      </g>
      <rect x="190" y="244" width="132" height="24" rx="12" fill="#F5F2EC" />
    </svg>
  );
}
