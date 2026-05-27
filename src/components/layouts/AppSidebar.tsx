import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Users, تنظیمات, LogOut, User, به‌روزرسانیCw, Shield, DollarSign, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

const getMenuItemsForنقش = (roles: string[]) => {
  const isSiteمدیر کل = roles.includes('site_admin');
  const isJobمدیر کل = roles.includes('job_admin');
  
  const baseItems = [
    { title: 'داشبورد', url: '/dashboard', icon: LayoutDashboard },
  ];
  
  if (isSiteمدیر کل) {
    return [
      ...baseItems,
      { title: 'اعضای تیم', url: '/team-members', icon: Shield },
      { title: 'موقعیت‌های شغلی', url: '/jobs', icon: Briefcase },
      { title: 'کاندیداها', url: '/candidates', icon: Users },
      { title: 'وظایف', url: '/tasks', icon: CheckSquare },
      { title: 'پیشنهادها', url: '/offers', icon: DollarSign },
      { title: 'تنظیمات', url: '/settings', icon: تنظیمات },
    ];
  }
  
  const items = [
    ...baseItems,
    { title: 'موقعیت‌های شغلی', url: '/jobs', icon: Briefcase },
    { title: 'کاندیداها', url: '/candidates', icon: Users },
    { title: 'وظایف', url: '/tasks', icon: CheckSquare },
  ];
  
  if (isJobمدیر کل) {
    items.push({ title: 'پیشنهادها', url: '/offers', icon: DollarSign });
  }
  
  items.push({ title: 'تنظیمات', url: '/settings', icon: تنظیمات });
  
  return items;
};

interface برندینگData {
  platform_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userپروفایل, setUserپروفایل] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null);
  const [userنقشs, setUserنقشs] = useState<string[]>([]);
  const [isبازنشانیting, setIsبازنشانیting] = useState(false);
  const [branding, setبرندینگ] = useState<برندینگData>({
    platform_name: 'HiringPlatform',
    logo_url: null,
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
  });
  const isDemoUser = userپروفایل?.email === 'demo@hireflow.app';

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profileRes, rolesRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, email, avatar_url, org_id')
            .eq('id', user.id)
            .single(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
        ]);
        
        if (profileRes.data) {
          setUserپروفایل(profileRes.data);
          
          // Fetch organization branding
          const { data: orgData } = await supabase
            .from('organizations')
            .select('branding_json')
            .eq('id', profileRes.data.org_id)
            .single();
          
          if (orgData?.branding_json) {
            const brandingJson = orgData.branding_json as Record<string, unknown>;
            setبرندینگ({
              platform_name: (brandingJson.platform_name as string) || 'HiringPlatform',
              logo_url: (brandingJson.logo_url as string) || null,
              primary_color: (brandingJson.primary_color as string) || '#3B82F6',
              secondary_color: (brandingJson.secondary_color as string) || '#10B981',
            });
          }
        }
        
        if (rolesRes.data) {
          setUserنقشs(rolesRes.data.map(r => r.role));
        }
      }
    };
    
    fetchUserData();
    
    // Listen for branding updates from settings
    const handleبرندینگUpdate = (event: CustomEvent<برندینگData>) => {
      setبرندینگ(event.detail);
    };
    
    // Listen for profile updates from settings
    const handleپروفایلUpdate = (event: CustomEvent<{ full_name: string; avatar_url: string }>) => {
      setUserپروفایل(prev => prev ? {
        ...prev,
        full_name: event.detail.full_name,
        avatar_url: event.detail.avatar_url
      } : null);
    };
    
    window.addEventListener('branding-updated', handleبرندینگUpdate as EventListener);
    window.addEventListener('profile-updated', handleپروفایلUpdate as EventListener);
    
    return () => {
      window.removeEventListener('branding-updated', handleبرندینگUpdate as EventListener);
      window.removeEventListener('profile-updated', handleپروفایلUpdate as EventListener);
    };
  }, []);

  const getنقشBadge = () => {
    if (userنقشs.includes('site_admin')) {
      return <Badge variant="default" className="text-xs">مدیر کل</Badge>;
    }
    if (userنقشs.includes('job_admin')) {
      return <Badge variant="secondary" className="text-xs">مدیر شغل</Badge>;
    }
    return <Badge variant="outline" className="text-xs">همکار</Badge>;
  };

  const handleلوگوut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'خروج موفق',
        description: 'با موفقیت از حساب خود خارج شدید',
      });
      navigate('/auth/login');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleبازنشانیDemoData = async () => {
    if (!isDemoUser) return;
    
    setIsبازنشانیting(true);
    try {
      const { error } = await supabase.functions.invoke('reset-demo-data');
      
      if (error) throw error;
      
      toast({
        title: 'داده‌های آزمایشی بازنشانی شد',
        description: 'تمام محتوای آزمایشی با موفقیت بازنشانی شد. در حال بارگذاری مجدد...',
      });
      
      setزمانout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'بازنشانی داده‌های آزمایشی ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setIsبازنشانیting(false);
    }
  };

  const menuItems = getMenuItemsForنقش(userنقشs);

  return (
    <Sidebar className={open ? 'w-64' : 'w-16'} collapsible="icon" variant="floating">
      <SidebarContent className="px-3 py-4">
        <div className="px-3 py-2 mb-4">
          <div className="flex items-center gap-2">
            {branding.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt={branding.platform_name} 
                className={open ? "h-8 w-8 rounded object-contain" : "h-8 w-8 rounded object-contain"}
              />
            ) : (
              <div
                className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: branding.primary_color }}
              >
                {branding.platform_name.charAt(0).toUpperCase()}
              </div>
            )}
            {open && (
              <span className="font-semibold text-sidebar-foreground truncate">
                {branding.platform_name}
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isفعال = location.pathname === item.url || 
                  (item.url !== '/dashboard' && location.pathname.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isفعال={isفعال}>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-3 w-full hover:bg-accent rounded-lg transition-colors">
              <Avatar className="h-10 w-10 border border-[#45CE99]">
                <AvatarImage src={userپروفایل?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userپروفایل?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {open && (
                <div className="flex-1 text-right overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{userپروفایل?.full_name?.split(' ')[0] || 'کاربر'}</p>
                    {getنقشBadge()}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{userپروفایل?.email || ''}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-[#45CE99]">
                  <AvatarImage src={userپروفایل?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userپروفایل?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{userپروفایل?.full_name?.split(' ')[0] || 'کاربر'}</p>
                    {getنقشBadge()}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{userپروفایل?.email || ''}</p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="ml-2 h-4 w-4" />
              تنظیمات حساب
            </DropdownMenuItem>
            {isDemoUser && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleبازنشانیDemoData} disabled={isبازنشانیting}>
                  <به‌روزرسانیCw className={`ml-2 h-4 w-4 ${isبازنشانیting ? 'animate-spin' : ''}`} />
                  بازنشانی محتوای آزمایشی
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleلوگوut}>
              <LogOut className="ml-2 h-4 w-4" />
              خروج از حساب
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
