import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  offerId: z.string().uuid('Invalid offer ID format'),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate input
    const body = await req.json();
    const { offerId } = requestSchema.parse(body);

    console.log("Processing offer approval for:", offerId);

    // Get offer details with application and candidate info
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        id,
        state,
        base_amount,
        variable_amount,
        currency,
        equity,
        benefits_md,
        expires_at,
        pdf_url,
        application_id
      `)
      .eq("id", offerId)
      .single();

    if (offerError) throw offerError;
    if (!offer) throw new Error("Offer not found");

    // Get application details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        candidate:candidates (
          id,
          full_name,
          email
        ),
        job:jobs (
          id,
          title,
          org_id
        )
      `)
      .eq("id", offer.application_id)
      .single();

    if (appError) throw appError;
    if (!application) throw new Error("Application not found");

    // Only process if offer is in approved state
    if (offer.state !== "approved") {
      return new Response(
        JSON.stringify({ message: "Offer is not in approved state" }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Generate PDF if not already generated
    let pdfUrl = offer.pdf_url;
    if (!pdfUrl) {
      console.log("Generating PDF for offer:", offerId);
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke(
        "generate-offer-pdf",
        { body: { offerId } }
      );

      if (pdfError) {
        console.error("PDF generation failed:", pdfError);
      } else {
        pdfUrl = pdfData?.pdfUrl;
      }
    }

    // Send email notification to candidate
    const candidate = Array.isArray(application.candidate) ? application.candidate[0] : application.candidate;
    const job = Array.isArray(application.job) ? application.job[0] : application.job;
    
    console.log("Sending offer email to:", candidate.email);
    
    const totalCompensation = offer.base_amount + (offer.variable_amount || 0);
    const emailBody = `
      <h1>Job Offer from Our Company</h1>
      <p>Dear ${candidate.full_name},</p>
      
      <p>We are pleased to extend an offer for the position of <strong>${job.title}</strong>.</p>
      
      <h2>Compensation Details:</h2>
      <ul>
        <li>Base Salary: ${offer.currency} ${offer.base_amount.toLocaleString()}</li>
        ${offer.variable_amount ? `<li>Variable/Bonus: ${offer.currency} ${offer.variable_amount.toLocaleString()}</li>` : ''}
        ${offer.equity ? `<li>Equity: ${offer.equity}</li>` : ''}
        <li><strong>Total Compensation: ${offer.currency} ${totalCompensation.toLocaleString()}</strong></li>
      </ul>
      
      ${offer.benefits_md ? `<h2>Benefits:</h2><pre>${offer.benefits_md}</pre>` : ''}
      
      ${offer.expires_at ? `<p><em>This offer expires on ${new Date(offer.expires_at).toLocaleDateString()}.</em></p>` : ''}
      
      ${pdfUrl ? `<p><a href="${pdfUrl}">Download Offer Letter (PDF)</a></p>` : ''}
      
      <p>We look forward to having you on our team!</p>
    `;

    // Create message in database
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        org_id: job.org_id,
        application_id: application.id,
        candidate_id: candidate.id,
        to_addresses: [candidate.email],
        subject: `Job Offer - ${job.title}`,
        body_html: emailBody,
        status: "queued",
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Invoke send-email function
    const { error: emailError } = await supabase.functions.invoke("send-email", {
      body: { messageId: message.id },
    });

    if (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the whole process if email fails
    }

    // Update offer state to 'sent'
    const { error: updateError } = await supabase
      .from("offers")
      .update({ state: "sent" })
      .eq("id", offerId);

    if (updateError) throw updateError;

    console.log("Offer approval processed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Offer notification sent to candidate",
        pdfUrl 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error processing offer approval:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
