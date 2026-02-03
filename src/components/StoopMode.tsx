'use client';

import { useState, useEffect, ReactNode } from 'react';

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

interface StoopModeProviderProps {
  children: ReactNode;
}

// Theme class configurations for each time of day
const themeClasses: Record<TimeOfDay, {
  main: string;
  nav: string;
  footer: string;
}> = {
  morning: {
    // Sunrise Vibe: warm peaches, soft oranges, light blues
    main: 'bg-gradient-to-b from-orange-50 via-amber-50 to-blue-50 text-stone-900',
    nav: 'bg-orange-50/80 border-orange-200/50',
    footer: 'bg-orange-100 border-orange-200',
  },
  afternoon: {
    // City Day Vibe: current bright/clean aesthetic
    main: 'bg-stone-50 text-stone-900',
    nav: 'bg-stone-50/80 border-stone-200/50',
    footer: 'bg-stone-100 border-stone-200',
  },
  evening: {
    // Night Vibe: deep midnight blue/slate, light text
    main: 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100',
    nav: 'bg-slate-900/80 border-slate-700/50',
    footer: 'bg-slate-800 border-slate-700',
  },
};

// Determine time of day from hour (0-23)
function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'afternoon';
  return 'evening'; // 6 PM - 5 AM
}

// Export theme context for child components
export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('afternoon'); // Default to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setTimeOfDay(getTimeOfDay(hour));

    // Update every minute in case user is on the site during transition
    const interval = setInterval(() => {
      const newHour = new Date().getHours();
      setTimeOfDay(getTimeOfDay(newHour));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Return default during SSR to prevent hydration mismatch
  if (!mounted) return 'afternoon';
  return timeOfDay;
}

export function StoopModeProvider({ children }: StoopModeProviderProps) {
  const timeOfDay = useTimeOfDay();

  return (
    <div 
      className={`stoop-mode stoop-${timeOfDay} min-h-screen transition-colors duration-1000`}
      data-theme={timeOfDay}
    >
      {/* Pass theme context via CSS variables and data attributes */}
      <style jsx global>{`
        .stoop-morning {
          --stoop-accent: #ea580c;
          --stoop-glow: 0 0 30px rgba(251, 191, 36, 0.2);
        }
        .stoop-afternoon {
          --stoop-accent: #ea580c;
          --stoop-glow: none;
        }
        .stoop-evening {
          --stoop-accent: #f97316;
          --stoop-glow: 0 0 40px rgba(249, 115, 22, 0.3);
        }
        
        /* Evening mode streetlamp glow effect on logo */
        .stoop-evening .stoop-logo {
          text-shadow: 0 0 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(249, 115, 22, 0.3);
        }
        
        /* Smooth transitions for all themed elements */
        .stoop-mode * {
          transition-property: background-color, border-color, color, box-shadow;
          transition-duration: 300ms;
        }
      `}</style>
      {children}
    </div>
  );
}

// Export theme classes for use in page components
export { themeClasses, getTimeOfDay };
export type { TimeOfDay };
