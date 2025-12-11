/**
 * GoShopperAI Logo Variants
 * 
 * Color Palette Options:
 * 
 * OPTION 1 - Trust & Prosperity (Blue + Gold) [RECOMMENDED]
 * - Primary (60%): #1E3A5F (Deep Navy Blue)
 * - Secondary (30%): #F5F7FA (Off-White)
 * - Accent (10%): #D4AF37 (Gold)
 * 
 * OPTION 2 - Energy & Savings (Purple + Orange)
 * - Primary (60%): #5B21B6 (Deep Purple)
 * - Secondary (30%): #F8F5FF (Lavender Tint)
 * - Accent (10%): #F97316 (Vibrant Orange)
 * 
 * OPTION 3 - Growth & Action (Teal + Coral)
 * - Primary (60%): #0F766E (Deep Teal)
 * - Secondary (30%): #F0FDFA (Mint Tint)
 * - Accent (10%): #EF4444 (Coral Red)
 */

// ============================================
// OPTION 1: BLUE + GOLD (Trust & Prosperity)
// ============================================
export const logoBlueGoldSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgBlueGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A5F"/>
      <stop offset="100%" style="stop-color:#152A45"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100" height="100" rx="22" fill="url(#bgBlueGold)"/>
  
  <!-- Letter G with integrated search -->
  <g transform="translate(15, 18)">
    <!-- Main G letter -->
    <path d="M32 0C14.3 0 0 14.3 0 32C0 49.7 14.3 60 32 60C38 60 43.5 58.5 48 55.8V35H30V45H38V49C36.2 49.8 34.2 50 32 50C20 50 10 42 10 32C10 20 20 10 32 10C40 10 47 14.5 50 21L58 16C53 6.5 43.5 0 32 0Z" 
          fill="white"/>
    
    <!-- Search magnifier integrated -->
    <circle cx="54" cy="44" r="11" fill="none" stroke="#D4AF37" stroke-width="4"/>
    <line x1="62" y1="52" x2="70" y2="60" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// ============================================
// OPTION 2: PURPLE + ORANGE (Energy & Savings)
// ============================================
export const logoPurpleOrangeSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#5B21B6"/>
      <stop offset="100%" style="stop-color:#4C1D95"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100" height="100" rx="22" fill="url(#bgPurple)"/>
  
  <!-- Letter G with integrated search -->
  <g transform="translate(15, 18)">
    <!-- Main G letter -->
    <path d="M32 0C14.3 0 0 14.3 0 32C0 49.7 14.3 60 32 60C38 60 43.5 58.5 48 55.8V35H30V45H38V49C36.2 49.8 34.2 50 32 50C20 50 10 42 10 32C10 20 20 10 32 10C40 10 47 14.5 50 21L58 16C53 6.5 43.5 0 32 0Z" 
          fill="white"/>
    
    <!-- Search magnifier integrated -->
    <circle cx="54" cy="44" r="11" fill="none" stroke="#F97316" stroke-width="4"/>
    <line x1="62" y1="52" x2="70" y2="60" stroke="#F97316" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// ============================================
// OPTION 3: TEAL + CORAL (Growth & Action)
// ============================================
export const logoTealCoralSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgTeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F766E"/>
      <stop offset="100%" style="stop-color:#0D5D56"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100" height="100" rx="22" fill="url(#bgTeal)"/>
  
  <!-- Letter G with integrated search -->
  <g transform="translate(15, 18)">
    <!-- Main G letter -->
    <path d="M32 0C14.3 0 0 14.3 0 32C0 49.7 14.3 60 32 60C38 60 43.5 58.5 48 55.8V35H30V45H38V49C36.2 49.8 34.2 50 32 50C20 50 10 42 10 32C10 20 20 10 32 10C40 10 47 14.5 50 21L58 16C53 6.5 43.5 0 32 0Z" 
          fill="white"/>
    
    <!-- Search magnifier integrated -->
    <circle cx="54" cy="44" r="11" fill="none" stroke="#EF4444" stroke-width="4"/>
    <line x1="62" y1="52" x2="70" y2="60" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// Default export (Blue + Gold recommended)
export const logoIconSvg = logoBlueGoldSvg;

// White variant for dark mode
export const logoIconWhiteSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100" height="100" rx="22" fill="white"/>
  
  <!-- Letter G with integrated search -->
  <g transform="translate(15, 18)">
    <!-- Main G letter -->
    <path d="M32 0C14.3 0 0 14.3 0 32C0 49.7 14.3 60 32 60C38 60 43.5 58.5 48 55.8V35H30V45H38V49C36.2 49.8 34.2 50 32 50C20 50 10 42 10 32C10 20 20 10 32 10C40 10 47 14.5 50 21L58 16C53 6.5 43.5 0 32 0Z" 
          fill="#1E3A5F"/>
    
    <!-- Search magnifier integrated -->
    <circle cx="54" cy="44" r="11" fill="none" stroke="#D4AF37" stroke-width="4"/>
    <line x1="62" y1="52" x2="70" y2="60" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// Minimal variant (no background)
export const logoIconMinimalSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Letter G with integrated search -->
  <g transform="translate(15, 18)">
    <!-- Main G letter -->
    <path d="M32 0C14.3 0 0 14.3 0 32C0 49.7 14.3 60 32 60C38 60 43.5 58.5 48 55.8V35H30V45H38V49C36.2 49.8 34.2 50 32 50C20 50 10 42 10 32C10 20 20 10 32 10C40 10 47 14.5 50 21L58 16C53 6.5 43.5 0 32 0Z" 
          fill="#1E3A5F"/>
    
    <!-- Search magnifier integrated -->
    <circle cx="54" cy="44" r="11" fill="none" stroke="#D4AF37" stroke-width="4"/>
    <line x1="62" y1="52" x2="70" y2="60" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// Full logo with text
export const logoFullSvg = `<svg width="280" height="80" viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1E3A5F"/>
      <stop offset="100%" style="stop-color:#152A45"/>
    </linearGradient>
  </defs>
  
  <!-- Logo icon -->
  <g transform="translate(5, 5) scale(0.7)">
    <rect width="100" height="100" rx="22" fill="url(#bgFull)"/>
    <g transform="translate(15, 18)">
      <path d="M32 0C14.3 0 0 14.3 0 32C0 49.7 14.3 60 32 60C38 60 43.5 58.5 48 55.8V35H30V45H38V49C36.2 49.8 34.2 50 32 50C20 50 10 42 10 32C10 20 20 10 32 10C40 10 47 14.5 50 21L58 16C53 6.5 43.5 0 32 0Z" 
            fill="white"/>
      <circle cx="54" cy="44" r="11" fill="none" stroke="#D4AF37" stroke-width="4"/>
      <line x1="62" y1="52" x2="70" y2="60" stroke="#D4AF37" stroke-width="4" stroke-linecap="round"/>
    </g>
  </g>
  
  <!-- App name -->
  <text x="85" y="38" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#1E3A5F">GoShopper</text>
  <text x="230" y="38" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#D4AF37">AI</text>
  
  <!-- Tagline -->
  <text x="85" y="58" font-family="Arial, sans-serif" font-size="12" fill="#64748B">Économisez intelligemment</text>
</svg>`;

// Color palette exports for use throughout the app
export const ColorPalette = {
  // Option 1: Blue + Gold (Default)
  blueGold: {
    primary: '#1E3A5F',
    primaryDark: '#152A45',
    secondary: '#F5F7FA',
    accent: '#D4AF37',
    text: '#1E293B',
    textLight: '#64748B',
    white: '#FFFFFF',
  },
  // Option 2: Purple + Orange
  purpleOrange: {
    primary: '#5B21B6',
    primaryDark: '#4C1D95',
    secondary: '#F8F5FF',
    accent: '#F97316',
    text: '#1E293B',
    textLight: '#64748B',
    white: '#FFFFFF',
  },
  // Option 3: Teal + Coral
  tealCoral: {
    primary: '#0F766E',
    primaryDark: '#0D5D56',
    secondary: '#F0FDFA',
    accent: '#EF4444',
    text: '#1E293B',
    textLight: '#64748B',
    white: '#FFFFFF',
  },
};

// Default color palette (can be changed by user preference)
export const Colors = ColorPalette.blueGold;
