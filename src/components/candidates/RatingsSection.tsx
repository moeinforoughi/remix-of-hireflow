import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Starامتیاز } from './Starامتیاز';
import { افزودنCandidateامتیازDialog } from './افزودنCandidateامتیازDialog';
import { format } from 'date-fns';

interface Candidateامتیاز {
  id: string;
  soft_skills: number;
  hard_skills: number;
  salary_match: number;
  culture_fit: number;
  experience: number;
  notes: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface امتیازsSectionProps {
  candidateId: string;
}

const CATEGORIES = [
  { key: 'soft_skills', label: 'Soft مهارت‌ها' },
  { key: 'hard_skills', label: 'Hard مهارت‌ها' },
  { key: 'salary_match', label: 'Salary Match' },
  { key: 'culture_fit', label: 'Culture Fit' },
  { key: 'experience', label: 'سابقه کار' },
] as const;

type امتیازKey = typeof CATEGORIES[number]['key'];

export const امتیازsSection = ({ candidateId }: امتیازsSectionProps) => {
  const [ratings, setامتیازs] = useState<Candidateامتیاز[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [dialogباز, setDialogباز] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingامتیاز, setویرایشingامتیاز] = useState<Candidateامتیاز | null>(null);

  useEffect(() => {
    fetchامتیازs();
    fetchCurrentUser();
  }, [candidateId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchامتیازs = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_ratings')
        .select(`
          id,
          soft_skills,
          hard_skills,
          salary_match,
          culture_fit,
          experience,
          notes,
          created_at,
          user:profiles!candidate_ratings_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setامتیازs((data as any) || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setبارگذاری(false);
    }
  };

  const calculateAverage = (key: امتیازKey): number => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r[key], 0);
    return sum / ratings.length;
  };

  const userامتیاز = ratings.find(r => r.user.id === currentUserId);

  const handleافزودنOrویرایش = () => {
    if (userامتیاز) {
      setویرایشingامتیاز(userامتیاز);
    } else {
      setویرایشingامتیاز(null);
    }
    setDialogباز(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Cardعنوان className="text-lg">امتیازs</Cardعنوان>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">بارگذاری ratings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Cardعنوان className="text-lg">امتیازs</Cardعنوان>
          <Button size="sm" variant="outline" onClick={handleافزودنOrویرایش}>
            {userامتیاز ? (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                ویرایش
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Rate
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratings.length === 0 ? (
            <p className="text-sm text-muted-foreground">خیر ratings yet. Be the first to rate this candidate.</p>
          ) : (
            <>
              {/* Average Scores */}
              <div className="space-y-2 pb-3 border-b">
                <p className="text-sm font-medium text-muted-foreground">Average Scores</p>
                {CATEGORIES.map((cat) => {
                  const avg = calculateAverage(cat.key);
                  return (
                    <div key={cat.key} className="flex items-center justify-between">
                      <span className="text-sm">{cat.label}</span>
                      <div className="flex items-center gap-2">
                        <Starامتیاز value={Math.round(avg)} readonly size="sm" />
                        <span className="text-xs text-muted-foreground w-8">({avg.toFixed(1)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Individual امتیازs */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Individual امتیازs</p>
                {ratings.map((rating) => (
                  <div key={rating.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={rating.user.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {rating.user.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{rating.user.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new تاریخ(rating.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {CATEGORIES.map((cat) => (
                        <div key={cat.key} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{cat.label}:</span>
                          <Starامتیاز value={rating[cat.key]} readonly size="sm" />
                        </div>
                      ))}
                    </div>
                    {rating.notes && (
                      <p className="text-xs text-muted-foreground italic pt-1 border-t">
                        "{rating.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <افزودنCandidateامتیازDialog
        open={dialogباز}
        onبازChange={setDialogباز}
        candidateId={candidateId}
        existingامتیاز={editingامتیاز}
        onSuccess={fetchامتیازs}
      />
    </>
  );
};
