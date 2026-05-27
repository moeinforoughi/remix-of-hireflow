import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogانصراف,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogعنوان,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface BulkRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onتأیید: (reason: string, note: string) => void;
  count: number;
}

const REJECTION_REASONS = [
  'Qualifications do not match',
  'Position filled',
  'Insufficient experience',
  'Cultural fit concerns',
  'Compensation mismatch',
  'Other',
];

export const BulkRejectDialog = ({ open, onOpenChange, onتأیید, count }: BulkRejectDialogProps) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const handleتأیید = () => {
    onتأیید(reason, note);
    setReason('');
    setNote('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>Reject {count} Application{count > 1 ? 's' : ''}</AlertDialogعنوان>
          <AlertDialogDescription>
            This will reject {count} selected application{count > 1 ? 's' : ''}. This action can be reversed later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Additional Notes (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional context..."
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogانصراف>انصراف</AlertDialogانصراف>
          <AlertDialogAction onClick={handleتأیید} disabled={!reason}>
            Reject {count} Application{count > 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
