/**
 * BucketShop Elite Dark Theme Configuration
 * 
 * Professional-grade color palette designed for premium trading interfaces.
 * Optimized for contrast, accessibility, and visual hierarchy.
 */

export const BUCKETSHOP_ELITE_THEME = {
  // Core Background Colors
  background: {
    primary: '#0a0e1a',      // Deep space blue - main background
    secondary: '#0f1419',    // Slightly lighter for panels
    tertiary: '#1a1f2e',     // Card/section backgrounds
  },
  
  // Text Colors
  text: {
    primary: '#e2e8f0',      // Crisp white - main text
    secondary: '#94a3b8',    // Muted blue-gray - secondary text
    tertiary: '#64748b',     // Subtle gray - disabled/hint text
    inverse: '#0f172a',      // Dark text for light backgrounds
  },
  
  // Chart Grid & Borders
  grid: {
    primary: '#1e2532',      // Subtle blue-gray grid lines
    secondary: '#2a3441',    // Slightly more visible borders
    accent: '#334155',       // Interactive element borders
  },
  
  // Trading Colors
  trading: {
    bull: '#06d6a0',         // Premium teal - bullish/up
    bear: '#f72585',         // Vibrant pink - bearish/down
    bullWick: '#0891b2',     // Darker teal for wicks
    bearWick: '#be185d',     // Darker pink for wicks
    neutral: '#64748b',      // Neutral gray
  },
  
  // Accent & Interactive
  accent: {
    primary: '#805ad5',      // Royal purple - primary actions
    secondary: '#6366f1',    // Electric blue - secondary actions
    success: '#10b981',      // Success green
    warning: '#f59e0b',      // Warning amber
    error: '#ef4444',        // Error red
  },
  
  // State Colors
  status: {
    connected: '#10b981',    // Green - live connection
    connecting: '#f59e0b',   // Amber - connecting
    disconnected: '#ef4444', // Red - offline
    processing: '#6366f1',   // Blue - loading/processing
  },
  
  // Overlays & Shadows
  overlay: {
    backdrop: 'rgba(10, 14, 26, 0.9)',     // Modal backdrop
    tooltip: 'rgba(30, 37, 50, 0.95)',     // Tooltip background
    shadow: 'rgba(0, 0, 0, 0.25)',         // Drop shadows
    glow: 'rgba(128, 90, 213, 0.2)',       // Accent glow
  }
} as const;

/**
 * Typography scale for consistent text sizing
 */
export const TYPOGRAPHY = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
} as const;

/**
 * Spacing scale for consistent layout
 */
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
} as const;

/**
 * Border radius for consistent rounded corners
 */
export const RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  full: '9999px',   // Fully rounded
} as const;