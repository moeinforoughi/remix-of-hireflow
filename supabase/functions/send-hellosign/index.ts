import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const HELLOSIGN_API_KEY = Deno.env.get("HELLOSIGN_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HelloSignRequest {
  offerId: string;
  candidateEmail: string;
  candidateName: string;
  documentUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId, candidateEmail, candidateName, documentUrl }: HelloSignRequest = await req.json();

    if (!HELLOSIGN_API_KEY) {
      throw new Error("HelloSign API key not configured. Please add HELLOSIGN_API_KEY secret.");
    }

    console.log("Sending signature request for offer:", offerId);

    // Prepare HelloSign/Dropbox Sign API request
    const formData = new FormData();
    formData.append("test_mode", "1"); // Set to 0 for production
    formData.append("title", `Offer Letter - ${candidateName}`);
    formData.append("subject", "Please sign your offer letter");
    formData.append("message", "Congratulations! Please review and sign your offer letter to accept the position.");
    formData.append("signers[0][email_address]", candidateEmail);
    formData.append("signers[0][name]", candidateName);
    formData.append("file_url[0]", documentUrl);

    const response = await fetch("https://api.hellosign.com/v3/signature_request/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(HELLOSIGN_API_KEY + ":")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HelloSign API error:", errorText);
      throw new Error(`HelloSign API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Signature request sent successfully:", result.signature_request.signature_request_id);

    // Update offer with signature request ID
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        state: "sent",
        notes: `HelloSign Signature Request ID: ${result.signature_request.signature_request_id}`,
      })
      .eq("id", offerId);

    if (updateError) {
      console.error("Failed to update offer:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        signatureRequestId: result.signature_request.signature_request_id,
        signUrl: result.signature_request.signing_url,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-hellosign function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
