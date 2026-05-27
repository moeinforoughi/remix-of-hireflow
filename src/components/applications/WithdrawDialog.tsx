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

interface پس گرفتنDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onتأیید: () => void;
}

export const پس گرفتنDialog = ({ open, onبازChange, onتأیید }: پس گرفتنDialogProps) => {
  return (
    <AlertDialog open={open} onبازChange={onبازChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>پس گرفتن Application</AlertDialogعنوان>
          <AlertDialogتوضیحات>
            This will mark the application as withdrawn by the candidate. This action can be reversed later if needed.
          </AlertDialogتوضیحات>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogانصراف>انصراف</AlertDialogانصراف>
          <AlertDialogAction onClick={onتأیید}>
            پس گرفتن Application
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
