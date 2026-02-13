interface Env {
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
  RESEND_FROM_EMAIL: string;
}

type PagesContext<TEnv> = {
  request: Request;
  env: TEnv;
};

type PagesFunction<TEnv = Record<string, unknown>> = (
  context: PagesContext<TEnv>
) => Response | Promise<Response>;

interface WaitlistRequestBody {
  email: string;
  source?: string;
  persona?: string;
  path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface ResendAudienceErrorResponse {
  name?: string;
  message?: string;
}

interface ResendEmailResponse {
  id?: string;
  message?: string;
  name?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sanitizeText = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLength);
};

const parseResendResponse = async <T extends { message?: string }>(response: Response): Promise<T | undefined> => {
  const raw = await response.text();
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return { message: raw } as T;
  }
};

const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0f0d0b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0d0b;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="padding:32px 40px 24px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#f5f0eb;letter-spacing:-0.5px;">Byeori</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#8a7d72;letter-spacing:2px;text-transform:uppercase;">Local-first Context Layer</p>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e0734c55,transparent);"></div></td></tr>
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#f5f0eb;">Thanks for joining the waitlist.</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#b8ada3;">Hello,<br/>Thank you for joining Byeori early access.</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#b8ada3;">Byeori helps AI agent users recover why code exists with an analysis-first workflow. You will be the <strong style="color:#f5f0eb;">first to know</strong> when early access opens.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="padding:20px 24px;background-color:#1a1614;border-radius:12px;border:1px solid #2a2420;">
              <p style="margin:0;font-size:14px;color:#b8ada3;line-height:1.6;">
                <span style="color:#e0734c;font-weight:600;">What happens next?</span><br/>
                - We will send your early access invite by email<br/>
                - You get launch updates before public release<br/>
                - You can reply with your main AI agent workflow pain points
              </p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#b8ada3;">If you have questions, just reply to this email.</p>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e0734c33,transparent);"></div></td></tr>
        <tr><td style="padding:24px 40px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#6b6058;">Made by <span style="color:#e0734c;">Neungsohwa</span></p>
          <p style="margin:0;font-size:12px;color:#4a4440;">© 2026 Byeori. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as WaitlistRequestBody;
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendKey = context.env.RESEND_API_KEY;
    const audienceId = context.env.RESEND_AUDIENCE_ID;
    const fromEmail = context.env.RESEND_FROM_EMAIL?.trim();

    if (!resendKey || !audienceId || !fromEmail) {
      throw new Error("Missing Resend configuration");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const attribution = {
      source: sanitizeText(body.source, 120),
      persona: sanitizeText(body.persona, 120),
      path: sanitizeText(body.path, 240),
      referrer: sanitizeText(body.referrer, 400),
      utm_source: sanitizeText(body.utm_source, 120),
      utm_medium: sanitizeText(body.utm_medium, 120),
      utm_campaign: sanitizeText(body.utm_campaign, 120),
      utm_term: sanitizeText(body.utm_term, 120),
      utm_content: sanitizeText(body.utm_content, 120),
    };

    console.info("[waitlist-signup]", {
      email: normalizedEmail,
      ...attribution,
      timestamp: new Date().toISOString(),
      userAgent: context.request.headers.get("user-agent"),
      country: context.request.headers.get("cf-ipcountry"),
    });

    const audienceRes = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      }
    );

    const audienceData = await parseResendResponse<ResendAudienceErrorResponse>(audienceRes);
    const alreadyOnWaitlist = audienceRes.status === 409;

    if (!audienceRes.ok && !alreadyOnWaitlist) {
      throw new Error(audienceData?.message || "Failed to add to audience");
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [normalizedEmail],
        subject: "Thanks for joining the Byeori waitlist",
        html: emailHtml,
      }),
    });

    const emailData = await parseResendResponse<ResendEmailResponse>(emailRes);

    if (!emailRes.ok) {
      console.error("Failed to send welcome email:", emailData?.message || "Unknown Resend error");
      return new Response(
        JSON.stringify({ error: "Unable to send welcome email. Please try again." }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, alreadyOnWaitlist }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};
