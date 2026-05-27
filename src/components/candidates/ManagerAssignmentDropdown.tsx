import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  انتخاب,
  انتخابContent,
  انتخابItem,
  انتخابTrigger,
  انتخابValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
}

interface ManagerAssignmentDropdownProps {
  applicationId: string;
  currentManagerId: string | null;
  currentManagerName: string | null;
  onبه‌روزرسانی?: () => void;
}

export const ManagerAssignmentDropdown = ({
  applicationId,
  currentManagerId,
  currentManagerName,
  onبه‌روزرسانی,
}: ManagerAssignmentDropdownProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setبارگذاری] = useState(false);
  const [isباز, setIsباز] = useState(false);

  useEffect(() => {
    if (isباز) {
      fetchTeamMembers();
    }
  }, [isباز]);

  const fetchTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;

      if (!profile) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('org_id', profile.org_id)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleAssign = async (userId: string) => {
    setبارگذاری(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ owner_user_id: userId === 'unassign' ? null : userId })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Manager به‌روزرسانیd',
        description: userId === 'unassign' 
          ? 'Manager has been unassigned' 
          : 'Manager has been assigned successfully',
      });

      onبه‌روزرسانی?.();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  return (
    <انتخاب
      value={currentManagerId || ''}
      onValueChange={handleAssign}
      onبازChange={setIsباز}
      disabled={loading}
    >
      <انتخابTrigger 
        className="w-[160px] h-8 text-sm border-none bg-transparent hover:bg-accent/50 focus:ring-0"
        onClick={(e) => e.stopPropagation()}
      >
        <انتخابValue>
          <div className="flex items-center gap-2 text-left">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className={`truncate ${currentManagerName ? 'font-medium' : 'text-muted-foreground'}`}>
              {currentManagerName || 'Assign...'}
            </span>
          </div>
        </انتخابValue>
      </انتخابTrigger>
      <انتخابContent onClick={(e) => e.stopPropagation()}>
        <انتخابItem value="unassign">
          <span className="text-muted-foreground">Unassign</span>
        </انتخابItem>
        {teamMembers.map((member) => (
          <انتخابItem key={member.id} value={member.id}>
            {member.full_name}
          </انتخابItem>
        ))}
      </انتخابContent>
    </انتخاب>
  );
};
