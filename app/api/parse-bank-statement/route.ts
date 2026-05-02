import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file_url, employee_name } = body;

    if (!file_url) {
      return NextResponse.json(
        { error: "file_url is required" },
        { status: 400 }
      );
    }

    const response = await fetch("http://37.27.113.235:8231/parse_bank_statement/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_url,
        employee_name: employee_name ?? [],
      }),
    });

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
