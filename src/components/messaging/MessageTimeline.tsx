import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Cardعنوان } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceگیرندهخیرw } from "date-fns";
import { Mail, Clock, CheckCircle, XCircle } from "lucide-react";

interface پیام {
  id: string;
  subject: string;
  to_addresses: string[];
  status: string;
  created_at: string;
  sent_at: string | null;
  sender_user_id: string;
  body_html: string;
}

interface پیامزمانlineProps {
  applicationId?: string;
  candidateId?: string;
}

export const پیامزمانline = ({ applicationId, candidateId }: پیامزمانlineProps) => {
  const [messages, setپیامs] = useState<پیام[]>([]);
  const [loading, setبارگذاری] = useState(true);

  useEffect(() => {
    fetchپیامs();

    // Set up realtime subscription for inserts and updates
    const channel = supabase
      .channel('message-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: applicationId 
            ? `application_id=eq.${applicationId}` 
            : candidateId 
            ? `candidate_id=eq.${candidateId}`
            : undefined,
        },
        (payload) => {
          setپیامs((current) => [payload.new as پیام, ...current]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: applicationId 
            ? `application_id=eq.${applicationId}` 
            : candidateId 
            ? `candidate_id=eq.${candidateId}`
            : undefined,
        },
        (payload) => {
          setپیامs((current) =>
            current.map((msg) =>
              msg.id === payload.new.id ? (payload.new as پیام) : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, candidateId]);

  const fetchپیامs = async () => {
    setبارگذاری(true);
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (applicationId) {
        query = query.eq("application_id", applicationId);
      } else if (candidateId) {
        query = query.eq("candidate_id", candidateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setپیامs(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setبارگذاری(false);
    }
  };

  const getوضعیتIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getوضعیتBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      failed: "destructive",
      queued: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Cardعنوان>پیام History</Cardعنوان>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">بارگذاری messages...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Cardعنوان>پیام History</Cardعنوان>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">خیر messages sent yet</p>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 min-h-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border-l-2 border-border pl-4 pb-4 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getوضعیتIcon(message.status)}
                      <h4 className="text-sm">{message.subject}</h4>
                    </div>
                    {getوضعیتBadge(message.status)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    گیرنده: {message.to_addresses.join(", ")}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    {message.sent_at
                      ? `ارسال شده ${formatDistanceگیرندهخیرw(new تاریخ(message.sent_at))} ago`
                      : `ایجادd ${formatDistanceگیرندهخیرw(new تاریخ(message.created_at))} ago`}
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-primary cursor-pointer hover:underline">
                      View content
                    </summary>
                    <div
                      className="mt-2 text-xs p-2 bg-muted rounded"
                      dangerouslySetInnerHTML={{ __html: message.body_html }}
                    />
                  </details>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
