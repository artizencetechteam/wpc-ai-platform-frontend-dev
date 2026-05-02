import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Forward to the external API
    const response = await fetch("https://wpc-ai-agents-1.onrender.com/bank_statement_extraction_upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API Error:", errorText);
      return NextResponse.json(
        { error: "API extraction failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Bank Statement Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal server error during extraction", details: error.message },
      { status: 500 }
    );
  }
}
