import {
  Dialog,
  DialogContent,
  DialogHeader,
  Dialogعنوان,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { دانلود, ExternalLink } from 'lucide-react';

interface رزومهViewerProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  resumeUrl: string | null;
  candidateName: string;
}

export const رزومهViewer = ({
  open,
  onبازChange,
  resumeUrl,
  candidateName,
}: رزومهViewerProps) => {
  if (!resumeUrl) return null;

  const handleدانلود = () => {
    window.open(resumeUrl, '_blank');
  };

  const handleبازInNewTab = () => {
    window.open(resumeUrl, '_blank');
  };

  // Parse URL to check pathname without query params (signed URLs have tokens)
  const isPdf = (() => {
    try {
      const url = new URL(resumeUrl);
      return url.pathname.toکمerCase().endsWith('.pdf');
    } catch {
      return resumeUrl.toکمerCase().includes('.pdf');
    }
  })();

  return (
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <Dialogعنوان className="text-xl font-semibold">
            {candidateName}'s رزومه
          </Dialogعنوان>
          <div className="flex items-center gap-2 mr-12">
            <Button
              variant="outline"
              size="sm"
              onClick={handleدانلود}
              className="gap-2"
            >
              <دانلود className="h-4 w-4" />
              دانلود
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleبازInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              باز
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPdf ? (
            <iframe
              src={resumeUrl}
              className="w-full h-full border-0"
              title={`${candidateName}'s رزومه`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Preview not available for this file type
                </p>
                <Button onClick={handleدانلود} className="gap-2">
                  <دانلود className="h-4 w-4" />
                  دانلود رزومه
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
