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

interface استخدامDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onتأیید: () => void;
}

export const استخدامDialog = ({ open, onبازChange, onتأیید }: استخدامDialogProps) => {
  return (
    <AlertDialog open={open} onبازChange={onبازChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>Mark as استخدامd</AlertDialogعنوان>
          <AlertDialogتوضیحات>
            This will mark the application as hired and move the candidate to the final stage. 
            Make sure an offer has been accepted before proceeding.
          </AlertDialogتوضیحات>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogانصراف>انصراف</AlertDialogانصراف>
          <AlertDialogAction onClick={onتأیید}>
            Mark as استخدامd
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
