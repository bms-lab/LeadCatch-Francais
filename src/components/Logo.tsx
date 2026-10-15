import React from 'react';

interface LeadCatchIconProps {
  size?: number;
  className?: string;
  showContainer?: boolean;
}

export const LeadCatchIcon: React.FC<LeadCatchIconProps> = ({
  size = 32,
  className = '',
  showContainer = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {showContainer && (
        <>
          <rect width="40" height="40" rx="10" fill="#111827" />
          <rect
            x="0.5"
            y="0.5"
            width="39"
            height="39"
            rx="9.5"
            stroke="#1F2937"
            strokeWidth="1"
          />
        </>
      )}

      {/* Catch Loop Cradle (White Open Loop) */}
      <path
        d="M 11 18.5 C 11 26 16 30 22.5 30 C 26.5 30 29 28 29 24.5"
        stroke={showContainer ? '#FFFFFF' : '#111827'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ascending Growth Arrow (Lime Green #B7F34A) */}
      <path
        d="M 29 24.5 V 11.5"
        stroke="#B7F34A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 24.5 15.5 L 29 11 L 33.5 15.5"
        stroke="#B7F34A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Captured Lead Focus Node */}
      <circle cx="17.5" cy="19.5" r="3.25" fill="#B7F34A" />
    </svg>
  );
};

interface LeadCatchLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inverted?: boolean;
}

export const LeadCatchLogo: React.FC<LeadCatchLogoProps> = ({
  size = 'md',
  className = '',
  inverted = false,
}) => {
  const iconSizes = {
    sm: 28,
    md: 34,
    lg: 42,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const currentIconSize = iconSizes[size];
  const currentTextSize = textSizes[size];

  return (
    <div translate="no" className={`flex items-center gap-2.5 select-none notranslate ${className}`}>
      <LeadCatchIcon size={currentIconSize} />
      <span
        className={`font-bold tracking-tight whitespace-nowrap leading-none ${currentTextSize} ${
          inverted ? 'text-white' : 'text-slate-900'
        }`}
      >
        Lead<span className="font-extrabold">Catch</span>
      </span>
    </div>
  );
};
