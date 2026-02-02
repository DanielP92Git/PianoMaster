/**
 * Parental Consent Email Edge Function
 *
 * Sends COPPA-compliant parental consent verification emails via Resend API.
 * Parents receive a secure link to verify their child's account creation.
 *
 * Environment Variables:
 * - RESEND_API_KEY: API key from resend.com (required)
 *
 * Request Body:
 * - parentEmail: string - Parent's email address
 * - consentUrl: string - Verification URL with token
 * - childName?: string - Optional child's name for personalization
 *
 * Returns:
 * - Success: { success: true, id: string } - Resend email ID
 * - Error: { success: false, error: string } - Error message
 */

// CORS headers for browser invocation
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate child-friendly HTML email with inline CSS
 * Uses table-based layout for Outlook compatibility
 */
function generateConsentEmailHTML(consentUrl: string, childName?: string): string {
  const greeting = childName ? `Hi there,` : `Hello,`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Consent for PianoMaster</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">

  <!-- Wrapper table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f4f8; padding: 40px 0;">
    <tr>
      <td align="center">

        <!-- Main container table -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                🎹 PianoMaster
              </h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.95); font-weight: 500;">
                Parental Consent Required
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                ${greeting}
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                Your child has created an account on <strong style="color: #6366f1;">PianoMaster</strong>, a fun and safe music learning app designed for kids ages 8-12.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #1e293b;">
                Because your child is under 13 years old, we need <strong>your permission</strong> before they can start learning piano. This helps us comply with COPPA (Children's Online Privacy Protection Act) and keep kids safe online.
              </p>

              <!-- What PianoMaster is -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px; margin: 24px 0; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #475569;">
                      What is PianoMaster?
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b;">
                      PianoMaster helps kids learn to read music through interactive games and exercises. Students practice sight-reading, rhythm, and note recognition at their own pace.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 32px; font-size: 16px; line-height: 26px; color: #1e293b;">
                Click the button below to <strong>verify your consent</strong>:
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);">
                    <a href="${consentUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 600; letter-spacing: 0.3px;">
                      Verify Consent
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What we collect -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #475569;">
                What information do we collect?
              </p>
              <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; line-height: 22px; color: #64748b;">
                <li style="margin-bottom: 8px;">Learning progress (scores, completed exercises)</li>
                <li style="margin-bottom: 8px;">Practice activity (session times, streaks)</li>
                <li style="margin-bottom: 0;">Account info (username, parent email)</li>
              </ul>
              <p style="margin: 16px 0 0; font-size: 14px; line-height: 22px; color: #64748b;">
                We never share your child's data with third parties or use it for advertising. You can request data export or deletion anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px; font-size: 14px; line-height: 22px; color: #64748b;">
                <strong style="color: #475569;">This link expires in 7 days.</strong>
              </p>
              <p style="margin: 0 0 12px; font-size: 14px; line-height: 22px; color: #64748b;">
                If this link expires, your child can request a new verification email from their account.
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                If you didn't expect this email or don't recognize PianoMaster, you can safely ignore it. No account will be activated without your consent.
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer outside main container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 18px;">
                © 2026 PianoMaster. A safe learning environment for young musicians.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Main Edge Function handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight - must return 200 status for browser to accept
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Parse request body
    const { parentEmail, consentUrl, childName } = await req.json();

    // Validate required parameters
    if (!parentEmail || !consentUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: parentEmail and consentUrl are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service configuration error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate email HTML
    const html = generateConsentEmailHTML(consentUrl, childName);

    // Call Resend API with 30-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'PianoMaster <noreply@pianomaster.app>',
          to: [parentEmail],
          subject: 'Your Child Needs Your Permission to Use PianoMaster',
          html,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle Resend API errors
      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error('Resend API error:', resendResponse.status, errorText);

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send email. Please try again later.',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Parse successful response
      const resendData = await resendResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          id: resendData.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        console.error('Resend API request timeout');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email service timeout. Please try again.',
          }),
          {
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
