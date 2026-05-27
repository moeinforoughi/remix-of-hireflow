import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, Dialogتوضیحات, DialogFooter, DialogHeader, Dialogعنوان } from '@/components/ui/dialog';
import { useگیرندهast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, Alertتوضیحات } from '@/components/ui/alert';

interface حذفAccountDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
}

export const حذفAccountDialog = ({ open, onبازChange }: حذفAccountDialogProps) => {
  const [loading, setبارگذاری] = useState(false);
  const [confirmation, setتأییدation] = useState('');
  const { toast } = useگیرندهast();
  const navigate = useNavigate();

  const handleحذف = async () => {
    if (confirmation !== 'DELETE') {
      toast({
        title: 'Invalid confirmation',
        description: 'Please type DELETE to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }

    setبارگذاری(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'خطا',
          description: 'You must be logged in to delete your account',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Sign out locally after successful deletion
      await supabase.auth.signOut();

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });

      navigate('/auth/login');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  return (
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent>
        <DialogHeader>
          <Dialogعنوان className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            حذف Account
          </Dialogعنوان>
          <Dialogتوضیحات>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </Dialogتوضیحات>
        </DialogHeader>
        
        <Alert variant="destructive">
          <Alertتوضیحات>
            Warning: All your data including applications, interviews, and offers will be permanently deleted.
          </Alertتوضیحات>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setتأییدation(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onبازChange(false)}>
            انصراف
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleحذف} 
            disabled={loading || confirmation !== 'DELETE'}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            حذف Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
