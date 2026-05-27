import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, Cardعنوان } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useگیرندهast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import { formatDistanceگیرندهخیرw } from "date-fns";

interface تأیید {
  id: string;
  approver_user_id: string;
  state: string;
  comment: string | null;
  acted_at: string | null;
  created_at: string;
  approver: {
    full_name: string;
    email: string;
  };
}

interface پروفایل {
  id: string;
  full_name: string;
  email: string;
}

interface تأییدSectionProps {
  offerId: string;
  offerState: string;
  onتأییدChange?: () => void;
}

export const تأییدSection = ({ offerId, offerState, onتأییدChange }: تأییدSectionProps) => {
  const { toast } = useگیرندهast();
  const [approvals, setتأییدs] = useState<تأیید[]>([]);
  const [profiles, setپروفایلs] = useState<پروفایل[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [selectedتأییدr, setانتخابedتأییدr] = useState("");
  const [actionنظر, setActionنظر] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [pendingOffers, setدر انتظارOffers] = useState<any[]>([]);

  useEffect(() => {
    fetchتأییدs();
    fetchپروفایلs();
    getCurrentUser();
    fetchدر انتظارOffers();
  }, [offerId]);

  const fetchدر انتظارOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("approvals")
        .select(`
          id,
          offer_id,
          state,
          offers (
            id,
            base_amount,
            variable_amount,
            currency,
            state,
            created_at,
            application:applications (
              candidate:candidates (
                full_name,
                email
              ),
              job:jobs (
                title
              )
            )
          )
        `)
        .eq("approver_user_id", user.id)
        .eq("state", "pending")
        .neq("offer_id", offerId);

      if (error) throw error;
      setدر انتظارOffers(data || []);
    } catch (error: any) {
      console.error("Error fetching pending offers:", error);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchتأییدs = async () => {
    setبارگذاری(true);
    try {
      const { data, error } = await supabase
        .from("approvals")
        .select(`
          *,
          approver:profiles!approver_user_id(full_name, email)
        `)
        .eq("offer_id", offerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setتأییدs(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching approvals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setبارگذاری(false);
    }
  };

  const fetchپروفایلs = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setپروفایلs(data || []);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleافزودنتأیید = async () => {
    if (!selectedتأییدr) {
      toast({
        title: "انتخاب an approver",
        description: "Please select a user to approve this offer",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("approvals").insert({
        offer_id: offerId,
        approver_user_id: selectedتأییدr,
        state: "pending",
      });

      if (error) throw error;

      toast({
        title: "تأییدr added",
        description: "تأیید request has been sent",
      });

      setانتخابedتأییدr("");
      fetchتأییدs();
      onتأییدChange?.();
    } catch (error: any) {
      toast({
        title: "Error adding approver",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleتأییدAction = async (approvalId: string, action: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("approvals")
        .update({
          state: action,
          comment: actionنظر || null,
          acted_at: new تاریخ().toISOString(),
        })
        .eq("id", approvalId);

      if (error) throw error;

      toast({
        title: action === "approved" ? "Offer approved" : "Offer rejected",
        description: `You have ${action} this offer`,
      });

      setActionنظر("");
      
      // Fetch updated approvals to check if all are complete
      const { data: updatedتأییدs } = await supabase
        .from("approvals")
        .select("state")
        .eq("offer_id", offerId);

      // If all approvals are approved, trigger email notification
      if (updatedتأییدs?.every(a => a.state === "approved")) {
        try {
          await supabase.functions.invoke("handle-offer-approval", {
            body: { offerId },
          });
          toast({
            title: "Offer sent to candidate",
            description: "All approvals complete. Offer notification has been sent.",
          });
        } catch (emailError: any) {
          console.error("Failed to send offer notification:", emailError);
          toast({
            title: "تأیید complete",
            description: "Offer approved but email notification failed. Please send manually.",
            variant: "destructive",
          });
        }
      }

      fetchتأییدs();
      onتأییدChange?.();
    } catch (error: any) {
      toast({
        title: "Error updating approval",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getوضعیتIcon = (state: string) => {
    switch (state) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getوضعیتBadge = (state: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      rejected: "destructive",
      pending: "secondary",
    };
    return <Badge variant={variants[state] || "secondary"}>{state}</Badge>;
  };

  const pendingتأیید = approvals.find(
    (a) => a.state === "pending" && a.approver_user_id === currentUserId
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">بارگذاری approvals...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <Cardعنوان>تأییدs</Cardعنوان>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingOffers.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="mb-3">Other Offers Awaiting Your تأیید</h4>
            <div className="space-y-2">
              {pendingOffers.map((approval) => (
                <div key={approval.id} className="p-3 bg-background border rounded flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {approval.offers?.application?.candidate?.full_name || "Unknown Candidate"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {approval.offers?.application?.job?.title || "Unknown Position"} • 
                      {approval.offers?.currency} {approval.offers?.base_amount?.toLocaleString()}
                      {approval.offers?.variable_amount ? ` + ${approval.offers.variable_amount.toLocaleString()} bonus` : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/offers/${approval.offer_id}`}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {offerState === "draft" && (
          <div className="space-y-2">
            <Label>افزودن تأییدکننده</Label>
            <div className="flex gap-2">
              <انتخاب value={selectedتأییدr} onValueChange={setانتخابedتأییدr}>
                <انتخابTrigger>
                  <انتخابValue placeholder="انتخاب approver" />
                </انتخابTrigger>
                <انتخابContent>
                  {profiles
                    .filter((p) => !approvals.find((a) => a.approver_user_id === p.id))
                    .map((profile) => (
                      <انتخابItem key={profile.id} value={profile.id}>
                        {profile.full_name} ({profile.email})
                      </انتخابItem>
                    ))}
                </انتخابContent>
              </انتخاب>
              <Button onClick={handleافزودنتأیید} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {approvals.length === 0 ? (
          <p className="text-sm text-muted-foreground">خیر approvals required</p>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getوضعیتIcon(approval.state)}
                    <div>
                      <p className="font-medium">{approval.approver.full_name}</p>
                      <p className="text-xs text-muted-foreground">{approval.approver.email}</p>
                    </div>
                  </div>
                  {getوضعیتBadge(approval.state)}
                </div>

                {approval.comment && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">نظر:</p>
                    <p>{approval.comment}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {approval.acted_at
                    ? `${approval.state} ${formatDistanceگیرندهخیرw(new تاریخ(approval.acted_at))} ago`
                    : `Requested ${formatDistanceگیرندهخیرw(new تاریخ(approval.created_at))} ago`}
                </p>

                {approval.state === "pending" && approval.approver_user_id === currentUserId && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor={`comment-${approval.id}`}>نظر (optional)</Label>
                    <Textarea
                      id={`comment-${approval.id}`}
                      value={actionنظر}
                      onChange={(e) => setActionنظر(e.target.value)}
                      placeholder="افزودن a comment..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleتأییدAction(approval.id, "approved")}
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        تأیید
                      </Button>
                      <Button
                        onClick={() => handleتأییدAction(approval.id, "rejected")}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        رد
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
