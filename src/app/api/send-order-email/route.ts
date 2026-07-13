import { Resend } from "resend";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await adminAuth.verifyIdToken(authHeader.slice(7)); }
  catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  try {
    const body = await request.json();
    const { orderNumber, customerEmail, customerName, items, total, address, phone } = body;

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY environment variable is not defined.");
      return NextResponse.json({ error: "Resend API key is missing on the server" }, { status: 500 });
    }

    // Build the items HTML list
    const itemsHtml = items
      .map((item: any) => {
        const productPrice = item.product.discountedPrice || item.product.price;
        return `
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #EAEAEA; font-size: 14px;">
              <div style="font-weight: 500;">${item.product.name}</div>
              <div style="margin-top: 5px; font-size: 12px; color: #707070;">
                Size: ${item.selectedSize} | Color: ${item.selectedColor}
              </div>
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid #EAEAEA; font-size: 14px; text-align: center; color: #707070;">
              ${item.quantity}
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid #EAEAEA; font-size: 14px; text-align: right;">
              ₹${productPrice * item.quantity}
            </td>
          </tr>
        `;
      })
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmed — ${orderNumber}</title>
      </head>
      <body style="background-color: #FBFBF9; color: #1A1A1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FBFBF9;">
          <div style="border-bottom: 1px solid #EAEAEA; padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; color: #1A1A1A;">Kamta Wise</h1>
            <div style="font-size: 18px; font-weight: 300; margin-top: 10px; letter-spacing: 0.05em; color: #707070; text-transform: uppercase;">Order Confirmed</div>
          </div>
          
          <div style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
            <p>Hello ${customerName || "Customer"},</p>
            <p>Thank you for shopping with us. Your order has been received and is currently being processed. Here are the details of your purchase:</p>
          </div>
          
          <div style="background-color: #F5F5F0; padding: 20px; border-radius: 4px; margin-bottom: 30px; font-size: 14px; line-height: 1.5;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #707070; width: 120px; padding: 4px 0;">Order Number</td>
                <td style="padding: 4px 0;"><strong>${orderNumber}</strong></td>
              </tr>
              <tr>
                <td style="color: #707070; padding: 4px 0; vertical-align: top;">Shipping Address</td>
                <td style="padding: 4px 0;">${address}</td>
              </tr>
              <tr>
                <td style="color: #707070; padding: 4px 0;">Phone</td>
                <td style="padding: 4px 0;">${phone}</td>
              </tr>
            </table>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr>
                <th style="border-bottom: 2px solid #1A1A1A; text-align: left; padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #707070;">Item</th>
                <th style="border-bottom: 2px solid #1A1A1A; text-align: center; padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #707070; width: 60px;">Qty</th>
                <th style="border-bottom: 2px solid #1A1A1A; text-align: right; padding: 10px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #707070; width: 100px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td style="padding-top: 20px; font-size: 15px; font-weight: 600;">Total Paid</td>
                <td></td>
                <td style="padding-top: 20px; font-size: 15px; font-weight: 600; text-align: right;">₹${total}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
            <p>We will send you another update with the tracking number once your package has been shipped.</p>
            <p>If you have any questions, feel free to reply directly to this email or contact us via Instagram <a href="https://instagram.com/kamta.wise" style="color: #1A1A1A; text-decoration: underline;">@kamta.wise</a>.</p>
          </div>
          
          <div style="border-top: 1px solid #EAEAEA; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 11px; color: #707070; line-height: 1.5; letter-spacing: 0.05em;">
            <p>&copy; ${new Date().getFullYear()} Kamta Wise. All rights reserved.</p>
            <p style="text-transform: uppercase; font-weight: 500; margin-top: 5px;">Roots. Raw. Real.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: `Kamta Wise <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
      to: customerEmail,
      subject: `Order Confirmed — ${orderNumber} | Kamta Wise`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
