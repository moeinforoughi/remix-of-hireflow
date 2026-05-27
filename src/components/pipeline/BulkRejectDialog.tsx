import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogانصراف,
  AlertDialogContent,
  AlertDialogتوضیحات,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogعنوان,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  انتخاب,
  انتخابContent,
  انتخابItem,
  انتخابTrigger,
  انتخابValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface BulkردDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onتأیید: (reason: string, note: string) => void;
  count: number;
}

const REJECTION_REASONS = [
  'شرایط احراز do not match',
  'Position filled',
  'Insufficient experience',
  'Cultural fit concerns',
  'Compensation mismatch',
  'Other',
];

export const BulkردDialog = ({ open, onبازChange, onتأیید, count }: BulkردDialogProps) => {
  const [reason, setReason] = useState('');
  const [note, setخیرte] = useState('');

  const handleتأیید = () => {
    onتأیید(reason, note);
    setReason('');
    setخیرte('');
  };

  return (
    <AlertDialog open={open} onبازChange={onبازChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>رد {count} Application{count > 1 ? 's' : ''}</AlertDialogعنوان>
          <AlertDialogتوضیحات>
            This will reject {count} selected application{count > 1 ? 's' : ''}. This action can be reversed later if needed.
          </AlertDialogتوضیحات>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">ردion Reason *</Label>
            <انتخاب value={reason} onValueChange={setReason}>
              <انتخابTrigger id="reason">
                <انتخابValue placeholder="انتخاب a reason" />
              </انتخابTrigger>
              <انتخابContent>
                {REJECTION_REASONS.map((r) => (
                  <انتخابItem key={r} value={r}>
                    {r}
                  </انتخابItem>
                ))}
              </انتخابContent>
            </انتخاب>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">افزودنitional خیرtes (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setخیرte(e.target.value)}
              placeholder="افزودن any additional context..."
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogانصراف>انصراف</AlertDialogانصراف>
          <AlertDialogAction onClick={handleتأیید} disabled={!reason}>
            رد {count} Application{count > 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
