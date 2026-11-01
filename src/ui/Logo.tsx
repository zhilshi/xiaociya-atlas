/** 小词芽 sprout mark: two leaves on a stem. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#EAF8EF" />
      <path d="M32 52V30" stroke="#3BA55C" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 32C32 22 24 15 13 16C13 27 20 33 32 32Z" fill="#5CC98A" />
      <path d="M32 28C32 18 40 11 51 12C51 23 44 29 32 28Z" fill="#8EDB6A" />
      <ellipse cx="32" cy="53" rx="13" ry="4" fill="#C9A27A" opacity=".55" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <Mark />
      <span className="logo-text">
        <b>小词芽</b>
        <small>WordSprout</small>
      </span>
    </span>
  );
}
