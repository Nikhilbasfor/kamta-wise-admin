export async function verifyUserToken(request: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.slice(7);
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("Firebase API Key is missing in environment variables.");
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const user = data.users?.[0];
    if (!user) {
      return null;
    }

    return {
      uid: user.localId,
      email: user.email,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
