import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParseResumeRequest {
  fileUrl: string;
  candidateId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, candidateId }: ParseResumeRequest = await req.json();
    console.log("Parsing resume from storage path:", fileUrl);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the resume file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(fileUrl);
    
    if (downloadError || !fileData) {
      console.error("Failed to download resume:", downloadError);
      throw new Error("Failed to download resume file from storage");
    }

    // Convert blob to ArrayBuffer then to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Content = btoa(String.fromCharCode(...uint8Array));

    console.log("Resume file fetched, size:", arrayBuffer.byteLength);

    // Call Lovable AI to parse the resume with multimodal input and tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a resume parser. Extract structured information from resumes accurately."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the following information from this resume: full name, email, phone number, LinkedIn URL, current location, current role, years of experience, skills, work experience, education, and a professional summary."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Content}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_resume_data",
              description: "Extract structured information from a resume",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string", description: "Candidate's full name" },
                  email: { type: "string", description: "Email address" },
                  phone: { type: "string", description: "Phone number" },
                  location: { type: "string", description: "Current location/city" },
                  linkedin_url: { type: "string", description: "LinkedIn profile URL" },
                  current_role: { type: "string", description: "Current or most recent job title" },
                  experience_years: { type: "number", description: "Total years of experience" },
                  skills: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Array of skills mentioned in resume"
                  },
                  experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string" },
                        title: { type: "string" },
                        duration: { type: "string" },
                        description: { type: "string" }
                      }
                    },
                    description: "Work experience history"
                  },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        institution: { type: "string" },
                        degree: { type: "string" },
                        field: { type: "string" },
                        year: { type: "string" }
                      }
                    },
                    description: "Educational background"
                  },
                  summary: { type: "string", description: "Brief professional summary" }
                },
                required: ["full_name"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_resume_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error("AI API error:", error);
      throw new Error(`AI API error: ${error}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData));

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response");
      throw new Error("Failed to parse resume data - no tool call returned");
    }

    const parsedData = JSON.parse(toolCall.function.arguments);

    // Update candidate with parsed data
    const updateData: any = {};
    if (parsedData.email) updateData.email = parsedData.email;
    if (parsedData.phone) updateData.phone = parsedData.phone;
    if (parsedData.location) updateData.location = parsedData.location;
    if (parsedData.linkedin_url) updateData.linkedin_url = parsedData.linkedin_url;
    
    // Store full parsed data in JSON field
    updateData.parsed_resume_json = parsedData;

    const { error: updateError } = await supabase
      .from("candidates")
      .update(updateData)
      .eq("id", candidateId);

    if (updateError) {
      console.error("Failed to update candidate:", updateError);
      throw updateError;
    }

    console.log("Candidate updated successfully with parsed data");

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: parsedData 
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
    console.error("Error in parse-resume function:", error);
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
