import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarامتیازProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export const Starامتیاز = ({ value, onChange, readonly = false, size = 'md' }: StarامتیازProps) => {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              starSize,
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
};
