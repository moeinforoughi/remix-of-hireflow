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

interface HireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onتأیید: () => void;
}

export const HireDialog = ({ open, onOpenChange, onتأیید }: HireDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>Mark as Hired</AlertDialogعنوان>
          <AlertDialogDescription>
            This will mark the application as hired and move the candidate to the final stage. 
            Make sure an offer has been accepted before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogانصراف>انصراف</AlertDialogانصراف>
          <AlertDialogAction onClick={onتأیید}>
            Mark as Hired
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
