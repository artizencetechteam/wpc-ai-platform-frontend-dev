import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward to the external API
    const response = await fetch("https://wpc-ai-agents-1.onrender.com/verify-contracts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External Verify Contracts API Error:", errorText);
      return NextResponse.json(
        { error: "Verification failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Verify Contracts Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification", details: error.message },
      { status: 500 }
    );
  }
}
