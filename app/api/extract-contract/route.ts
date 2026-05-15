import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pdfUrl = body?.pdf_url;

    if (!pdfUrl || typeof pdfUrl !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid pdf_url" },
        { status: 400 }
      );
    }

    // Forward to the external API
    const response = await fetch("http://37.27.113.235:8365/contract_url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_url: pdfUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External Contract API Error:", errorText);
      return NextResponse.json(
        { error: "Contract extraction failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Contract Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error during contract extraction", details: error.message },
      { status: 500 }
    );
  }
}
