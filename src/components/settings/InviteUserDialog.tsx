import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, Dialogعنوان, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useگیرندهast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { notifyUserایجادd } from '@/lib/notifications';

interface InviteUserDialogProps {
  onInviteSuccess: () => void;
}

type Mode = 'create' | 'transfer';

export const InviteUserDialog = ({ onInviteSuccess }: InviteUserDialogProps) => {
  const [open, setباز] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [email, setایمیل] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setرمز عبور] = useState('');
  const [confirmرمز عبور, setتأییدرمز عبور] = useState('');
  const [showرمز عبور, setنمایشرمز عبور] = useState(false);
  const [department, setبخش] = useState('');
  const [role, setنقش] = useState<'basic' | 'job_admin' | 'site_admin'>('basic');
  const [selectedJobs, setانتخابedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setبارگذاری] = useState(false);
  const { toast } = useگیرندهast();

  useEffect(() => {
    if (open) {
      fetchJobs();
    }
  }, [open]);

  const resetForm = () => {
    setایمیل('');
    setFullName('');
    setرمز عبور('');
    setتأییدرمز عبور('');
    setبخش('');
    setنقش('basic');
    setانتخابedJobs([]);
    setMode('create');
  };

  const fetchJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const { data, error } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('org_id', profile.org_id)
      .eq('status', 'open')
      .order('title');

    if (!error && data) {
      setJobs(data);
    }
  };

  const toggleJob = (jobId: string) => {
    setانتخابedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleInvite = async () => {
    if (!email || !fullName || !password) {
      toast({
        title: 'خطا',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'خطا',
        description: 'رمز عبور must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmرمز عبور) {
      toast({
        title: 'خطا',
        description: 'رمز عبورs do not match',
        variant: 'destructive',
      });
      return;
    }

    setبارگذاری(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to invite users');
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          fullName,
          password,
          department: department || null,
          role,
          jobIds: selectedJobs,
        },
      });

      let errorپیام: string | undefined;
      
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        errorپیام = data.error as string;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.message) {
          errorپیام = errorObj.message;
        }
      }
      
      if (errorپیام || !data?.success) {
        throw new Error(errorپیام || 'Failed to invite user');
      }

      toast({
        title: 'موفقیت',
        description: `User created successfully. They can now log in with their email and password.`,
      });

      // ارسال notification about new user
      if (data?.userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          notifyUserایجادd(data.userId, fullName, profile.org_id, session.user.id);
        }
      }

      setباز(false);
      resetForm();
      onInviteSuccess();
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

  const handleTransfer = async () => {
    if (!email) {
      toast({
        title: 'خطا',
        description: 'Please enter the email of the user to transfer',
        variant: 'destructive',
      });
      return;
    }

    setبارگذاری(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to transfer users');
      }

      const { data, error } = await supabase.functions.invoke('transfer-user', {
        body: {
          email,
          role,
          department: department || null,
          jobIds: selectedJobs,
        },
      });

      let errorپیام: string | undefined;
      
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        errorپیام = data.error as string;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.message) {
          errorپیام = errorObj.message;
        }
      }
      
      if (errorپیام || !data?.success) {
        throw new Error(errorپیام || 'Failed to transfer user');
      }

      toast({
        title: 'موفقیت',
        description: `User "${data.user?.full_name || email}" has been transferred to your organization.`,
      });

      setباز(false);
      resetForm();
      onInviteSuccess();
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
    <Dialog open={open} onبازChange={(isباز) => {
      setباز(isباز);
      if (!isباز) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <Dialogعنوان className="text-xl">
            {mode === 'create' ? 'ایجاد New User' : 'افزودن Existing User'}
          </Dialogعنوان>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create' 
              ? 'ایجاد a new account for a team member'
              : 'Transfer an existing user from another organization'
            }
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Mode گیرندهggle */}
          <div className="flex rounded-lg border p-1 bg-muted/30 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                mode === 'create'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ایجاد New
            </button>
            <button
              type="button"
              onClick={() => setMode('transfer')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                mode === 'transfer'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              افزودن Existing
            </button>
          </div>

          <div className="space-y-5">
            {/* Account Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm text-foreground uppercase tracking-wide">
                Account Details
              </h3>
              
              {/* Name field - only for create mode */}
              {mode === 'create' && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    نام و نام خانوادگی <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              )}

              {/* ایمیل field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  ایمیل آدرس <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setایمیل(e.target.value)}
                  placeholder="john@company.com"
                />
              </div>

              {/* رمز عبور fields - only for create mode */}
              {mode === 'create' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">
                      رمز عبور <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showرمز عبور ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setرمز عبور(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setنمایشرمز عبور(!showرمز عبور)}
                      >
                        {showرمز عبور ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmرمز عبور" className="text-sm font-medium">
                      تأیید <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmرمز عبور"
                        type={showرمز عبور ? 'text' : 'password'}
                        value={confirmرمز عبور}
                        onChange={(e) => setتأییدرمز عبور(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setنمایشرمز عبور(!showرمز عبور)}
                      >
                        {showرمز عبور ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* نقش & Access Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm text-foreground uppercase tracking-wide">
                نقش & Access
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* بخش */}
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm font-medium">
                    بخش
                  </Label>
                  <انتخاب value={department} onValueChange={setبخش}>
                    <انتخابTrigger>
                      <انتخابValue placeholder="انتخاب..." />
                    </انتخابTrigger>
                    <انتخابContent className="bg-background z-50">
                      <انتخابItem value="Engineering">Engineering</انتخابItem>
                      <انتخابItem value="Design">Design</انتخابItem>
                      <انتخابItem value="Product">Product</انتخابItem>
                      <انتخابItem value="Marketing">Marketing</انتخابItem>
                      <انتخابItem value="Sales">Sales</انتخابItem>
                      <انتخابItem value="HR">HR</انتخابItem>
                      <انتخابItem value="Finance">Finance</انتخابItem>
                      <انتخابItem value="Operations">Operations</انتخابItem>
                    </انتخابContent>
                  </انتخاب>
                </div>

                {/* نقش */}
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Permission Level
                  </Label>
                  <انتخاب value={role} onValueChange={(value: any) => setنقش(value)}>
                    <انتخابTrigger>
                      <انتخابValue placeholder="انتخاب..." />
                    </انتخابTrigger>
                    <انتخابContent className="bg-background z-50">
                      <انتخابItem value="basic">پایه</انتخابItem>
                      <انتخابItem value="job_admin">Job مدیر کل</انتخابItem>
                      <انتخابItem value="site_admin">Site مدیر کل</انتخابItem>
                    </انتخابContent>
                  </انتخاب>
                </div>
              </div>
            </div>

            {/* Job Assignment Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-foreground uppercase tracking-wide">
                  Assign to Jobs
                </h3>
                {selectedJobs.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {selectedJobs.length} selected
                  </span>
                )}
              </div>
              <div className="border rounded-lg p-3 max-h-[140px] overflow-y-auto bg-muted/20">
                {jobs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    خیر open jobs to assign
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={job.id}
                          checked={selectedJobs.includes(job.id)}
                          onCheckedChange={() => toggleJob(job.id)}
                        />
                        <label
                          htmlFor={job.id}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {job.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex gap-3 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => setباز(false)} className="flex-1">
            انصراف
          </Button>
          <Button 
            onClick={mode === 'create' ? handleInvite : handleTransfer} 
            disabled={loading} 
            className="flex-1"
          >
            {loading 
              ? (mode === 'create' ? 'در حال ایجاد...' : 'Transferring...') 
              : (mode === 'create' ? 'ایجاد User' : 'Transfer User')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
