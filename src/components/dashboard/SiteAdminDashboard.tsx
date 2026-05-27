import { Card, CardContent, CardHeader, Cardعنوان } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import بعدیMeetingCard from "@/components/dashboard/بعدیMeetingCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import listIcon from "@/assets/icons/list-icon.svg";
import usersIcon from "@/assets/icons/users-icon.svg";
import awardIcon from "@/assets/icons/award-icon.svg";
import thumbsUpIcon from "@/assets/icons/thumbs-up-icon.svg";
import { تأییدRequestedDialog } from "@/components/offers/تأییدRequestedDialog";
import { MetricCardSkeleton } from "@/components/dashboard/MetricCardSkeleton";
import { JobListingsTableSkeleton } from "@/components/dashboard/JobListingsTableSkeleton";
import { ایجادJobDialog } from "@/components/jobs/ایجادJobDialog";

export function Siteمدیر کلداشبورد() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [approvalDialogباز, setتأییدDialogباز] = useState(false);
  const [createJobDialogباز, setایجادJobDialogباز] = useState(false);
  const [isبارگذاریDemo, setIsبارگذاریDemo] = useState(() => {
    return sessionStorage.getItem('demo-reset-in-progress') === 'true';
  });
  const [metrics, setMetrics] = useState({
    currentListings: 0,
    totalApplicants: 0,
    jobمدیر کلs: 0,
    approvalRequested: 0,
  });

  useEffect(() => {
    const fetchData = async () => {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profileData) return;

      const orgId = profileData.org_id;

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, location, created_at, status')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);

      // Fetch team members
      const { data: teamData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('org_id', orgId);

      setTeamMembers(teamData || []);

      // Fetch metrics
      const { count: listingsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'open');

      const { count: applicantsCount } = await supabase
        .from('applications')
        .select('*, jobs!inner(org_id)', { count: 'exact', head: true })
        .eq('jobs.org_id', orgId);

      // Get profiles in org first, then count job admins among them
      const { data: orgپروفایلs } = await supabase
        .from('profiles')
        .select('id')
        .eq('org_id', orgId);

      const profileIds = orgپروفایلs?.map(p => p.id) || [];

      const { count: jobمدیر کلsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'job_admin')
        .in('user_id', profileIds);

      const { count: pendingتأییدsCount } = await supabase
        .from('approvals')
        .select('*, offers!inner(*, applications!inner(*, jobs!inner(*)))', { count: 'exact', head: true })
        .eq('state', 'pending')
        .eq('offers.applications.jobs.org_id', orgId);

      setMetrics({
        currentListings: listingsCount || 0,
        totalApplicants: applicantsCount || 0,
        jobمدیر کلs: jobمدیر کلsCount || 0,
        approvalRequested: pendingتأییدsCount || 0,
      });
    };

    // If demo reset in progress, wait for the event
    if (isبارگذاریDemo) {
      const handleDemoDataبه‌روزرسانی = () => {
        setIsبارگذاریDemo(false);
        fetchData();
      };
      window.addEventListener('demo-data-refreshed', handleDemoDataبه‌روزرسانی);
      return () => window.removeEventListener('demo-data-refreshed', handleDemoDataبه‌روزرسانی);
    } else {
      fetchData();
    }

    // Also listen for future demo data refresh events
    const handleDemoDataبه‌روزرسانی = () => {
      fetchData();
    };
    window.addEventListener('demo-data-refreshed', handleDemoDataبه‌روزرسانی);
    return () => window.removeEventListener('demo-data-refreshed', handleDemoDataبه‌روزرسانی);
  }, [isبارگذاریDemo]);

  const metricCards = [
    {
      title: "موقعیت‌های فعال",
      value: metrics.currentListings,
      bgColor: "bg-[#D4F4DD]",
      iconColor: "text-[#4A7C59]",
      hoverBorder: "hover:border-[#2E7D32]",
      link: "/jobs",
      icon: listIcon,
    },
    {
      title: "تعداد کل متقاضیان",
      value: metrics.totalApplicants,
      bgColor: "bg-[#FFE5CC]",
      iconColor: "text-[#CC7A3D]",
      hoverBorder: "hover:border-[#F57C00]",
      link: "/candidates",
      icon: usersIcon,
    },
    {
      title: "مدیران شغل",
      value: metrics.jobمدیر کلs,
      bgColor: "bg-[#CCE5FF]",
      iconColor: "text-[#3D7ACC]",
      hoverBorder: "hover:border-[#1976D2]",
      link: "/settings",
      icon: awardIcon,
    },
    {
      title: "در انتظار تأیید",
      value: metrics.approvalRequested,
      bgColor: "bg-[#FFD9E5]",
      iconColor: "text-[#CC5C7A]",
      hoverBorder: "hover:border-[#9E68F7]",
      link: "approval-dialog",
      icon: thumbsUpIcon,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">داشبورد</h1>
        </div>
        <Button onClick={() => setایجادJobDialogباز(true)}>
          <Plus className="mr-2 h-4 w-4" />
          ایجاد موقعیت جدید
        </Button>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {isبارگذاریDemo ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          metricCards.map((metric) => (
            <Card /* theme-exempt: decorative pastel cards */
              key={metric.title}
              className={`hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent ${metric.hoverBorder} ${metric.bgColor}`}
              onClick={() => metric.link === "approval-dialog" ? setتأییدDialogباز(true) : navigate(metric.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <img src={metric.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                  <Cardعنوان className="text-sm font-medium !text-black">{metric.title}</Cardعنوان>
                </div>
                <ChevronRight className={`h-4 w-4 ${metric.iconColor}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-4xl font-bold !text-black">{metric.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* مصاحبه بعدی and فعالیت‌های اخیر */}
      <div className="grid gap-6 md:grid-cols-2">
        <بعدیMeetingCard />
        <RecentActivityFeed />
      </div>

      {/* موقعیت‌های شغلی with Team Avatars */}
      {isبارگذاریDemo ? (
        <JobListingsTableSkeleton />
      ) : (
        <div className="bg-card rounded-xl overflow-hidden">
          <div className="p-4">
            <h2 className="text-sm font-[590] text-foreground">موقعیت‌های شغلی</h2>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {/* Column Headers */}
            <div className="px-4 flex items-center gap-8">
              <div className="w-[243px] text-xs text-muted-foreground">عنوان</div>
              <div className="flex-1 text-xs text-muted-foreground">مکان</div>
              <div className="flex-1 text-xs text-muted-foreground">تاریخ ایجاد</div>
              <div className="flex-1 text-xs text-muted-foreground">تیم تخصیص‌یافته</div>
              <div className="flex-1 text-xs text-muted-foreground">تعداد کاندیداها</div>
            </div>

            {/* Job Rows */}
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">هنوز هیچ موقعیتی ایجاد نشده</p>
            ) : (
              jobs.map((job: any) => (
                <div 
                  key={job.id}
                  className="relative p-4 bg-muted rounded-lg flex items-center gap-8 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="w-[243px] text-sm font-[590] text-foreground">{job.title}</div>
                  <div className="flex-1 text-sm text-muted-foreground">{job.location || 'دورکاری'}</div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    {new تاریخ(job.created_at).toLocaleتاریخString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="flex-1 flex items-center">
                    {job.job_acl?.slice(0, 5).map((acl: any, idx: number) => (
                      <div key={idx} className="w-6 h-6 p-0.5 -ml-1 first:ml-0">
                        <Avatar className="w-full h-full rounded-full ring-2 ring-muted">
                          <AvatarImage src={acl.profiles?.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {acl.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 text-sm font-bold text-primary">13</div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground absolute right-4" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <تأییدRequestedDialog 
        open={approvalDialogباز} 
        onبازChange={setتأییدDialogباز} 
      />

      <ایجادJobDialog
        open={createJobDialogباز}
        onبازChange={setایجادJobDialogباز}
        onSuccess={() => {
          setایجادJobDialogباز(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
