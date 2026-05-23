import { NextResponse } from "next/server";

const BANK_RTW_BASE_URL = process.env.BANK_RTW_BASE_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward to the external API
    if (!BANK_RTW_BASE_URL) {
      return NextResponse.json(
        { error: "Missing BANK_RTW_BASE_URL env var" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${BANK_RTW_BASE_URL.replace(/\/$/, "")}/late_employee_verification/`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External Late Employee Verification API Error:", errorText);
      return NextResponse.json(
        { error: "Verification failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Late Employee Verification Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification", details: error.message },
      { status: 500 }
    );
  }
}
