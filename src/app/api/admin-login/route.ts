import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const adminPin = process.env.ADMIN_PIN || "482917";
    const email = process.env.ADMIN_FIREBASE_EMAIL || "nikhilbasfor3@gmail.com";
    const password = process.env.ADMIN_FIREBASE_PASSWORD || "nikhil@45";

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    if (pin !== adminPin) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    return NextResponse.json({ email, password });
  } catch (error: any) {
    console.error("Error during admin login process:", error);
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 });
  }
}
