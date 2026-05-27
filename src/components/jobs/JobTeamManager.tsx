import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useگیرندهast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Shield, X } from 'lucide-react';
import {
  انتخاب,
  انتخابContent,
  انتخابItem,
  انتخابTrigger,
  انتخابValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  Dialogتوضیحات,
  DialogFooter,
  DialogHeader,
  Dialogعنوان,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  گیرندهoltip,
  گیرندهoltipContent,
  گیرندهoltipProvider,
  گیرندهoltipTrigger,
} from '@/components/ui/tooltip';
import { تأییدDialog } from '@/components/shared/تأییدDialog';
import { PERMISSION_PRESETS, getPresetById, detectPresetفرستندهدسترسی‌ها, PermissionPreset } from '@/lib/permission-presets';

type Appنقش = 'basic' | 'job_admin' | 'site_admin';

interface JobTeamMember {
  id: string;
  user_id: string;
  can_view: boolean;
  can_move_pipeline: boolean;
  can_message: boolean;
  can_view_offer: boolean;
  user: {
    full_name: string;
    email: string;
  } | null;
  role?: Appنقش;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role?: Appنقش;
}

interface JobTeamManagerProps {
  jobId: string;
}

// Permission matrix: which permissions can each role have toggled
const ROLE_PERMISSION_MATRIX: Record<Appنقش, Record<string, boolean>> = {
  basic: {
    can_view: true,
    can_move_pipeline: false,
    can_message: false,
    can_view_offer: false,
  },
  job_admin: {
    can_view: true,
    can_move_pipeline: true,
    can_message: true,
    can_view_offer: true,
  },
  site_admin: {
    can_view: true,
    can_move_pipeline: true,
    can_message: true,
    can_view_offer: true,
  },
};

// Which presets are available for each role
const ROLE_PRESET_FILTER: Record<Appنقش, string[]> = {
  basic: ['viewer', 'custom'], // پایه users can only be Viewer or Custom (with view only)
  job_admin: ['viewer', 'مصاحبه‌کننده', 'recruiter', 'hiring_manager', 'custom'],
  site_admin: ['viewer', 'مصاحبه‌کننده', 'recruiter', 'hiring_manager', 'custom'],
};

const canگیرندهgglePermission = (role: Appنقش | undefined, permission: string): boolean => {
  if (!role) return true; // Default to allowing if role unknown
  return ROLE_PERMISSION_MATRIX[role]?.[permission] ?? false;
};

const getنقشBadgeVariant = (role: Appنقش | undefined): "default" | "secondary" | "outline" => {
  switch (role) {
    case 'site_admin':
      return 'default';
    case 'job_admin':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getنقشLabel = (role: Appنقش | undefined): string => {
  switch (role) {
    case 'site_admin':
      return 'Site مدیر کل';
    case 'job_admin':
      return 'Job مدیر کل';
    case 'basic':
      return 'پایه';
    default:
      return 'Unknown';
  }
};

export const JobTeamManager = ({ jobId }: JobTeamManagerProps) => {
  const [teamMembers, setTeamMembers] = useState<JobTeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [dialogباز, setDialogباز] = useState(false);
  const [selectedUser, setانتخابedUser] = useState('');
  const [selectedPreset, setانتخابedPreset] = useState('recruiter');
  const [deleteDialogباز, setحذفDialogباز] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [permissions, setدسترسی‌ها] = useState({
    can_view: true,
    can_move_pipeline: false,
    can_message: false,
    can_view_offer: false,
  });
  const { toast } = useگیرندهast();

  useEffect(() => {
    fetchTeamMembers();
    fetchAvailableUsers();
  }, [jobId]);

  // When selected user changes, reset preset to an appropriate default for their role
  useEffect(() => {
    if (selectedUser) {
      const user = availableUsers.find(u => u.id === selectedUser);
      const role = user?.role || 'basic';
      const availablePresets = ROLE_PRESET_FILTER[role];
      
      // If current preset is not available for this role, reset to first available
      if (!availablePresets.includes(selectedPreset)) {
        setانتخابedPreset(availablePresets[0] || 'viewer');
      }
    }
  }, [selectedUser, availableUsers]);

  const fetchTeamMembers = async () => {
    try {
      // First fetch job_acl with user profiles
      const { data: aclData, error: aclError } = await supabase
        .from('job_acl')
        .select(`
          *,
          user:profiles!job_acl_user_id_fkey(full_name, email)
        `)
        .eq('job_id', jobId);

      if (aclError) throw aclError;

      // Then fetch roles for all users in the team
      const userIds = (aclData || []).map(m => m.user_id);
      
      if (userIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // ایجاد a map of user_id to role
        const roleMap = new Map<string, Appنقش>();
        rolesData?.forEach(r => roleMap.set(r.user_id, r.role as Appنقش));

        // Merge roles into team members
        const membersWithنقشs = (aclData || []).map(member => ({
          ...member,
          role: roleMap.get(member.user_id) || 'basic' as Appنقش,
        }));

        setTeamMembers(membersWithنقشs);
      } else {
        setTeamMembers([]);
      }
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

  const fetchAvailableUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('org_id', profile.org_id);

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const userIds = (profilesData || []).map(p => p.id);
      
      if (userIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // ایجاد a map of user_id to role
        const roleMap = new Map<string, Appنقش>();
        rolesData?.forEach(r => roleMap.set(r.user_id, r.role as Appنقش));

        // Merge roles into users
        const usersWithنقشs = (profilesData || []).map(user => ({
          ...user,
          role: roleMap.get(user.id) || 'basic' as Appنقش,
        }));

        setAvailableUsers(usersWithنقشs);
      } else {
        setAvailableUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const handleافزودنMember = async () => {
    if (!selectedUser) return;

    try {
      const selectedUserData = availableUsers.find(u => u.id === selectedUser);
      const userنقش = selectedUserData?.role || 'basic';
      
      // Get preset permissions or custom permissions
      let perms = selectedPreset === 'custom'
        ? permissions
        : getPresetById(selectedPreset)?.permissions || permissions;

      // Enforce role restrictions - basic users cannot have certain permissions
      if (userنقش === 'basic') {
        perms = {
          ...perms,
          can_move_pipeline: false,
          can_message: false,
          can_view_offer: false,
        };
      }

      const { error } = await supabase
        .from('job_acl')
        .insert({
          job_id: jobId,
          user_id: selectedUser,
          ...perms,
        });

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'Team member added successfully',
      });

      setDialogباز(false);
      setانتخابedUser('');
      setانتخابedPreset('recruiter');
      setدسترسی‌ها({
        can_view: true,
        can_move_pipeline: false,
        can_message: false,
        can_view_offer: false,
      });
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleبه‌روزرسانیPermission = async (
    memberId: string,
    field: keyof typeof permissions,
    value: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('job_acl')
        .update({ [field]: value })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'Permission updated',
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleحذفMember = async () => {
    if (!deletingMemberId) return;

    try {
      const { error } = await supabase
        .from('job_acl')
        .delete()
        .eq('id', deletingMemberId);

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'Team member removed',
      });

      setحذفDialogباز(false);
      setDeletingMemberId(null);
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getAvailableUsersForافزودن = () => {
    const existingUserIds = new Set(teamMembers.map(m => m.user_id));
    return availableUsers.filter(u => !existingUserIds.has(u.id));
  };

  const getAvailablePresetsForانتخابedUser = (): PermissionPreset[] => {
    const user = availableUsers.find(u => u.id === selectedUser);
    const role = user?.role || 'basic';
    const allowedPresetIds = ROLE_PRESET_FILTER[role];
    return PERMISSION_PRESETS.filter(p => allowedPresetIds.includes(p.id));
  };

  const selectedUserنقش = availableUsers.find(u => u.id === selectedUser)?.role || 'basic';

  const renderPermissionCell = (
    member: JobTeamMember,
    permission: keyof typeof permissions,
    tooltipText: string
  ) => {
    const canگیرندهggle = canگیرندهgglePermission(member.role, permission);
    
    if (!canگیرندهggle) {
      return (
        <گیرندهoltipProvider>
          <گیرندهoltip>
            <گیرندهoltipTrigger asChild>
              <div className="flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </گیرندهoltipTrigger>
            <گیرندهoltipContent>
              <p>{tooltipText}</p>
            </گیرندهoltipContent>
          </گیرندهoltip>
        </گیرندهoltipProvider>
      );
    }

    return (
      <Checkbox
        checked={member[permission]}
        onCheckedChange={(checked) =>
          handleبه‌روزرسانیPermission(member.id, permission, checked as boolean)
        }
      />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Cardعنوان>Job Team</Cardعنوان>
            <Dialog open={dialogباز} onبازChange={setDialogباز}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  افزودن Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <Dialogعنوان>افزودن Team Member</Dialogعنوان>
                  <Dialogتوضیحات>
                    Grant a user access to this job with specific permissions
                  </Dialogتوضیحات>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User</label>
                    <انتخاب value={selectedUser} onValueChange={setانتخابedUser}>
                      <انتخابTrigger>
                        <انتخابValue placeholder="انتخاب a user" />
                      </انتخابTrigger>
                      <انتخابContent>
                        {getAvailableUsersForافزودن().map((user) => (
                          <انتخابItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <span>{user.full_name}</span>
                              <Badge variant={getنقشBadgeVariant(user.role)} className="text-xs">
                                {getنقشLabel(user.role)}
                              </Badge>
                            </div>
                          </انتخابItem>
                        ))}
                      </انتخابContent>
                    </انتخاب>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">نقش</label>
                    <انتخاب value={selectedPreset} onValueChange={setانتخابedPreset}>
                      <انتخابTrigger>
                        <انتخابValue />
                      </انتخابTrigger>
                      <انتخابContent>
                        {getAvailablePresetsForانتخابedUser().map((preset) => (
                          <انتخابItem key={preset.id} value={preset.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{preset.name}</span>
                              <span className="text-xs text-muted-foreground">{preset.description}</span>
                            </div>
                          </انتخابItem>
                        ))}
                      </انتخابContent>
                    </انتخاب>
                    {selectedUser && selectedUserنقش === 'basic' && (
                      <p className="text-xs text-muted-foreground">
                        پایه users can only have view permissions
                      </p>
                    )}
                  </div>

                  {selectedPreset === 'custom' && (
                    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                      <label className="text-sm font-medium">Custom دسترسی‌ها</label>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="can_view"
                          checked={permissions.can_view}
                          onCheckedChange={(checked) =>
                            setدسترسی‌ها({ ...permissions, can_view: checked as boolean })
                          }
                        />
                        <label htmlFor="can_view" className="text-sm cursor-pointer">
                          Can view applications
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canگیرندهgglePermission(selectedUserنقش, 'can_move_pipeline') ? (
                          <Checkbox
                            id="can_move_pipeline"
                            checked={permissions.can_move_pipeline}
                            onCheckedChange={(checked) =>
                              setدسترسی‌ها({ ...permissions, can_move_pipeline: checked as boolean })
                            }
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <label 
                          htmlFor="can_move_pipeline" 
                          className={`text-sm ${!canگیرندهgglePermission(selectedUserنقش, 'can_move_pipeline') ? 'text-muted-foreground/50 line-through' : 'cursor-pointer'}`}
                        >
                          Can move applications in pipeline
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canگیرندهgglePermission(selectedUserنقش, 'can_message') ? (
                          <Checkbox
                            id="can_message"
                            checked={permissions.can_message}
                            onCheckedChange={(checked) =>
                              setدسترسی‌ها({ ...permissions, can_message: checked as boolean })
                            }
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <label 
                          htmlFor="can_message" 
                          className={`text-sm ${!canگیرندهgglePermission(selectedUserنقش, 'can_message') ? 'text-muted-foreground/50 line-through' : 'cursor-pointer'}`}
                        >
                          Can message candidates
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canگیرندهgglePermission(selectedUserنقش, 'can_view_offer') ? (
                          <Checkbox
                            id="can_view_offer"
                            checked={permissions.can_view_offer}
                            onCheckedChange={(checked) =>
                              setدسترسی‌ها({ ...permissions, can_view_offer: checked as boolean })
                            }
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <label 
                          htmlFor="can_view_offer" 
                          className={`text-sm ${!canگیرندهgglePermission(selectedUserنقش, 'can_view_offer') ? 'text-muted-foreground/50 line-through' : 'cursor-pointer'}`}
                        >
                          Can view and create offers
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedPreset !== 'custom' && (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        دسترسی‌ها for {getPresetById(selectedPreset)?.name}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {getPresetById(selectedPreset)?.permissions.can_view && <div>✓ View applications</div>}
                        {getPresetById(selectedPreset)?.permissions.can_move_pipeline && 
                          (canگیرندهgglePermission(selectedUserنقش, 'can_move_pipeline') 
                            ? <div>✓ Move pipeline</div>
                            : <div className="line-through text-muted-foreground/50">✗ Move pipeline (not available for basic users)</div>
                          )
                        }
                        {getPresetById(selectedPreset)?.permissions.can_message && 
                          (canگیرندهgglePermission(selectedUserنقش, 'can_message')
                            ? <div>✓ پیام candidates</div>
                            : <div className="line-through text-muted-foreground/50">✗ پیام candidates (not available for basic users)</div>
                          )
                        }
                        {getPresetById(selectedPreset)?.permissions.can_view_offer && 
                          (canگیرندهgglePermission(selectedUserنقش, 'can_view_offer')
                            ? <div>✓ View & create offers</div>
                            : <div className="line-through text-muted-foreground/50">✗ View & create offers (not available for basic users)</div>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogباز(false)}>
                    انصراف
                  </Button>
                  <Button onClick={handleافزودنMember} disabled={!selectedUser}>
                    افزودن Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              خیر team members assigned to this job yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead className="text-center">View</TableHead>
                  <TableHead className="text-center">Move پایپ‌لاین</TableHead>
                  <TableHead className="text-center">پیام</TableHead>
                  <TableHead className="text-center">View Offers</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.filter(member => member.user).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{member.user?.full_name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getنقشBadgeVariant(member.role)}>
                        {getنقشLabel(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_view', 'View permission')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_move_pipeline', 'پایه users cannot move pipeline')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_message', 'پایه users cannot message candidates')}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderPermissionCell(member, 'can_view_offer', 'پایه users cannot view offers')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingMemberId(member.id);
                          setحذفDialogباز(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <تأییدDialog
        open={deleteDialogباز}
        onبازChange={setحذفDialogباز}
        onتأیید={handleحذفMember}
        title="حذف Team Member"
        description="Are you sure you want to remove this user from the job team? They will lose access to this job's applications and data."
        confirmText="حذف"
        variant="destructive"
      />
    </>
  );
};
