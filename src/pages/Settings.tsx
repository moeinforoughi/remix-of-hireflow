import { useState, useEffect } from 'react';
import { AccountInformation } from '@/components/settings/AccountInformation';
import { خیرtificationتنظیمات } from '@/components/settings/خیرtificationتنظیمات';
import { سازمانپروفایل } from '@/components/settings/سازمانپروفایل';
import { برندینگتنظیمات } from '@/components/settings/برندینگتنظیمات';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const تنظیمات = () => {
  const navigate = useNavigate();
  const [isSiteمدیر کل, setIsSiteمدیر کل] = useState(false);

  useEffect(() => {
    const checkUserنقش = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSiteمدیر کل(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsSiteمدیر کل(roleData?.role === 'site_admin');
    };

    checkUserنقش();
  }, []);

  const handleلوگوut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
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
          onClick={handleلوگوut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - اطلاعات حساب */}
        <div className="bg-card border rounded-lg p-6">
          <AccountInformation />
        </div>

        {/* Right Column - خیرtifications */}
        <div className="bg-card border rounded-lg p-6">
          <خیرtificationتنظیمات />
        </div>
      </div>

      {/* Full Width - سازمان پروفایل - Site مدیر کل Only */}
      {isSiteمدیر کل && (
        <div className="bg-card border rounded-lg p-6">
          <سازمانپروفایل />
        </div>
      )}

      {/* Full Width - برندینگ تنظیمات - Site مدیر کل Only */}
      {isSiteمدیر کل && (
        <div className="bg-card border rounded-lg p-6">
          <برندینگتنظیمات />
        </div>
      )}
    </div>
  );
};

export default تنظیمات;
