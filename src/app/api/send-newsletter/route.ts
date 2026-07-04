import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function POST(request: Request) {
  try {
    const { subject, bodyText, subscribers } = await request.json();

    if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json({ error: "No subscribers provided" }, { status: 400 });
    }

    if (!subject || !bodyText) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY is missing on server" }, { status: 500 });
    }

    const emailList = subscribers.map((s: any) => typeof s === "string" ? s : s.email).filter(Boolean);

    if (emailList.length === 0) {
      return NextResponse.json({ error: "No valid email addresses found" }, { status: 400 });
    }

    // Convert newlines in plain text body to HTML breaks
    const formattedBodyHtml = bodyText.replace(/\n/g, "<br/>");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="background-color: #FBFBF9; color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FBFBF9;">
          <div style="border-bottom: 1px solid #EAEAEA; padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; color: #1A1A1A;">Kamta Wise</h1>
            <div style="font-size: 11px; font-weight: 500; margin-top: 8px; letter-spacing: 0.2em; color: #707070; text-transform: uppercase;">Roots. Raw. Real.</div>
          </div>
          
          <div style="font-size: 14px; line-height: 1.8; color: #333333; margin-bottom: 30px; background-color: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #EAEAEA;">
            ${formattedBodyHtml}
          </div>
          
          <div style="border-top: 1px solid #EAEAEA; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 11px; color: #707070; line-height: 1.5; letter-spacing: 0.05em;">
            <p>&copy; ${new Date().getFullYear()} Kamta Wise. All rights reserved.</p>
            <p style="margin-top: 5px; color: #999;">You received this email because you subscribed to Kamta Wise newsletter updates.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails via Resend (using batch / bcc or individual sends)
    // Resend free tier sends from onboarding@resend.dev
    const data = await resend.emails.send({
      from: "Kamta Wise <onboarding@resend.dev>",
      to: emailList,
      subject: subject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, count: emailList.length, data });
  } catch (error: any) {
    console.error("Error sending newsletter emails:", error);
    return NextResponse.json({ error: error.message || "Failed to send newsletter emails" }, { status: 500 });
  }
}
