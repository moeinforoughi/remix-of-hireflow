import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, Dialogعنوان } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { کپی, Mail, Check, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  location: string | null;
  employment_type: string;
}

interface اشتراک‌گذاریJobDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  job: Job;
}

export function اشتراک‌گذاریJobDialog({ open, onبازChange, job }: اشتراک‌گذاریJobDialogProps) {
  const [copied, setکپی شد] = useState(false);
  const [sendingایمیل, setارسالingایمیل] = useState(false);
  const [emailData, setایمیلData] = useState({
    recipientایمیل: '',
    recipientName: '',
    message: '',
  });

  // Generate the public job posting URL
  const jobUrl = `${window.location.origin}/careers/jobs/${job.id}`;

  const handleکپیLink = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl);
      setکپی شد(true);
      toast({
        title: 'Link copied!',
        description: 'Job posting link copied to clipboard',
      });
      setزمانout(() => setکپی شد(false), 2000);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleارسالایمیل = async (e: React.FormEvent) => {
    e.preventDefault();
    setارسالingایمیل(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to share jobs');
      }

      const { error } = await supabase.functions.invoke('share-job', {
        body: {
          jobId: job.id,
          jobعنوان: job.title,
          jobUrl,
          recipientایمیل: emailData.recipientایمیل,
          recipientName: emailData.recipientName,
          senderپیام: emailData.message,
        },
      });

      if (error) throw error;

      toast({
        title: 'ایمیل sent!',
        description: `Job posting shared with ${emailData.recipientایمیل}`,
      });

      // بازنشانی form
      setایمیلData({
        recipientایمیل: '',
        recipientName: '',
        message: '',
      });
      onبازChange(false);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setارسالingایمیل(false);
    }
  };

  return (
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <Dialogعنوان className="text-2xl font-semibold">اشتراک‌گذاری موقعیت Posting</Dialogعنوان>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* کپی Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-4 w-4" />
              <span>اشتراک‌گذاریable Link</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={jobUrl}
                readOnly
                className="flex-1 bg-muted"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleکپیLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <کپی className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the job posting
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or share via email</span>
            </div>
          </div>

          {/* ایمیل Form Section */}
          <form onثبت={handleارسالایمیل} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              <span>ارسال via ایمیل</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientایمیل">Recipient ایمیل *</Label>
              <Input
                id="recipientایمیل"
                type="email"
                placeholder="colleague@company.com"
                value={emailData.recipientایمیل}
                onChange={(e) => setایمیلData({ ...emailData, recipientایمیل: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                type="text"
                placeholder="John Doe"
                value={emailData.recipientName}
                onChange={(e) => setایمیلData({ ...emailData, recipientName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal پیام (اختیاری)</Label>
              <Textarea
                id="message"
                placeholder="I thought you might be interested in this opportunity..."
                value={emailData.message}
                onChange={(e) => setایمیلData({ ...emailData, message: e.target.value })}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={sendingایمیل}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {sendingایمیل ? 'ارسالing...' : 'ارسال ایمیل'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
