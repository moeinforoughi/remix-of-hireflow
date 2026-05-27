import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { MapPin, Briefcase, جستجو, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

interface Job {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  openings: number;
  created_at: string;
}

const فرصت‌های شغلیHome = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [searchQuery, setجستجوQuery] = useState('');
  const [departmentفیلتر, setبخشفیلتر] = useState<string>('all');
  const [locationفیلتر, setمکانفیلتر] = useState<string>('all');
  const [employmentTypeفیلتر, setEmploymentTypeفیلتر] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, department, location, employment_type, openings, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setبارگذاری(false);
    }
  };

  const departments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));
  const locations = Array.from(new Set(jobs.map(j => j.location).filter(Boolean)));
  const employmentTypes = Array.from(new Set(jobs.map(j => j.employment_type)));

  const filteredJobs = jobs.filter((job) => {
    const matchesجستجو = 
      job.title.toکمerCase().includes(searchQuery.toکمerCase()) ||
      (job.department?.toکمerCase().includes(searchQuery.toکمerCase())) ||
      (job.location?.toکمerCase().includes(searchQuery.toکمerCase()));
    
    const matchesبخش = departmentفیلتر === 'all' || job.department === departmentفیلتر;
    const matchesمکان = locationفیلتر === 'all' || job.location === locationفیلتر;
    const matchesEmploymentType = employmentTypeفیلتر === 'all' || job.employment_type === employmentTypeفیلتر;

    return matchesجستجو && matchesبخش && matchesمکان && matchesEmploymentType;
  });

  const hasفعالفیلترs = searchQuery || departmentفیلتر !== 'all' || locationفیلتر !== 'all' || employmentTypeفیلتر !== 'all';

  const clearفیلترs = () => {
    setجستجوQuery('');
    setبخشفیلتر('all');
    setمکانفیلتر('all');
    setEmploymentTypeفیلتر('all');
  };

  const formatEmploymentType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl mb-4">Join Our Team</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover opportunities to grow your career with us
          </p>
          
          {/* فیلترs and جستجو */}
          <div className="max-w-4xl mx-auto space-y-4">
            {/* جستجو Bar */}
            <div className="relative">
              <جستجو className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="جستجو by job title, department, or location..."
                value={searchQuery}
                onChange={(e) => setجستجوQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* Dropdown فیلترs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <انتخاب value={departmentفیلتر} onValueChange={setبخشفیلتر}>
                <انتخابTrigger className="w-full sm:w-[200px] bg-background">
                  <انتخابValue placeholder="بخش" />
                </انتخابTrigger>
                <انتخابContent className="bg-background">
                  <انتخابItem value="all">All بخشs</انتخابItem>
                  {departments.map((dept) => (
                    <انتخابItem key={dept} value={dept!}>
                      {dept}
                    </انتخابItem>
                  ))}
                </انتخابContent>
              </انتخاب>

              <انتخاب value={locationفیلتر} onValueChange={setمکانفیلتر}>
                <انتخابTrigger className="w-full sm:w-[200px] bg-background">
                  <انتخابValue placeholder="مکان" />
                </انتخابTrigger>
                <انتخابContent className="bg-background">
                  <انتخابItem value="all">All مکانs</انتخابItem>
                  {locations.map((loc) => (
                    <انتخابItem key={loc} value={loc!}>
                      {loc}
                    </انتخابItem>
                  ))}
                </انتخابContent>
              </انتخاب>

              <انتخاب value={employmentTypeفیلتر} onValueChange={setEmploymentTypeفیلتر}>
                <انتخابTrigger className="w-full sm:w-[200px] bg-background">
                  <انتخابValue placeholder="نوع همکاری" />
                </انتخابTrigger>
                <انتخابContent className="bg-background">
                  <انتخابItem value="all">All Types</انتخابItem>
                  {employmentTypes.map((type) => (
                    <انتخابItem key={type} value={type}>
                      {formatEmploymentType(type)}
                    </انتخابItem>
                  ))}
                </انتخابContent>
              </انتخاب>

              {hasفعالفیلترs && (
                <Button variant="outline" onClick={clearفیلترs} className="bg-background">
                  <X className="h-4 w-4 mr-2" />
                  پاک کردن
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* موقعیت‌های شغلی */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl">
            باز Positions {filteredJobs.length > 0 && `(${filteredJobs.length})`}
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {hasفعالفیلترs ? 'خیر jobs match your filters.' : 'خیر open positions at this time.'}
              </p>
              {hasفعالفیلترs && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearفیلترs}
                >
                  پاک کردن فیلترs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/careers/jobs/${job.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Cardعنوان className="text-xl mb-2">{job.title}</Cardعنوان>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {job.department && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{job.department}</span>
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline">
                        {formatEmploymentType(job.employment_type)}
                      </Badge>
                      {job.openings > 1 && (
                        <Badge variant="secondary">
                          {job.openings} openings
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      منتشرشده {format(new تاریخ(job.created_at), 'MMM d, yyyy')}
                    </p>
                    <Button>ثبت درخواست خیرw</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 استخدامFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default فرصت‌های شغلیHome;
