import { useState, useEffect } from 'react';
import { AccountInformation } from '@/components/settings/AccountInformation';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { OrganizationProfile } from '@/components/settings/OrganizationProfile';
import { BrandingSettings } from '@/components/settings/BrandingSettings';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSiteAdmin(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsSiteAdmin(roleData?.role === 'site_admin');
    };

    checkUserRole();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('خطا در خروج از حساب');
    } else {
      toast.success('خروج موفق successfully');
      navigate('/auth/login');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">تنظیمات</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          خروج
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - اطلاعات حساب */}
        <div className="bg-card border rounded-lg p-6">
          <AccountInformation />
        </div>

        {/* Right Column - Notifications */}
        <div className="bg-card border rounded-lg p-6">
          <NotificationSettings />
        </div>
      </div>

      {/* Full Width - سازمان پروفایل - Site مدیر کل Only */}
      {isSiteAdmin && (
        <div className="bg-card border rounded-lg p-6">
          <OrganizationProfile />
        </div>
      )}

      {/* Full Width - برندینگ تنظیمات - Site مدیر کل Only */}
      {isSiteAdmin && (
        <div className="bg-card border rounded-lg p-6">
          <BrandingSettings />
        </div>
      )}
    </div>
  );
};

export default Settings;
