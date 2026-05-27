import { useState } from 'react';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { ردCandidateDialog } from './ردCandidateDialog';

interface InterviewتصمیمProps {
  scorecards: Array<{
    recommendation: string;
    user: { full_name: string };
  }>;
  interviewوضعیت: string;
  applicationState: string;
  onAdvance: () => void;
  onرد: (reason: string, notes: string) => void;
}

export const Interviewتصمیم = ({ 
  scorecards, 
  interviewوضعیت,
  applicationState,
  onAdvance,
  onرد 
}: InterviewتصمیمProps) => {
  const [showردDialog, setنمایشردDialog] = useState(false);

  const handleرد = (reason: string, notes: string) => {
    onرد(reason, notes);
    setنمایشردDialog(false);
  };

  if (scorecards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Cardعنوان>Interview تصمیم</Cardعنوان>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <p>Waiting for scorecards to be submitted</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate recommendation counts
  const recommendations = {
    advance: scorecards.filter(s => s.recommendation === 'advance').length,
    hold: scorecards.filter(s => s.recommendation === 'hold').length,
    no: scorecards.filter(s => s.recommendation === 'no').length,
  };

  const totalScores = scorecards.length;
  const majorityتوصیه = 
    recommendations.advance > recommendations.no ? 'advance' :
    recommendations.no > recommendations.advance ? 'reject' : 'mixed';

  return (
    <Card>
      <CardHeader>
        <Cardعنوان>Interview تصمیم</Cardعنوان>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="">فرم ارزیابی Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {recommendations.advance}
              </div>
              <div className="text-sm text-muted-foreground">Advance</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {recommendations.hold}
              </div>
              <div className="text-sm text-muted-foreground">Hold</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {recommendations.no}
              </div>
              <div className="text-sm text-muted-foreground">Do خیرt Advance</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalScores} scorecard{totalScores !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {interviewوضعیت === 'completed' && applicationState === 'active' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Recommended Action:</span>
              {majorityتوصیه === 'advance' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Move to بعدی مرحله
                </Badge>
              )}
              {majorityتوصیه === 'reject' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Do خیرt Advance
                </Badge>
              )}
              {majorityتوصیه === 'mixed' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Mixed Reviews - Needs Discussion
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onAdvance} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Advance Candidate
              </Button>
              <Button onClick={() => setنمایشردDialog(true)} variant="destructive" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                رد Candidate
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ردCandidateDialog
        open={showردDialog}
        onبازChange={setنمایشردDialog}
        onتأیید={handleرد}
      />
    </Card>
  );
};
