import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';

interface ردDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onتأیید: (reason: string, note: string) => void;
}

const REJECTION_REASONS = [
  'شرایط احراز not met',
  'Position filled',
  'Salary expectations mismatch',
  'Cultural fit concerns',
  'Other',
];

export const ردDialog = ({ open, onبازChange, onتأیید }: ردDialogProps) => {
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
          <AlertDialogعنوان>رد Application</AlertDialogعنوان>
          <AlertDialogتوضیحات>
            This will mark the application as rejected. This action can be reversed later if needed.
          </AlertDialogتوضیحات>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>ردion Reason</Label>
            <انتخاب value={reason} onValueChange={setReason}>
              <انتخابTrigger>
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
            <Label>افزودنitional خیرtes (اختیاری)</Label>
            <Textarea
              value={note}
              onChange={(e) => setخیرte(e.target.value)}
              placeholder="افزودن any additional context..."
              rows={4}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogانصراف>انصراف</AlertDialogانصراف>
          <AlertDialogAction onClick={handleتأیید} disabled={!reason}>
            رد Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
