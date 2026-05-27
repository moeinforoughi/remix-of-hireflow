import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useگیرندهast } from '@/hooks/use-toast';
import { ArrowLeft, Star } from 'lucide-react';

const RATING_CATEGORIES = [
  { key: 'technical_skills', label: 'Technical مهارت‌ها' },
  { key: 'communication', label: 'Communication' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'culture_fit', label: 'Culture Fit' },
  { key: 'experience', label: 'Relevant سابقه کار' },
];

const فرم ارزیابیForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useگیرندهast();
  const [recommendation, setتوصیه] = useState('');
  const [ratings, setامتیازs] = useState<Record<string, { score: number; comment: string }>>({});
  const [overallخیرtes, setOverallخیرtes] = useState('');
  const [submitting, setثبتting] = useState(false);

  const handleامتیازChange = (category: string, score: number) => {
    setامتیازs((prev) => ({
      ...prev,
      [category]: { score, comment: prev[category]?.comment || '' },
    }));
  };

  const handleنظرChange = (category: string, comment: string) => {
    setامتیازs((prev) => ({
      ...prev,
      [category]: { score: prev[category]?.score || 0, comment },
    }));
  };

  const handleثبت = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recommendation) {
      toast({
        title: 'توصیه اجباری',
        description: 'Please select a recommendation',
        variant: 'destructive',
      });
      return;
    }

    setثبتting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('خیرt authenticated');

      const { error } = await supabase.from('scorecards').insert([{
        interview_id: id!,
        user_id: user.id,
        recommendation: recommendation as 'advance' | 'hold' | 'no',
        ratings_json: ratings as any,
        notes: overallخیرtes,
        submitted_at: new تاریخ().toISOString(),
      }]);

      if (error) throw error;

      toast({
        title: 'فرم ارزیابی ثبتted',
        description: 'Your interview feedback has been recorded.',
      });

      navigate(`/interviews/${id}`);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setثبتting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/interviews/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl">Interview فرم ارزیابی</h1>
      </div>

      <form onثبت={handleثبت} className="space-y-6">
        <Card>
          <CardHeader>
            <Cardعنوان>امتیاز Categories</Cardعنوان>
          </CardHeader>
          <CardContent className="space-y-6">
            {RATING_CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-3">
                <Label>{category.label}</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleامتیازChange(category.key, score)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          (ratings[category.key]?.score || 0) >= score
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground hover:text-primary'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {ratings[category.key]?.score || 0}/5
                  </span>
                </div>
                <Textarea
                  placeholder="افزودن comments about this area..."
                  value={ratings[category.key]?.comment || ''}
                  onChange={(e) => handleنظرChange(category.key, e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Cardعنوان>توصیه</Cardعنوان>
          </CardHeader>
          <CardContent>
            <RadioGroup value={recommendation} onValueChange={setتوصیه}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advance" id="advance" />
                <Label htmlFor="advance" className="font-normal">
                  Advance - Move to next round
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hold" id="hold" />
                <Label htmlFor="hold" className="font-normal">
                  Hold - Need more information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="font-normal">
                  Do خیرt Advance
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Cardعنوان>Overall خیرtes</Cardعنوان>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Provide overall feedback about the candidate..."
              value={overallخیرtes}
              onChange={(e) => setOverallخیرtes(e.target.value)}
              rows={6}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'ثبتting...' : 'ثبت فرم ارزیابی'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/interviews/${id}`)}
          >
            انصراف
          </Button>
        </div>
      </form>
    </div>
  );
};

export default فرم ارزیابیForm;
