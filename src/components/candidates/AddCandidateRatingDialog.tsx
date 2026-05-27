import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Dialogعنوان,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Starامتیاز } from './Starامتیاز';
import { supabase } from '@/integrations/supabase/client';
import { useگیرندهast } from '@/hooks/use-toast';

interface افزودنCandidateامتیازDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  candidateId: string;
  existingامتیاز?: {
    id: string;
    soft_skills: number;
    hard_skills: number;
    salary_match: number;
    culture_fit: number;
    experience: number;
    notes: string | null;
  } | null;
  onSuccess: () => void;
}

const RATING_CATEGORIES = [
  { key: 'soft_skills', label: 'Soft مهارت‌ها', description: 'Communication, teamwork, leadership' },
  { key: 'hard_skills', label: 'Hard مهارت‌ها', description: 'Technical abilities, expertise' },
  { key: 'salary_match', label: 'Salary Match', description: 'Expectations vs. budget alignment' },
  { key: 'culture_fit', label: 'Culture Fit', description: 'Values and team compatibility' },
  { key: 'experience', label: 'سابقه کار', description: 'Relevant background and history' },
] as const;

type امتیازKey = typeof RATING_CATEGORIES[number]['key'];

export const افزودنCandidateامتیازDialog = ({
  open,
  onبازChange,
  candidateId,
  existingامتیاز,
  onSuccess,
}: افزودنCandidateامتیازDialogProps) => {
  const { toast } = useگیرندهast();
  const [loading, setبارگذاری] = useState(false);
  const [ratings, setامتیازs] = useState<Record<امتیازKey, number>>({
    soft_skills: 3,
    hard_skills: 3,
    salary_match: 3,
    culture_fit: 3,
    experience: 3,
  });
  const [notes, setخیرtes] = useState('');

  useEffect(() => {
    if (existingامتیاز) {
      setامتیازs({
        soft_skills: existingامتیاز.soft_skills,
        hard_skills: existingامتیاز.hard_skills,
        salary_match: existingامتیاز.salary_match,
        culture_fit: existingامتیاز.culture_fit,
        experience: existingامتیاز.experience,
      });
      setخیرtes(existingامتیاز.notes || '');
    } else {
      setامتیازs({
        soft_skills: 3,
        hard_skills: 3,
        salary_match: 3,
        culture_fit: 3,
        experience: 3,
      });
      setخیرtes('');
    }
  }, [existingامتیاز, open]);

  const handleثبت = async () => {
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

      if (existingامتیاز) {
        const { error } = await supabase
          .from('candidate_ratings')
          .update({
            ...ratings,
            notes: notes || null,
          })
          .eq('id', existingامتیاز.id);

        if (error) throw error;
        toast({ title: 'امتیاز updated successfully' });
      } else {
        const { error } = await supabase
          .from('candidate_ratings')
          .insert({
            candidate_id: candidateId,
            user_id: user.id,
            org_id: profile.org_id,
            ...ratings,
            notes: notes || null,
          });

        if (error) throw error;
        toast({ title: 'امتیاز added successfully' });
      }

      onSuccess();
      onبازChange(false);
    } catch (error: any) {
      toast({
        title: 'Error saving rating',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  return (
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <Dialogعنوان>{existingامتیاز ? 'ویرایش امتیاز' : 'Rate Candidate'}</Dialogعنوان>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {RATING_CATEGORIES.map((category) => (
            <div key={category.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{category.label}</Label>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              <Starامتیاز
                value={ratings[category.key]}
                onChange={(value) => setامتیازs((prev) => ({ ...prev, [category.key]: value }))}
              />
            </div>
          ))}

          <div className="space-y-2 pt-2">
            <Label htmlFor="notes">خیرtes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setخیرtes(e.target.value)}
              placeholder="افزودنitional comments about this candidate..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onبازChange(false)}>
            انصراف
          </Button>
          <Button onClick={handleثبت} disabled={loading}>
            {loading ? 'در حال ذخیره...' : existingامتیاز ? 'به‌روزرسانی' : 'ذخیره امتیاز'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
