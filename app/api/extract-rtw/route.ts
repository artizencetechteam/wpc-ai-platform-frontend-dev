import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { file_url } = await req.json();
    
    if (!file_url) {
      return NextResponse.json({ error: "Missing file_url" }, { status: 400 });
    }

    // Forward to the new external API
    const response = await fetch("http://37.27.113.235:8231/parse_rtw_work_document/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External RTW API Error:", errorText);
      return NextResponse.json(
        { error: "RTW extraction failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("RTW Extraction Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error during RTW extraction", details: error.message },
      { status: 500 }
    );
  }
}
