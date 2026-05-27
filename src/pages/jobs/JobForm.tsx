import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { Card, CardContent, Cardتوضیحات, CardHeader, Cardعنوان } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomسؤالsManager } from '@/components/jobs/CustomسؤالsManager';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setبارگذاری] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employment_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'internship',
    description_md: '',
    requirements_md: '',
    openings: 1,
    status: 'draft' as 'draft' | 'pending_approval' | 'open' | 'paused' | 'closed' | 'filled',
    required_skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleثبت = async (e: React.FormEvent) => {
    e.preventDefault();
    setبارگذاری(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('خیرt authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('پروفایل not found');

      if (id) {
        const { error } = await supabase
          .from('jobs')
          .update(formData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'موفقیت',
          description: 'Job updated successfully',
        });
      } else {
        const { data: newJob, error } = await supabase
          .from('jobs')
          .insert({
            ...formData,
            org_id: profile.org_id,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // افزودن creator to job_acl with full permissions
        if (newJob) {
          const { error: aclError } = await supabase
            .from('job_acl')
            .insert({
              job_id: newJob.id,
              user_id: user.id,
              can_view: true,
              can_move_pipeline: true,
              can_message: true,
              can_view_offer: true,
            });

          if (aclError) {
            console.error('Error adding creator to job ACL:', aclError);
          }
        }

        toast({
          title: 'موفقیت',
          description: 'Job created successfully',
        });
      }

      navigate('/jobs');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl">{id ? 'ویرایش Job' : 'ایجاد موقعیت جدید'}</h1>
          <p className="text-muted-foreground">
            {id ? 'به‌روزرسانی job details' : 'Fill in the details to post a new job'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Job Details</TabsTrigger>
          {id && <TabsTrigger value="questions">سؤالات سفارشی</TabsTrigger>}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <Cardعنوان>Job Information</Cardعنوان>
              <Cardتوضیحات>پایه details about the position</Cardتوضیحات>
            </CardHeader>
            <CardContent>
              <form onثبت={handleثبت} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job عنوان *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Frontend Developer"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">بخش</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Engineering"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">مکان</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA / دورکاری"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employment_type">نوع همکاری *</Label>
                    <انتخاب
                      value={formData.employment_type}
                      onValueChange={(value: any) => setFormData({ ...formData, employment_type: value })}
                    >
                      <انتخابTrigger>
                        <انتخابValue />
                      </انتخابTrigger>
                      <انتخابContent>
                        <انتخابItem value="full_time">تمام‌وقت</انتخابItem>
                        <انتخابItem value="part_time">نیمه‌وقت</انتخابItem>
                        <انتخابItem value="contract">قراردادی</انتخابItem>
                        <انتخابItem value="internship">کارآموزی</انتخابItem>
                      </انتخابContent>
                    </انتخاب>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openings">Number of بازings *</Label>
                    <Input
                      id="openings"
                      type="number"
                      min="1"
                      value={formData.openings}
                      onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">وضعیت *</Label>
                    <انتخاب
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <انتخابTrigger>
                        <انتخابValue />
                      </انتخابTrigger>
                      <انتخابContent>
                        <انتخابItem value="draft">پیش‌نویس</انتخابItem>
                        <انتخابItem value="pending_approval">در انتظار تأیید</انتخابItem>
                        <انتخابItem value="open">باز</انتخابItem>
                        <انتخابItem value="paused">وقفهd</انتخابItem>
                        <انتخابItem value="closed">بستنd</انتخابItem>
                      </انتخابContent>
                    </انتخاب>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">شرح شغل</Label>
                  <Textarea
                    id="description"
                    value={formData.description_md}
                    onChange={(e) => setFormData({ ...formData, description_md: e.target.value })}
                    placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="required_skills">اجباری مهارت‌ها</Label>
                  <div className="flex gap-2">
                    <Input
                      id="required_skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="e.g. React, TypeScript, CSS"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
                            setFormData({ ...formData, required_skills: [...formData.required_skills, skillInput.trim()] });
                            setSkillInput('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
                          setFormData({ ...formData, required_skills: [...formData.required_skills, skillInput.trim()] });
                          setSkillInput('');
                        }
                      }}
                    >
                      افزودن
                    </Button>
                  </div>
                  {formData.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.required_skills.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
                        >
                          <span className="text-sm">{skill}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                required_skills: formData.required_skills.filter((_, i) => i !== index)
                              });
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">نیازمندی‌ها</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements_md}
                    onChange={(e) => setFormData({ ...formData, requirements_md: e.target.value })}
                    placeholder="List the required skills, experience, and qualifications..."
                    rows={6}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'در حال ذخیره...' : id ? 'به‌روزرسانی Job' : 'ایجاد Job'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
                    انصراف
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {id && (
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <Cardعنوان>Application سؤالs</Cardعنوان>
                <Cardتوضیحات>
                  Customize your application form with additional questions
                </Cardتوضیحات>
              </CardHeader>
              <CardContent>
                <CustomسؤالsManager jobId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default JobForm;
