import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { پایهDashboard } from "@/components/dashboard/پایهDashboard";
import { Jobمدیر کلDashboard } from "@/components/dashboard/Jobمدیر کلDashboard";
import { Siteمدیر کلDashboard } from "@/components/dashboard/Siteمدیر کلDashboard";

const Dashboard = () => {
  const [userنقش, setUserنقش] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserنقش = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesData && rolesData.length > 0) {
        // Prioritize site_admin > job_admin > basic
        if (rolesData.some(r => r.role === 'site_admin')) {
          setUserنقش('site_admin');
        } else if (rolesData.some(r => r.role === 'job_admin')) {
          setUserنقش('job_admin');
        } else {
          setUserنقش('basic');
        }
      } else {
        setUserنقش('basic');
      }
      
      setLoading(false);
    };

    fetchUserنقش();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">در حال بارگذاری...</div>
      </div>
    );
  }

  // Render different dashboard based on role
  if (userنقش === 'site_admin') {
    return <Siteمدیر کلDashboard />;
  }

  if (userنقش === 'job_admin') {
    return <Jobمدیر کلDashboard />;
  }

  return <پایهDashboard />;
};

export default Dashboard;
