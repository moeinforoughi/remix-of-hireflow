import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NextMeetingCard from "@/components/dashboard/NextMeetingCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import listIcon from "@/assets/icons/list-icon.svg";
import usersIcon from "@/assets/icons/users-icon.svg";
import messageIcon from "@/assets/icons/message-icon.svg";
import checkVerifiedIcon from "@/assets/icons/check-verified-icon.svg";
import { MetricCardSkeleton } from "@/components/dashboard/MetricCardSkeleton";
import { TasksCardSkeleton } from "@/components/dashboard/TasksCardSkeleton";
import { JobListingsCardSkeleton } from "@/components/dashboard/JobListingsCardSkeleton";

export function JobAdminDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isUploadDemo, setIsUploadDemo] = useState(() => {
    return sessionStorage.getItem('demo-reset-in-progress') === 'true';
  });
  const [metrics, setMetrics] = useState({
    currentListings: 0,
    totalApplicants: 0,
    interviewing: 0,
    shortlisted: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch assigned jobs
      const { data: aclData } = await supabase
        .from('job_acl')
        .select('job_id, jobs(*)')
        .eq('user_id', user.id)
        .eq('can_view', true);

      const assignedJobs = aclData?.map(acl => acl.jobs).filter(Boolean) || [];
      setJobs(assignedJobs as any);

      const jobIds = assignedJobs.map((j: any) => j.id);

      // Fetch tasks
      if (jobIds.length > 0) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*, candidates(full_name)')
          .order('due_date', { ascending: true })
          .limit(10);

        setTasks(tasksData || []);

        // Fetch metrics
        const { data: allApplications } = await supabase
          .from('applications')
          .select('id, state, current_stage_id, job_stages(type)')
          .in('job_id', jobIds);

        const activeApplications = allApplications?.filter(a => a.state === 'active') || [];
        const interviewing = activeApplications.filter(a => 
          ['phone', 'onsite'].includes(a.job_stages?.type || '')
        ).length;
        const shortlisted = activeApplications.filter(a => 
          a.job_stages?.type === 'offer'
        ).length;

        setMetrics({
          currentListings: assignedJobs.length,
          totalApplicants: allApplications?.length || 0,
          interviewing,
          shortlisted,
        });
      }
    };

    // If demo reset in progress, wait for the event
    if (isUploadDemo) {
      const handleDemoDataRefresh = () => {
        setIsUploadDemo(false);
        fetchData();
      };
      window.addEventListener('demo-data-refreshed', handleDemoDataRefresh);
      return () => window.removeEventListener('demo-data-refreshed', handleDemoDataRefresh);
    } else {
      fetchData();
    }

    // Also listen for future demo data refresh events
    const handleDemoDataRefresh = () => {
      fetchData();
    };
    window.addEventListener('demo-data-refreshed', handleDemoDataRefresh);
    return () => window.removeEventListener('demo-data-refreshed', handleDemoDataRefresh);
  }, [isUploadDemo]);

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
      title: "در حال مصاحبه",
      value: metrics.interviewing,
      bgColor: "bg-[#CCE5FF]",
      iconColor: "text-[#3D7ACC]",
      hoverBorder: "hover:border-[#1976D2]",
      link: "/interviews",
      icon: messageIcon,
    },
    {
      title: "نهایی‌شده",
      value: metrics.shortlisted,
      bgColor: "bg-[#FFD9E5]",
      iconColor: "text-[#CC5C7A]",
      hoverBorder: "hover:border-[#C2185B]",
      link: "/candidates",
      icon: checkVerifiedIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">داشبورد</h1>
        </div>
        <Button onClick={() => navigate('/jobs/new')}>
          <Plus className="mr-2 h-4 w-4" />
          ایجاد موقعیت جدید
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {isUploadDemo ? (
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
              onClick={() => navigate(metric.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <img src={metric.icon} alt="" className="w-4 h-4 flex-shrink-0" />
                  <CardTitle className="text-sm font-medium !text-black">{metric.title}</CardTitle>
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

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        {/* وظایف */}
        {isUploadDemo ? (
          <TasksCardSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>وظایف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">وظیفه‌ای در انتظار نیست</p>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="p-3 rounded-lg bg-[#D4F4DD] hover:bg-[#C0E8CC] transition-colors cursor-pointer"
                    onClick={() => navigate(`/candidates/${task.candidate_id}`)}
                  >
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'امروز'} • {task.due_date ? format(new Date(task.due_date), 'h:mm a') : '12:30 PM'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* موقعیت‌های شغلی */}
        {isUploadDemo ? (
          <JobListingsCardSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>موقعیت‌های شغلی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div>عنوان</div>
                  <div>مکان</div>
                  <div>تاریخ ایجاد</div>
                  <div className="text-right">تعداد کاندیداها</div>
              </div>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">هیچ شغلی به شما اختصاص داده نشده</p>
              ) : (
                jobs.slice(0, 8).map((job: any) => (
                  <div 
                    key={job.id}
                    className="grid grid-cols-4 gap-4 text-sm py-3 hover:bg-accent rounded-lg px-2 cursor-pointer transition-colors items-center"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="font-medium">{job.title}</div>
                    <div className="text-muted-foreground">{job.location || 'دورکاری'}</div>
                    <div className="text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-primary font-semibold">
                        13
                      </Badge>
                      <ChevronRight className="h-4 w-4 inline ml-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* بعدی Meeting and فعالیت‌های اخیر */}
      <div className="grid gap-6 md:grid-cols-2">
        <NextMeetingCard />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
