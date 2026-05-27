import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, Dialogتوضیحات, DialogFooter, DialogHeader, Dialogعنوان } from '@/components/ui/dialog';
import { useگیرندهast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ویرایشسازمانDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Orgتنظیمات {
  company_email?: string;
  salary_currency?: string;
}

export const ویرایشسازمانDialog = ({ open, onبازChange, onSuccess }: ویرایشسازمانDialogProps) => {
  const [loading, setبارگذاری] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [companyایمیل, setCompanyایمیل] = useState('');
  const [settings, setتنظیمات] = useState<Orgتنظیمات>({});
  const { toast } = useگیرندهast();

  useEffect(() => {
    if (open) {
      fetchسازمان();
    }
  }, [open]);

  const fetchسازمان = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, settings_json')
        .eq('id', profile.org_id)
        .single();

      if (error) throw error;

      setOrgId(data.id);
      setOrgName(data.name || '');
      setOrgSlug(data.slug || '');
      const orgتنظیمات = (data.settings_json as Orgتنظیمات) || {};
      setتنظیمات(orgتنظیمات);
      setCompanyایمیل(orgتنظیمات.company_email || '');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleذخیره = async () => {
    if (!orgId) return;

    setبارگذاری(true);
    try {
      const updatedتنظیمات = { ...settings, company_email: companyایمیل };
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName,
          slug: orgSlug,
          settings_json: updatedتنظیمات,
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'سازمان information has been updated',
      });

      onSuccess?.();
      onبازChange(false);
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
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent>
        <DialogHeader>
          <Dialogعنوان>ویرایش سازمان</Dialogعنوان>
          <Dialogتوضیحات>
            به‌روزرسانی your organization information here.
          </Dialogتوضیحات>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">سازمان Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgSlug">سازمان Slug</Label>
            <Input
              id="orgSlug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="acme-corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyایمیل">Company ایمیل آدرس</Label>
            <Input
              id="companyایمیل"
              type="email"
              value={companyایمیل}
              onChange={(e) => setCompanyایمیل(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onبازChange(false)}>
            انصراف
          </Button>
          <Button onClick={handleذخیره} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            ذخیره تغییرات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
