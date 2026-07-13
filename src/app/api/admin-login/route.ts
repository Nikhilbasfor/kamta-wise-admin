import { NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const adminPin = process.env.ADMIN_PIN;
    const email = process.env.ADMIN_FIREBASE_EMAIL;
    const password = process.env.ADMIN_FIREBASE_PASSWORD;

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    if (!adminPin || !email || !password) {
      console.error("Missing admin server-side environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (pin !== adminPin) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    // Call Firebase signInWithEmailAndPassword
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Generate a secure custom token using the Firebase Admin SDK
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ token: customToken });
  } catch (error: any) {
    console.error("Error during admin login process:", error);
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 });
  }
}
