// Place this at: netlify/edge-functions/ghl-webhook.ts

import { Context } from 'https://edge.netlify.com';

export default async (request: Request, context: Context) => {
  // Only process POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.json();
    const { email, restaurant_name, location, score } = formData;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Your GoHighLevel credentials from environment variables
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    const GHL_API_KEY = Deno.env.get('GHL_API_KEY');

    if (!GHL_LOCATION_ID || !GHL_API_KEY) {
      console.error('Missing GHL credentials');
      // Don't fail the form submission if GHL sync fails
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create or update contact in GoHighLevel
    const ghlResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GHL_API_KEY}`,
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          email,
          firstName: restaurant_name,
          phone: '',
          customFields: {
            restaurantName: restaurant_name,
            auditLocation: location,
            auditScore: score?.toString() || '0',
            source: 'audit-tool',
          },
          tags: [
            score >= 12 ? 'Hot Lead' : score >= 8 ? 'Warm Lead' : 'Cold Lead',
            'Website Audit',
          ],
        }),
      }
    );

    const ghlData = await ghlResponse.json();

    if (!ghlResponse.ok) {
      console.error('GoHighLevel API error:', ghlData);
      // Log but don't fail the form submission
    }

    // Return success to Netlify Forms
    return new Response(
      JSON.stringify({
        success: true,
        ghl_contact_id: ghlData.contact?.id || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    // Don't fail the form submission due to webhook errors
    return new Response(
      JSON.stringify({ success: true, error: error.message }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
