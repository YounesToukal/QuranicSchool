import { Hizb } from '@/types';
import { cn } from '@/lib/utils';

interface HizbGridProps {
  hizbs: Hizb[];
  currentHizb: number;
  completedHizbs: number[];
  onHizbClick?: (hizbNumber: number) => void;
  className?: string;
}

export default function HizbGrid({
  // hizbs prop accepted for API compatibility but not used (grid generates 1-60 numerically)
  currentHizb,
  completedHizbs,
  onHizbClick,
  className = ''
}: HizbGridProps) {
  const getHizbStatus = (hizbNumber: number) => {
    // Check if explicitly marked as completed
    if (completedHizbs.includes(hizbNumber)) return 'completed';
    
    // Current hizb in progress
    if (hizbNumber === currentHizb) return 'current';
    
    // All hizbs before current are completed
    if (hizbNumber < currentHizb) return 'completed';
    
    // All hizbs after current are locked
    return 'locked';
  };

  return (
    <div className={`grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-1 md:gap-1.5 ${className}`}>
      {Array.from({ length: 60 }, (_, i) => i + 1).map((hizbNum) => {
        const status = getHizbStatus(hizbNum);
        
        return (
          <button
            key={hizbNum}
            onClick={() => onHizbClick?.(hizbNum)}
            className={cn(
              'hizb-cell',
              status === 'completed' && 'hizb-completed',
              status === 'current' && 'hizb-current',
              status === 'locked' && 'hizb-locked'
            )}
            disabled={status === 'locked'}
            type="button"
          >
            {hizbNum}
          </button>
        );
      })}
    </div>
  );
}
