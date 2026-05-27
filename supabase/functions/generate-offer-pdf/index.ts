import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    // Fetch offer details with all related data
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select(`
        *,
        application:applications(
          id,
          candidate:candidates(
            id,
            full_name,
            email,
            phone,
            location
          ),
          job:jobs(
            id,
            title,
            department,
            location,
            employment_type
          )
        )
      `)
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      throw new Error(`Offer not found: ${offerError?.message}`);
    }

    // Fetch organization details
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .limit(1)
      .single();

    const orgName = org?.name || "Company Name";
    const candidate = offer.application.candidate;
    const job = offer.application.job;

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: offer.currency,
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const totalComp = offer.base_amount + (offer.variable_amount || 0);

    // Create PDF using pdf-lib
    console.log("Creating PDF document...");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size: 8.5" x 11"
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    const margin = 60;
    let yPosition = height - 80;
    
    // Helper function to draw text
    const drawText = (text: string, size: number, font: any, y: number, options: any = {}) => {
      page.drawText(text, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0.2, 0.2, 0.2),
        ...options,
      });
    };
    
    // Header
    drawText(orgName, 18, boldFont, yPosition);
    yPosition -= 20;
    drawText("OFFER LETTER", 16, boldFont, yPosition, { x: width / 2 - 60 });
    yPosition -= 40;
    
    // Date
    drawText(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      11,
      font,
      yPosition
    );
    yPosition -= 30;
    
    // Candidate Address
    drawText(candidate.full_name, 11, font, yPosition);
    yPosition -= 15;
    drawText(candidate.email, 11, font, yPosition);
    yPosition -= 15;
    if (candidate.phone) {
      drawText(candidate.phone, 11, font, yPosition);
      yPosition -= 15;
    }
    if (candidate.location) {
      drawText(candidate.location, 11, font, yPosition);
      yPosition -= 15;
    }
    yPosition -= 20;
    
    // Opening
    drawText(`Dear ${candidate.full_name},`, 11, font, yPosition);
    yPosition -= 30;
    
    const introText = `We are pleased to offer you the position of ${job.title}${
      job.department ? ` in the ${job.department} department` : ""
    } at ${orgName}.`;
    drawText(introText, 11, font, yPosition);
    yPosition -= 40;
    
    // Compensation Section
    drawText("COMPENSATION", 14, boldFont, yPosition);
    yPosition -= 20;
    
    drawText(`• Base Salary: ${formatCurrency(offer.base_amount)} per year`, 11, font, yPosition);
    yPosition -= 15;
    
    if (offer.variable_amount) {
      drawText(`• Variable Compensation: ${formatCurrency(offer.variable_amount)} per year`, 11, font, yPosition);
      yPosition -= 15;
    }
    
    if (offer.equity) {
      drawText(`• Equity: ${offer.equity}`, 11, font, yPosition);
      yPosition -= 15;
    }
    
    drawText(`• Total Annual Compensation: ${formatCurrency(totalComp)}`, 11, boldFont, yPosition);
    yPosition -= 30;
    
    // Employment Details
    drawText("EMPLOYMENT DETAILS", 14, boldFont, yPosition);
    yPosition -= 20;
    
    drawText(`• Employment Type: ${job.employment_type.replace("_", " ").toUpperCase()}`, 11, font, yPosition);
    yPosition -= 15;
    
    if (job.location) {
      drawText(`• Location: ${job.location}`, 11, font, yPosition);
      yPosition -= 15;
    }
    yPosition -= 20;
    
    // Benefits
    if (offer.benefits_md) {
      drawText("BENEFITS", 14, boldFont, yPosition);
      yPosition -= 20;
      drawText(offer.benefits_md, 11, font, yPosition);
      yPosition -= 30;
    }
    
    // Expiration
    if (offer.expires_at) {
      const expirationText = `This offer is valid until ${new Date(offer.expires_at).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )}. Please indicate your acceptance by signing and returning this letter by that date.`;
      drawText(expirationText, 11, font, yPosition);
      yPosition -= 40;
    }
    
    // Closing
    drawText("We are excited about the possibility of you joining our team and look forward to your positive response.", 11, font, yPosition);
    yPosition -= 40;
    
    drawText("Sincerely,", 11, font, yPosition);
    yPosition -= 30;
    drawText(orgName, 11, boldFont, yPosition);
    yPosition -= 60;
    
    // Acceptance Section
    drawText("ACCEPTANCE", 14, boldFont, yPosition);
    yPosition -= 20;
    drawText(`I, ${candidate.full_name}, accept this offer of employment with ${orgName}.`, 11, font, yPosition);
    yPosition -= 40;
    
    drawText("Signature: _______________________     Date: _______________________", 11, font, yPosition);
    
    console.log("Serializing PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully, size:", pdfBytes.length);
    // Upload to storage as PDF
    const fileName = `offer-${offerId}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);

    // Update offer with PDF URL
    const { error: updateError } = await supabase
      .from("offers")
      .update({ pdf_url: urlData.publicUrl })
      .eq("id", offerId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    console.log("Document generated successfully:", urlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: urlData.publicUrl,
        fileName,
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
    console.error("Error generating PDF:", error);
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
