import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const CareersHome = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [searchQuery, setجستجوQuery] = useState('');
  const [departmentفیلتر, setDepartmentفیلتر] = useState<string>('all');
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
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.department?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.location?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDepartment = departmentفیلتر === 'all' || job.department === departmentفیلتر;
    const matchesمکان = locationفیلتر === 'all' || job.location === locationفیلتر;
    const matchesEmploymentType = employmentTypeفیلتر === 'all' || job.employment_type === employmentTypeفیلتر;

    return matchesجستجو && matchesDepartment && matchesمکان && matchesEmploymentType;
  });

  const hasActiveفیلترs = searchQuery || departmentفیلتر !== 'all' || locationفیلتر !== 'all' || employmentTypeفیلتر !== 'all';

  const clearفیلترs = () => {
    setجستجوQuery('');
    setDepartmentفیلتر('all');
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
              <Select value={departmentفیلتر} onValueChange={setDepartmentفیلتر}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept!}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationفیلتر} onValueChange={setمکانفیلتر}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                  <SelectValue placeholder="مکان" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All مکانs</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc!}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={employmentTypeفیلتر} onValueChange={setEmploymentTypeفیلتر}>
                <SelectTrigger className="w-full sm:w-[200px] bg-background">
                  <SelectValue placeholder="Employment Type" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Types</SelectItem>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatEmploymentType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveفیلترs && (
                <Button variant="outline" onClick={clearفیلترs} className="bg-background">
                  <X className="h-4 w-4 mr-2" />
                  Clear
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
            Open Positions {filteredJobs.length > 0 && `(${filteredJobs.length})`}
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {hasActiveفیلترs ? 'No jobs match your filters.' : 'No open positions at this time.'}
              </p>
              {hasActiveفیلترs && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearفیلترs}
                >
                  Clear فیلترs
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
                      Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
                    </p>
                    <Button>Apply Now</Button>
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
          <p>© 2025 HireFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default CareersHome;
