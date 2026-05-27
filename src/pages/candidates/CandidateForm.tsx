import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { Card, CardContent, Cardتوضیحات, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Fileبارگذاری } from '@/components/shared/Fileبارگذاری';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { parseرزومه } from '@/lib/resume-parser';

const CandidateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setبارگذاری] = useState(false);
  const [resumeFile, setرزومهFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    source: 'manual' as 'careers_site' | 'referral' | 'linkedin' | 'agency' | 'job_fair' | 'manual',
    consent: false,
  });

  useEffect(() => {
    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData({
        ...data,
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        linkedin_url: data.linkedin_url || '',
      });
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

      const candidateData = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        location: formData.location || null,
        linkedin_url: formData.linkedin_url || null,
        consent_at: formData.consent ? new تاریخ().toISOString() : null,
      };

      let candidateId = id;

      if (id) {
        const { error } = await supabase
          .from('candidates')
          .update(candidateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data: newCandidate, error } = await supabase
          .from('candidates')
          .insert({
            ...candidateData,
            org_id: profile.org_id,
          })
          .select()
          .single();

        if (error) throw error;
        candidateId = newCandidate.id;
      }

      // بارگذاری resume if provided
      if (resumeFile && candidateId) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${تاریخ.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${profile.org_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        // Store the storage path, not a public URL
        await supabase
          .from('attachments')
          .insert({
            org_id: profile.org_id,
            owner_type: 'candidate',
            owner_id: candidateId,
            file_url: filePath, // Store path for private bucket
            file_name: resumeFile.name,
            mime_type: resumeFile.type,
            size_bytes: resumeFile.size,
          });

        // Parse resume in the background - use the file path
        parseرزومه(filePath, candidateId).catch((error) => {
          console.error('رزومه parsing failed:', error);
        });
      }

      toast({
        title: 'موفقیت',
        description: id ? 'Candidate updated successfully' : 'Candidate added successfully',
      });

      navigate('/candidates');
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/candidates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl">{id ? 'ویرایش Candidate' : 'افزودن کاندیدای جدید'}</h1>
          <p className="text-muted-foreground">
            {id ? 'به‌روزرسانی candidate information' : 'افزودن a new candidate to your talent pool'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Cardعنوان>Candidate Information</Cardعنوان>
          <Cardتوضیحات>پایه details about the candidate</Cardتوضیحات>
        </CardHeader>
        <CardContent>
          <form onثبت={handleثبت} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">نام و نام خانوادگی *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">تلفن</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">مکان</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">لینکدین URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">منبع *</Label>
                <انتخاب
                  value={formData.source}
                  onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                >
                  <انتخابTrigger>
                    <انتخابValue />
                  </انتخابTrigger>
                  <انتخابContent>
                    <انتخابItem value="manual">Manual Entry</انتخابItem>
                    <انتخابItem value="careers_site">فرصت‌های شغلی Site</انتخابItem>
                    <انتخابItem value="referral">Referral</انتخابItem>
                    <انتخابItem value="linkedin">لینکدین</انتخابItem>
                    <انتخابItem value="agency">Agency</انتخابItem>
                    <انتخابItem value="job_fair">Job Fair</انتخابItem>
                  </انتخابContent>
                </انتخاب>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">رزومه (اختیاری)</Label>
              <Fileبارگذاری
                value={resumeFile}
                onChange={setرزومهFile}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => setFormData({ ...formData, consent: checked as boolean })}
              />
              <Label
                htmlFor="consent"
                className="text-sm font-normal cursor-pointer"
              >
                Candidate has given consent to process their data
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'در حال ذخیره...' : id ? 'به‌روزرسانی Candidate' : 'افزودن کاندیدا'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/candidates')}>
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateForm;
