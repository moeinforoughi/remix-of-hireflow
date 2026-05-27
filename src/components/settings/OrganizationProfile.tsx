import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { useگیرندهast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { ویرایشسازمانDialog } from './ویرایشسازمانDialog';

interface Orgتنظیمات {
  company_email?: string;
  salary_currency?: string;
}

export const سازمانپروفایل = () => {
  const [org, setOrg] = useState<any>(null);
  const [settings, setتنظیمات] = useState<Orgتنظیمات>({});
  const [loading, setبارگذاری] = useState(true);
  const [editDialogباز, setویرایشDialogباز] = useState(false);
  const { toast } = useگیرندهast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchسازمان();
  }, []);

  const fetchسازمان = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('خیرt authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('پروفایل not found');

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.org_id)
        .single();

      if (error) throw error;

      setOrg(data);
      setتنظیمات((data.settings_json as Orgتنظیمات) || {});
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

  const handleواحد پولChange = async (newواحد پول: string) => {
    try {
      const updatedتنظیمات = { ...settings, salary_currency: newواحد پول };
      const { error } = await supabase
        .from('organizations')
        .update({ settings_json: updatedتنظیمات })
        .eq('id', org.id);

      if (error) throw error;

      setتنظیمات(updatedتنظیمات);
      toast({ title: 'واحد پول updated' });
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

  const orgInitials = org?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'O';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg">سازمان پروفایل & تنظیمات</h3>
      </div>

      <div className="space-y-6">
        {/* سازمان Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-primary">
              <AvatarFallback className="text-lg text-primary-foreground">{orgInitials}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl">{org?.name || 'سازمان'}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setویرایشDialogباز(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            ویرایش
          </Button>
        </div>

        {/* سازمان Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Company ایمیل آدرس</span>
            <span className="text-sm font-medium text-primary">
              {settings.company_email || 'خیرt set - click ویرایش to add'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">ردion ایمیل Template</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/templates')}
              >
                Manage Templates
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-sm text-muted-foreground">Offer ایمیل Template</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/templates')}
              >
                Manage Templates
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-muted-foreground">Salary واحد پول</span>
            <انتخاب value={settings.salary_currency || 'USD'} onValueChange={handleواحد پولChange}>
              <انتخابTrigger className="w-[200px]">
                <انتخابValue />
              </انتخابTrigger>
              <انتخابContent>
                <انتخابItem value="USD">$ US Dollar</انتخابItem>
                <انتخابItem value="EUR">€ Euro</انتخابItem>
                <انتخابItem value="GBP">£ British Pound</انتخابItem>
                <انتخابItem value="JPY">¥ Japanese Yen</انتخابItem>
              </انتخابContent>
            </انتخاب>
          </div>
        </div>
      </div>

      <ویرایشسازمانDialog 
        open={editDialogباز}
        onبازChange={setویرایشDialogباز}
        onSuccess={fetchسازمان}
      />
    </div>
  );
};
