import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, جستجو, X, ChevronRight, Briefcase } from 'lucide-react';
import { useگیرندهast } from '@/hooks/use-toast';
import {
  انتخاب,
  انتخابContent,
  انتخابItem,
  انتخابTrigger,
  انتخابValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Application {
  id: string;
  applied_at: string;
  state: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
    department: string;
  };
  current_stage?: {
    id: string;
    name: string;
  };
}

const درخواست‌هاList = () => {
  const [applications, setدرخواست‌ها] = useState<Application[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [searchQuery, setجستجوQuery] = useState('');
  const [statusفیلتر, setوضعیتفیلتر] = useState<string>('all');
  const [sortBy, setمرتب‌سازیBy] = useState<'date' | 'name'>('date');
  const navigate = useNavigate();
  const { toast } = useگیرندهast();

  useEffect(() => {
    fetchدرخواست‌ها();
  }, []);

  const fetchدرخواست‌ها = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          applied_at,
          state,
          candidate:candidates(id, full_name, email),
          job:jobs(id, title, department),
          current_stage:job_stages(id, name)
        `)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setدرخواست‌ها(data || []);
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

  const getStateBadgeColor = (state: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-50 text-blue-700 border-blue-300',
      hired: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      rejected: 'bg-rose-50 text-rose-700 border-rose-300',
      withdrawn: 'bg-slate-50 text-slate-700 border-slate-300',
    };
    return colors[state] || 'bg-slate-50 text-slate-700 border-slate-300';
  };

  const filteredدرخواست‌ها = applications
    .filter((app) => {
      // فیلتر out applications with missing candidate or job data
      if (!app.candidate || !app.job) return false;

      const matchesجستجو =
        app.candidate.full_name.toکمerCase().includes(searchQuery.toکمerCase()) ||
        app.candidate.email.toکمerCase().includes(searchQuery.toکمerCase()) ||
        app.job.title.toکمerCase().includes(searchQuery.toکمerCase());

      const matchesوضعیت = statusفیلتر === 'all' || app.state === statusفیلتر;

      return matchesجستجو && matchesوضعیت;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new تاریخ(b.applied_at).getزمان() - new تاریخ(a.applied_at).getزمان();
      } else {
        return a.candidate?.full_name.localeCompare(b.candidate?.full_name) || 0;
      }
    });

  const clearفیلترs = () => {
    setجستجوQuery('');
    setوضعیتفیلتر('all');
    setمرتب‌سازیBy('date');
  };

  const hasفعالفیلترs = searchQuery || statusفیلتر !== 'all' || sortBy !== 'date';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">درخواست‌ها</h1>
        </div>
        <Button onClick={() => navigate('/applications/new')}>
          <Plus className="h-4 w-4 mr-2" />
          درخواست جدید
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <جستجو className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجو by candidate name, email, or job title..."
            value={searchQuery}
            onChange={(e) => setجستجوQuery(e.target.value)}
            className="pl-10 bg-card border-input"
          />
        </div>

        <انتخاب value={statusفیلتر} onValueChange={setوضعیتفیلتر}>
          <انتخابTrigger className="w-full sm:w-[180px] bg-card">
            <انتخابValue placeholder="وضعیت" />
          </انتخابTrigger>
          <انتخابContent>
            <انتخابItem value="all">All وضعیتes</انتخابItem>
            <انتخابItem value="active">فعال</انتخابItem>
            <انتخابItem value="hired">استخدامd</انتخابItem>
            <انتخابItem value="rejected">ردed</انتخابItem>
            <انتخابItem value="withdrawn">پس گرفتنn</انتخابItem>
          </انتخابContent>
        </انتخاب>

        <انتخاب value={sortBy} onValueChange={(value: 'date' | 'name') => setمرتب‌سازیBy(value)}>
          <انتخابTrigger className="w-full sm:w-[180px] bg-card">
            <انتخابValue placeholder="مرتب‌سازی by" />
          </انتخابTrigger>
          <انتخابContent>
            <انتخابItem value="date">تاریخ (Newest)</انتخابItem>
            <انتخابItem value="name">Name (A-Z)</انتخابItem>
          </انتخابContent>
        </انتخاب>

        {hasفعالفیلترs && (
          <Button variant="outline" onClick={clearفیلترs}>
            <X className="h-4 w-4 mr-2" />
            پاک کردن
          </Button>
        )}
      </div>

      {filteredدرخواست‌ها.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg mb-2">خیر applications found</h3>
          <p className="text-muted-foreground mb-4">
            {hasفعالفیلترs ? 'Try adjusting your filters' : 'Get started by creating your first application'}
          </p>
          {!hasفعالفیلترs && (
            <Button onClick={() => navigate('/applications/new')}>
              <Plus className="h-4 w-4 mr-2" />
              درخواست جدید
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg p-4">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead>Candidate</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>بخش</TableHead>
                <TableHead>Current مرحله</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>ثبت درخواست شده تاریخ</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="space-y-1">
              {filteredدرخواست‌ها.map((app) => (
                <TableRow 
                  key={app.id}
                  className="cursor-pointer hover:bg-accent/50 border-0 mb-1"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderRadius: '8px',
                    display: 'table-row'
                  }}
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <TableCell className="font-medium rounded-l-lg">{app.candidate.full_name}</TableCell>
                  <TableCell>{app.candidate.email}</TableCell>
                  <TableCell className="text-blue-600 font-medium">{app.job.title}</TableCell>
                  <TableCell>{app.job.department || '-'}</TableCell>
                  <TableCell>{app.current_stage?.name || 'خیرt assigned'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getStateBadgeColor(app.state)}`}>
                      {app.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new تاریخ(app.applied_at).toLocaleتاریخString()}
                  </TableCell>
                  <TableCell className="rounded-r-lg">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default درخواست‌هاList;
