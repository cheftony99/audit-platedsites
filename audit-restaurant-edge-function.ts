import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { restaurantName, location } = await req.json();

    if (!restaurantName || !location) {
      return new Response(
        JSON.stringify({ error: 'Restaurant name and location required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Claude API with web search to find domain and audit the restaurant
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        tools: [
          {
            name: 'web_search',
            description: 'Search the web for restaurant information',
            input_schema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query',
                },
              },
              required: ['query'],
            },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `You are a restaurant website auditor. Your job is to find and audit the website for: ${restaurantName} in ${location}.

STEPS:
1. First, search for the restaurant's website domain
2. Once you find it, fetch and analyze the website
3. Score the website on these 15 metrics (respond with TRUE/FALSE for each):
   - Phone number presence and formatting
   - Mobile responsiveness
   - SEO basics (meta tags, schema markup)
   - Reservation system integration
   - Online ordering capability
   - Menu accessibility and quality
   - High quality images/photography
   - Local business schema and GMB optimization
   - Social media links
   - Site speed and performance
   - Content freshness (recent updates)
   - Accessibility standards
   - E-commerce/Stripe integration
   - Contact form or email visibility
   - Reviews or testimonials section

For each metric, respond ONLY with TRUE or FALSE.

At the end, provide a JSON response in this exact format:
{
  "restaurant_name": "${restaurantName}",
  "location": "${location}",
  "domain_found": "domain.com",
  "scores": {
    "Phone Number Presence": true/false,
    "Mobile Responsiveness": true/false,
    "SEO Basics (Meta Tags & Schema)": true/false,
    "Reservation System": true/false,
    "Online Ordering": true/false,
    "Menu Accessibility": true/false,
    "High Quality Images": true/false,
    "Local Business Schema": true/false,
    "Social Media Links": true/false,
    "Site Speed": true/false,
    "Content Freshness": true/false,
    "Accessibility Standards": true/false,
    "E-commerce Integration": true/false,
    "Contact Form/Email": true/false,
    "Reviews & Testimonials": true/false
  },
  "details": "Brief summary of what they're doing well and what needs improvement"
}`,
          },
        ],
      }),
    });

    const claudeData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeData);
      return new Response(
        JSON.stringify({
          error: 'Failed to audit restaurant',
          details: claudeData,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract the response text
    let responseText = '';
    for (const block of claudeData.content) {
      if (block.type === 'text') {
        responseText += block.text;
      }
    }

    // Parse the JSON from Claude's response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse audit results' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const auditResult = JSON.parse(jsonMatch[0]);

    // Calculate total score
    const totalScore = Object.values(auditResult.scores).filter((v) => v === true)
      .length;

    return new Response(
      JSON.stringify({
        scores: auditResult.scores,
        totalScore,
        details: auditResult.details,
        domainFound: auditResult.domain_found,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
