
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, api_key, minutes } = await req.json();

    if (!session_id || !api_key) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hcfbtbunlqznieubakyf.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recent transcripts
    const { data: transcripts, error: transcriptError } = await supabase
      .from('transcriptions')
      .select('text, created_at')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transcriptError) {
      console.error("Error fetching transcripts:", transcriptError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch transcripts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concatenate transcript texts
    const transcriptText = transcripts.map(t => t.text).join(" ");
    
    if (transcriptText.length < 20) {
      return new Response(
        JSON.stringify({ error: "Not enough transcript content to generate a poll" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate poll using OpenAI API
    const poll = await generatePollWithOpenAI(transcriptText, api_key);
    
    if (!poll) {
      return new Response(
        JSON.stringify({ error: "Failed to generate poll" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert poll into database
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert([{
        session_id,
        question: poll.question,
        options: poll.options
      }])
      .select()
      .single();

    if (pollError) {
      console.error("Error inserting poll:", pollError);
      return new Response(
        JSON.stringify({ error: "Failed to save poll" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, poll: pollData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generatePollWithOpenAI(transcript: string, apiKey: string): Promise<{ question: string, options: string[] } | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI that creates multiple choice quiz questions from lecture transcripts. Create one good question with 4 options based on the transcript. Return only JSON in this format: {\"question\": \"What is X?\", \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"]}"
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("OpenAI API returned no content");
      return null;
    }

    try {
      // Parse the JSON response
      const parsedContent = JSON.parse(content);
      return {
        question: parsedContent.question,
        options: parsedContent.options
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      
      // Try to extract with regex as fallback
      const questionMatch = content.match(/question"?\s*:\s*"([^"]+)"/);
      const optionsMatch = content.match(/options"?\s*:\s*\[(.*)\]/);
      
      if (questionMatch && optionsMatch) {
        const question = questionMatch[1];
        const optionsString = optionsMatch[1];
        const options = optionsString.split(',').map(opt => 
          opt.trim().replace(/^"/, '').replace(/"$/, '')
        );
        
        return { question, options };
      }
      
      return null;
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}
