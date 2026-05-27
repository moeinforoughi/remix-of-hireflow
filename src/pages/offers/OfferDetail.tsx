import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useگیرندهast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Calendar, User, Briefcase, FileText, دانلود, به‌روزرسانیCw } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { تأییدSection } from '@/components/offers/تأییدSection';
import { انقضاWarning } from '@/components/offers/انقضاWarning';
import { Offerزمانline } from '@/components/offers/Offerزمانline';

interface OfferDetail {
  id: string;
  base_amount: number;
  variable_amount?: number;
  currency: string;
  equity?: string;
  benefits_md?: string;
  state: string;
  created_at: string;
  expires_at?: string;
  notes?: string;
  pdf_url?: string;
  application: {
    id: string;
    candidate: {
      id: string;
      full_name: string;
      email: string;
    };
    job: {
      id: string;
      title: string;
      department: string;
    };
  };
}

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useگیرندهast();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setبارگذاری] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOffer();
      checkانقضا();
    }
  }, [id]);

  const fetchOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          base_amount,
          variable_amount,
          currency,
          equity,
          benefits_md,
          state,
          created_at,
          expires_at,
          notes,
          pdf_url,
          application:applications(
            id,
            candidate:candidates(id, full_name, email),
            job:jobs(id, title, department)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOffer(data);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  const checkانقضا = async () => {
    try {
      const { data: currentOffer } = await supabase
        .from('offers')
        .select('id, expires_at, state')
        .eq('id', id)
        .single();

      if (currentOffer && currentOffer.expires_at && currentOffer.state === 'sent') {
        if (isPast(new تاریخ(currentOffer.expires_at))) {
          await supabase
            .from('offers')
            .update({ state: 'expired' })
            .eq('id', id);
          
          fetchOffer();
        }
      }
    } catch (error: any) {
      console.error('Error checking expiration:', error);
    }
  };

  const handleStateبه‌روزرسانی = async (newState: 'pending_approval' | 'sent' | 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ state: newState })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: `Offer ${newState.replace('_', ' ')}`,
      });

      fetchOffer();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatواحد پول = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-offer-pdf", {
        body: { offerId: id },
      });

      if (error) throw error;

      toast({
        title: "PDF Generated",
        description: "Offer letter PDF has been generated successfully",
      });

      // به‌روزرسانی offer to get the PDF URL
      fetchOffer();
    } catch (error: any) {
      toast({
        title: "PDF Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleارسالForSignature = async () => {
    if (!offer || !offer.pdf_url) return;
    
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-hellosign", {
        body: {
          offerId: id,
          candidateایمیل: offer.application.candidate.email,
          candidateName: offer.application.candidate.full_name,
          documentUrl: offer.pdf_url,
        },
      });

      if (error) throw error;

      toast({
        title: "Signature Request ارسال شده",
        description: `E-signature request sent to ${offer.application.candidate.email}`,
      });

      fetchOffer();
    } catch (error: any) {
      toast({
        title: "E-Signature Failed",
        description: error.message || "Failed to send signature request. Make sure HELLOSIGN_API_KEY is configured.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Offer not found</p>
        <Button onClick={() => navigate('/offers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          بازگشت to Offers
        </Button>
      </div>
    );
  }

  const totalComp = offer.base_amount + (offer.variable_amount || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/offers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">{offer.application.candidate.full_name}</h1>
          <p className="text-muted-foreground">{offer.application.job.title}</p>
        </div>
        <Badge>{offer.state.replace('_', ' ')}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">تأییدs</TabsTrigger>
          <TabsTrigger value="timeline">زمانline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <انقضاWarning expiresAt={offer.expires_at} state={offer.state} />
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Cardعنوان>Compensation Package</Cardعنوان>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">گیرندهtal Compensation</p>
                  <p className="text-2xl font-bold">{formatواحد پول(totalComp, offer.currency)}</p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">حقوق پایه</span>
                    <span className="font-medium">{formatواحد پول(offer.base_amount, offer.currency)}</span>
                  </div>
                  {offer.variable_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variable/پاداش</span>
                      <span className="font-medium">{formatواحد پول(offer.variable_amount, offer.currency)}</span>
                    </div>
                  )}
                  {offer.equity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">سهام</span>
                      <span className="font-medium">{offer.equity}</span>
                    </div>
                  )}
                </div>

                {offer.expires_at && (
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <p className="font-medium">{format(new تاریخ(offer.expires_at), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cardعنوان>Candidate Information</Cardعنوان>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{offer.application.candidate.full_name}</p>
                    <p className="text-sm text-muted-foreground">{offer.application.candidate.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{offer.application.job.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.application.job.department}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/candidates/${offer.application.candidate.id}`)}
                  >
                    View Candidate پروفایل
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/applications/${offer.application.id}`)}
                  >
                    View Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {offer.benefits_md && (
            <Card>
              <CardHeader>
                <Cardعنوان>مزایا</Cardعنوان>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{offer.benefits_md}</div>
              </CardContent>
            </Card>
          )}

          {offer.notes && (
            <Card>
              <CardHeader>
                <Cardعنوان>Internal خیرtes</Cardعنوان>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-muted-foreground">{offer.notes}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <Cardعنوان>نامه پیشنهاد & E-Signature</Cardعنوان>
            </CardHeader>
            <CardContent className="space-y-4">
              {offer.pdf_url ? (
                  <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      asChild
                    >
                      <a href={offer.pdf_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View PDF
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                    >
                      <a href={offer.pdf_url} download>
                        <دانلود className="h-4 w-4 mr-2" />
                        دانلود PDF
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGeneratePdf}
                      disabled={generatingPdf}
                    >
                      {generatingPdf ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <به‌روزرسانیCw className="h-4 w-4 mr-2" />
                          Regenerate PDF
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {offer.state === 'approved' && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        ارسال for electronic signature via Dropbox Sign (HelloSign)
                      </p>
                      <Button onClick={handleارسالForSignature} disabled={generatingPdf}>
                        {generatingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ارسالing...
                          </>
                        ) : (
                          <>
                            ارسال for E-Signature
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={handleGeneratePdf} disabled={generatingPdf}>
                  {generatingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate نامه پیشنهاد PDF
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {offer.state === 'draft' && (
            <Card>
              <CardHeader>
                <Cardعنوان>Actions</Cardعنوان>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  افزودن approvers in the تأییدs tab, then the offer will be automatically sent to the candidate once all approvals are complete.
                </p>
              </CardContent>
            </Card>
          )}

          {offer.state === 'pending_approval' && (
            <Card>
              <CardHeader>
                <Cardعنوان>در انتظار تأییدs</Cardعنوان>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This offer is awaiting approval. Once all approvers approve, it will be automatically sent to the candidate.
                </p>
              </CardContent>
            </Card>
          )}

          {offer.state === 'sent' && (
            <Card>
              <CardHeader>
                <Cardعنوان>Candidate Response</Cardعنوان>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={() => handleStateبه‌روزرسانی('accepted')}>
                  Mark as پذیرفته شده
                </Button>
                <Button variant="destructive" onClick={() => handleStateبه‌روزرسانی('declined')}>
                  Mark as رد شده
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approvals">
          <تأییدSection 
            offerId={offer.id} 
            offerState={offer.state}
            onتأییدChange={fetchOffer}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <Offerزمانline offerId={offer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfferDetail;
