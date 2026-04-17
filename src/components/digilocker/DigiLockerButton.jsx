/**
 * DigiLockerButton — compact header button for the GuestLayout nav bar.
 * Clicking opens https://www.digilocker.gov.in/ in a new browser tab.
 * Positioned before Profile and Sign Out in the guest header.
 */
export default function DigiLockerButton() {
  function handleClick() {
    window.open('https://www.digilocker.gov.in/', '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      title="Open DigiLocker — Government of India"
      aria-label="Open DigiLocker website"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
        bg-gradient-to-r from-orange-500 to-orange-600 text-white
        hover:from-orange-600 hover:to-orange-700 active:scale-95
        transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500"
    >
      {/* Shield icon */}
      <svg
        className="w-4 h-4 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955
             11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824
             10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
             0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>

      {/* Label — hidden on mobile, visible on sm+ */}
      <span className="hidden sm:inline">DigiLocker</span>

      {/* gov.in badge — desktop only */}
      <span className="hidden md:inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold bg-white/20 leading-none">
        gov.in
      </span>
    </button>
  )
}
