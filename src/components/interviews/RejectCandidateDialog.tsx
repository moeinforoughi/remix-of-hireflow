import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Dialogتوضیحات,
  DialogFooter,
  DialogHeader,
  Dialogعنوان,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  انتخاب,
  انتخابContent,
  انتخابItem,
  انتخابTrigger,
  انتخابValue,
} from '@/components/ui/select';

interface ردCandidateDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onتأیید: (reason: string, notes: string) => void;
}

const REJECTION_REASONS = [
  { value: 'not_qualified', label: 'خیرt Qualified for Position' },
  { value: 'failed_technical', label: 'Failed Technical Assessment' },
  { value: 'cultural_fit', label: 'خیرt a Cultural Fit' },
  { value: 'communication_skills', label: 'Poor Communication مهارت‌ها' },
  { value: 'experience_mismatch', label: 'سابقه کار Mismatch' },
  { value: 'salary_expectations', label: 'Salary Expectations گیرندهo زیاد' },
  { value: 'availability', label: 'Availability Issues' },
  { value: 'other', label: 'Other' },
];

export const ردCandidateDialog = ({
  open,
  onبازChange,
  onتأیید,
}: ردCandidateDialogProps) => {
  const [reason, setReason] = useState('');
  const [notes, setخیرtes] = useState('');

  const handleتأیید = () => {
    if (reason) {
      onتأیید(reason, notes);
      setReason('');
      setخیرtes('');
    }
  };

  return (
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <Dialogعنوان>رد Candidate</Dialogعنوان>
          <Dialogتوضیحات>
            Please select a reason for rejecting this candidate and provide any additional notes.
          </Dialogتوضیحات>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">ردion Reason *</Label>
            <انتخاب value={reason} onValueChange={setReason}>
              <انتخابTrigger id="reason">
                <انتخابValue placeholder="انتخاب a reason" />
              </انتخابTrigger>
              <انتخابContent>
                {REJECTION_REASONS.map((r) => (
                  <انتخابItem key={r.value} value={r.value}>
                    {r.label}
                  </انتخابItem>
                ))}
              </انتخابContent>
            </انتخاب>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">افزودنitional خیرtes (اختیاری)</Label>
            <Textarea
              id="notes"
              placeholder="افزودن any additional context or notes..."
              value={notes}
              onChange={(e) => setخیرtes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onبازChange(false)}>
            انصراف
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleتأیید}
            disabled={!reason}
          >
            رد Candidate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
