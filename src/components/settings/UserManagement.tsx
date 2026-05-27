import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { useگیرندهast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { InviteUserDialog } from './InviteUserDialog';
import { ویرایشUserDialog } from './ویرایشUserDialog';
import { notifyنقشChanged } from '@/lib/notifications';

interface User {
  id: string;
  full_name: string;
  email: string;
  status: string;
  role: string;
  department: string;
  listings_count: number;
  avatar_url?: string | null;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [currentUserایمیل, setCurrentUserایمیل] = useState<string>('');
  const [editingUser, setویرایشingUser] = useState<User | null>(null);
  const [editDialogباز, setویرایشDialogباز] = useState(false);
  const { toast } = useگیرندهast();

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setCurrentUserایمیل(user.email);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get current user's org_id first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setبارگذاری(false);
        return;
      }

      const { data: currentپروفایل } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!currentپروفایل) {
        setبارگذاری(false);
        return;
      }

      // فیلتر profiles by same org_id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', currentپروفایل.org_id)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithنقشs = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          // If user has no role, auto-fix by assigning 'basic' role
          let role = roleData?.role;
          if (!role) {
            const { error: fixنقشError } = await supabase
              .from('user_roles')
              .insert({ user_id: profile.id, role: 'basic' });
            
            if (!fixنقشError) {
              role = 'basic';
              console.log(`Auto-fixed missing role for user ${profile.email}`);
            }
          }

          // Get job assignments count
          const { data: jobAcl } = await supabase
            .from('job_acl')
            .select('job_id')
            .eq('user_id', profile.id);

          const department = profile.department || '-';
          const listings_count = jobAcl?.length || 0;

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            status: profile.status,
            role: role || 'basic',
            department,
            listings_count,
            avatar_url: profile.avatar_url,
          };
        })
      );

      setUsers(usersWithنقشs);
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

  const handleنقشChange = async (userId: string, newنقش: 'basic' | 'job_admin' | 'site_admin') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get target user info for notification
      const targetUser = users.find(u => u.id === userId);

      // حذف existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newنقش });

      if (insertError) throw insertError;

      toast({
        title: 'موفقیت',
        description: 'User role updated successfully',
      });

      // ارسال notification about role change
      if (targetUser) {
        notifyنقشChanged(userId, targetUser.full_name, newنقش, user.id);
      }

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getنقشLabel = (role: string) => {
    const labels: Record<string, string> = {
      basic: 'Can View',
      job_admin: 'Can ویرایش',
      site_admin: 'مدیر کل',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl">اعضای تیم</h1>
        </div>
        <InviteUserDialog onInviteSuccess={fetchUsers} />
      </div>

      <div className="bg-card rounded-lg p-4">
        <Table className="border-separate border-spacing-y-2">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-0">
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[220px]">ایمیل</TableHead>
              <TableHead className="w-[150px]">بخش</TableHead>
              <TableHead className="w-[100px]"># of Listings</TableHead>
              <TableHead className="w-[130px]">دسترسی‌ها</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-accent/50 border-0"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderRadius: '8px',
                }}
                onClick={() => {
                  setویرایشingUser(user);
                  setویرایشDialogباز(true);
                }}
              >
                <TableCell className="rounded-l-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-[30px] w-[30px]">
                      <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                      <AvatarFallback className="text-xs">
                        {user.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-[14px]">{user.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-primary font-semibold text-[14px]">{user.email}</span>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium text-[14px]">{user.department}</span>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium text-[14px]">{user.listings_count}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-between">
                    <انتخاب
                      value={user.role}
                      onValueChange={(value) => handleنقشChange(user.id, value as 'basic' | 'job_admin' | 'site_admin')}
                      disabled={user.email === 'demo@hireflow.app' && currentUserایمیل === 'demo@hireflow.app'}
                    >
                      <انتخابTrigger 
                        className="w-[106px] h-[30px] text-[12px] font-medium border-border"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <انتخابValue>{getنقشLabel(user.role)}</انتخابValue>
                      </انتخابTrigger>
                      <انتخابContent>
                        <انتخابItem value="basic">Can View</انتخابItem>
                        <انتخابItem value="job_admin">Can ویرایش</انتخابItem>
                        <انتخابItem value="site_admin">مدیر کل</انتخابItem>
                      </انتخابContent>
                    </انتخاب>
                  </div>
                </TableCell>
                <TableCell className="rounded-r-lg">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ویرایشUserDialog
        open={editDialogباز}
        onبازChange={setویرایشDialogباز}
        user={editingUser}
        onبه‌روزرسانیSuccess={fetchUsers}
      />
    </div>
  );
};
