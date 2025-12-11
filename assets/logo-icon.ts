// Primary logo icon - modern, clean design with shopping cart and AI elements
export const logoIconSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
    <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FCD34D"/>
      <stop offset="100%" style="stop-color:#F59E0B"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <!-- Background circle with gradient -->
  <circle cx="50" cy="50" r="48" fill="url(#bgGradient)"/>
  
  <!-- Shopping cart icon -->
  <g filter="url(#shadow)">
    <!-- Cart body -->
    <path d="M25 30 L30 30 L38 60 L70 60 L75 40 L35 40" 
          fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Cart wheels -->
    <circle cx="42" cy="68" r="5" fill="white"/>
    <circle cx="65" cy="68" r="5" fill="white"/>
    <!-- Cart handle -->
    <path d="M25 30 L20 25" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </g>
  
  <!-- Price tag -->
  <g transform="translate(55, 20)">
    <rect x="0" y="0" width="25" height="18" rx="3" fill="white"/>
    <text x="12.5" y="13" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#10B981" text-anchor="middle">$</text>
  </g>
  
  <!-- AI sparkle stars -->
  <g fill="url(#sparkleGradient)">
    <!-- Main star -->
    <path d="M82 15 L84 20 L89 20 L85 24 L87 29 L82 26 L77 29 L79 24 L75 20 L80 20 Z"/>
    <!-- Small stars -->
    <circle cx="70" cy="12" r="2.5"/>
    <circle cx="90" cy="25" r="2"/>
    <circle cx="75" cy="28" r="1.5"/>
  </g>
</svg>`;

// White/light variant for dark backgrounds
export const logoIconWhiteSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sparkleGradientW" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FCD34D"/>
      <stop offset="100%" style="stop-color:#F59E0B"/>
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="50" cy="50" r="48" fill="white"/>
  
  <!-- Shopping cart icon -->
  <g>
    <path d="M25 30 L30 30 L38 60 L70 60 L75 40 L35 40" 
          fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="42" cy="68" r="5" fill="#10B981"/>
    <circle cx="65" cy="68" r="5" fill="#10B981"/>
    <path d="M25 30 L20 25" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
  </g>
  
  <!-- Price tag -->
  <g transform="translate(55, 20)">
    <rect x="0" y="0" width="25" height="18" rx="3" fill="#10B981"/>
    <text x="12.5" y="13" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">$</text>
  </g>
  
  <!-- AI sparkle stars -->
  <g fill="url(#sparkleGradientW)">
    <path d="M82 15 L84 20 L89 20 L85 24 L87 29 L82 26 L77 29 L79 24 L75 20 L80 20 Z"/>
    <circle cx="70" cy="12" r="2.5"/>
    <circle cx="90" cy="25" r="2"/>
    <circle cx="75" cy="28" r="1.5"/>
  </g>
</svg>`;

// Minimal icon variant (no background) - for tab bars and small sizes
export const logoIconMinimalSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  
  <!-- Shopping cart icon -->
  <g>
    <path d="M15 25 L22 25 L35 70 L80 70 L90 35 L30 35" 
          fill="none" stroke="url(#cartGradient)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="42" cy="82" r="7" fill="url(#cartGradient)"/>
    <circle cx="72" cy="82" r="7" fill="url(#cartGradient)"/>
    <path d="M15 25 L8 18" stroke="url(#cartGradient)" stroke-width="5" stroke-linecap="round"/>
  </g>
  
  <!-- AI sparkle -->
  <g fill="#F59E0B">
    <path d="M85 12 L87 18 L93 18 L88 23 L90 29 L85 25 L80 29 L82 23 L77 18 L83 18 Z"/>
  </g>
</svg>`;

// Full logo with text
export const logoFullSvg = `<svg width="280" height="80" viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
    <linearGradient id="sparkleGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FCD34D"/>
      <stop offset="100%" style="stop-color:#F59E0B"/>
    </linearGradient>
  </defs>
  
  <!-- Logo icon -->
  <g transform="translate(5, 5) scale(0.7)">
    <circle cx="50" cy="50" r="48" fill="url(#bgGradientFull)"/>
    <g>
      <path d="M25 30 L30 30 L38 60 L70 60 L75 40 L35 40" 
            fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="42" cy="68" r="5" fill="white"/>
      <circle cx="65" cy="68" r="5" fill="white"/>
      <path d="M25 30 L20 25" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g transform="translate(55, 20)">
      <rect x="0" y="0" width="25" height="18" rx="3" fill="white"/>
      <text x="12.5" y="13" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#10B981" text-anchor="middle">$</text>
    </g>
    <g fill="url(#sparkleGradientFull)">
      <path d="M82 15 L84 20 L89 20 L85 24 L87 29 L82 26 L77 29 L79 24 L75 20 L80 20 Z"/>
      <circle cx="70" cy="12" r="2.5"/>
      <circle cx="90" cy="25" r="2"/>
    </g>
  </g>
  
  <!-- App name -->
  <text x="85" y="38" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#1F2937">GoShopper</text>
  <text x="230" y="38" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#10B981">AI</text>
  
  <!-- Tagline -->
  <text x="85" y="58" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Économisez intelligemment</text>
</svg>`;

// Original receipt-based logo (previous design)
export const logoReceiptSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradientReceipt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10B981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="50" cy="50" r="48" fill="url(#bgGradientReceipt)"/>

  <!-- Receipt icon -->
  <rect x="25" y="18" width="50" height="64" rx="5" ry="5" fill="white" stroke="#374151" stroke-width="1.5"/>

  <!-- Receipt lines -->
  <line x1="32" y1="32" x2="68" y2="32" stroke="#6B7280" stroke-width="2"/>
  <line x1="32" y1="42" x2="60" y2="42" stroke="#6B7280" stroke-width="2"/>
  <line x1="32" y1="52" x2="65" y2="52" stroke="#6B7280" stroke-width="2"/>
  <line x1="32" y1="62" x2="55" y2="62" stroke="#6B7280" stroke-width="2"/>

  <!-- Total line -->
  <line x1="32" y1="74" x2="68" y2="74" stroke="#10B981" stroke-width="2.5"/>
  <text x="35" y="72" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#10B981">TOTAL</text>

  <!-- AI sparkle effect -->
  <circle cx="82" cy="18" r="5" fill="#F59E0B"/>
  <circle cx="88" cy="14" r="2.5" fill="#F59E0B"/>
  <circle cx="79" cy="22" r="2" fill="#F59E0B"/>
  <circle cx="86" cy="24" r="3" fill="#F59E0B"/>
</svg>`;