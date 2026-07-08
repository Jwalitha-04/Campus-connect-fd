import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields (to, subject, html)" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: "Campus Connect <onboarding@resend.dev>",
        to,
        subject,
        html,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Mock log transporter if api key is missing
      console.log(`[MOCK EMAIL SENT via RESEND]
      To: ${to}
      Subject: ${subject}
      Body: ${html}
      `);

      return NextResponse.json({ success: true, mocked: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
