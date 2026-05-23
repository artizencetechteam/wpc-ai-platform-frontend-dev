import { NextResponse } from "next/server";

const BANK_RTW_BASE_URL = process.env.BANK_RTW_BASE_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file_url, employee_name , bank_name } = body;

    if (!file_url) {
      return NextResponse.json(
        { error: "file_url is required" },
        { status: 400 }
      );
    }

    if (!BANK_RTW_BASE_URL) {
      return NextResponse.json(
        { error: "Missing BANK_RTW_BASE_URL env var" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${BANK_RTW_BASE_URL.replace(/\/$/, "")}/parse_bank_statement/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url,
          employee_name: employee_name ?? [],
          bank_name: bank_name ?? "Other bank",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External AI parse error:", errorText);
      return NextResponse.json(
        { error: "AI parsing failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Parse bank statement proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
