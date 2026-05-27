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

interface تأییدDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onتأیید: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const تأییدDialog = ({
  open,
  onOpenChange,
  onتأیید,
  title,
  description,
  confirmText = 'Continue',
  cancelText = 'انصراف',
  variant = 'default',
}: تأییدDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>{title}</AlertDialogعنوان>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogانصراف>{cancelText}</AlertDialogانصراف>
          <AlertDialogAction
            onClick={onتأیید}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
