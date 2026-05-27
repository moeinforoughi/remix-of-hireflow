import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { انتخاب, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomQuestionsManager } from '@/components/jobs/CustomQuestionsManager';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setUpload] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpload(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      setUpload(false);
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
              <CardTitle>Job Information</CardTitle>
              <CardDescription>پایه details about the position</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">تمام‌وقت</SelectItem>
                        <SelectItem value="part_time">نیمه‌وقت</SelectItem>
                        <SelectItem value="contract">قراردادی</SelectItem>
                        <SelectItem value="internship">کارآموزی</SelectItem>
                      </SelectContent>
                    </انتخاب>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openings">Number of Openings *</Label>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">پیش‌نویس</SelectItem>
                        <SelectItem value="pending_approval">در انتظار تأیید</SelectItem>
                        <SelectItem value="open">باز</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
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
                <CardTitle>Application Questions</CardTitle>
                <CardDescription>
                  Customize your application form with additional questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomQuestionsManager jobId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default JobForm;
