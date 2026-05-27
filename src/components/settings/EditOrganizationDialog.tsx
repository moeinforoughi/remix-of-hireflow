import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, Dialogعنوان } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ویرایشOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface OrgSettings {
  company_email?: string;
  salary_currency?: string;
}

export const ویرایشOrganizationDialog = ({ open, onOpenChange, onSuccess }: ویرایشOrganizationDialogProps) => {
  const [loading, setبارگذاری] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [settings, setSettings] = useState<OrgSettings>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchOrganization();
    }
  }, [open]);

  const fetchOrganization = async () => {
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
      const orgSettings = (data.settings_json as OrgSettings) || {};
      setSettings(orgSettings);
      setCompanyEmail(orgSettings.company_email || '');
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
      const updatedSettings = { ...settings, company_email: companyEmail };
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName,
          slug: orgSlug,
          settings_json: updatedSettings,
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'Organization information has been updated',
      });

      onSuccess?.();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Dialogعنوان>ویرایش Organization</Dialogعنوان>
          <DialogDescription>
            به‌روزرسانی your organization information here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgSlug">Organization Slug</Label>
            <Input
              id="orgSlug"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              placeholder="acme-corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Company Email Address</Label>
            <Input
              id="companyEmail"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
