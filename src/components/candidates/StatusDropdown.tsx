import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getمرحلهColorClasses } from '@/lib/stage-colors';

interface وضعیتDropdownProps {
  currentمرحله: {
    id: string;
    name: string;
    type: string;
  } | null;
  applicationId: string;
  applicationState?: 'active' | 'rejected' | 'withdrawn' | 'hired';
  availableمرحلهs: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  onمرحلهChange?: () => Promise<void> | void;
}

export const وضعیتDropdown = ({
  currentمرحله,
  applicationId,
  applicationState = 'active',
  availableمرحلهs,
  onمرحلهChange,
}: وضعیتDropdownProps) => {
  const [updating, setUpdating] = useState(false);
  const [optimisticمرحلهId, setOptimisticمرحلهId] = useState<string | null>(currentمرحله?.id ?? null);

  useEffect(() => {
    setOptimisticمرحلهId(currentمرحله?.id ?? null);
  }, [currentمرحله?.id]);

  const stageById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: string }>();
    availableمرحلهs.forEach((s) => map.set(s.id, s));
    return map;
  }, [availableمرحلهs]);

  const displayedمرحله = optimisticمرحلهId ? stageById.get(optimisticمرحلهId) ?? currentمرحله : currentمرحله;
  
  // نمایش application state if not active, otherwise show stage name
  const getDisplayName = () => {
    if (applicationState === 'withdrawn') return 'پس گرفتنn';
    if (applicationState === 'rejected') return 'ردed';
    return displayedمرحله?.name || 'خیر مرحله';
  };
  
  const displayedمرحلهName = getDisplayName();
  
  // Disable dropdown if application is withdrawn or rejected
  const isDisabled = updating || applicationState === 'withdrawn' || applicationState === 'rejected';

  const handleمرحلهChange = async (stageId: string) => {
    // Don't update if selecting the same stage
    if ((optimisticمرحلهId ?? currentمرحله?.id) === stageId) return;

    const previousمرحلهId = optimisticمرحلهId ?? currentمرحله?.id ?? null;
    setOptimisticمرحلهId(stageId);

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ current_stage_id: stageId })
        .eq('id', applicationId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('وضعیت update was blocked (no rows updated). Check your permissions for this job.');
      }

      // به‌روزرسانی parent data (authoritative state)
      if (onمرحلهChange) {
        await onمرحلهChange();
      }

      toast({
        title: 'موفقیت',
        description: 'وضعیت updated successfully',
      });
    } catch (error: any) {
      // Revert optimistic UI on failure
      setOptimisticمرحلهId(previousمرحلهId);
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isDisabled}>
        <div
          className={cn(
            'w-[184px] px-3 py-2 rounded-md inline-flex justify-center items-center gap-1 cursor-pointer transition-all border',
            'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
            getمرحلهColorClasses(displayedمرحلهName)
          )}
          aria-label="Change candidate status"
        >
          <div className="flex-1 text-center text-base font-medium">{displayedمرحلهName}</div>
          <ChevronDown className="h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background z-50">
        {availableمرحلهs.map((stage) => (
          <DropdownMenuItem
            key={stage.id}
            onClick={() => handleمرحلهChange(stage.id)}
            className="cursor-pointer"
          >
            <Badge
              variant="outline"
              className={cn('capitalize w-full justify-center border', getمرحلهColorClasses(stage.name))}
            >
              {stage.name}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
