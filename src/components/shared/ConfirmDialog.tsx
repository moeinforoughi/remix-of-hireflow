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

interface تأییدDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onتأیید: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const تأییدDialog = ({
  open,
  onبازChange,
  onتأیید,
  title,
  description,
  confirmText = 'ادامه',
  cancelText = 'انصراف',
  variant = 'default',
}: تأییدDialogProps) => {
  return (
    <AlertDialog open={open} onبازChange={onبازChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogعنوان>{title}</AlertDialogعنوان>
          <AlertDialogتوضیحات>{description}</AlertDialogتوضیحات>
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
