import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Forward to the external API
    const response = await fetch("https://wpc-ai-agents-1.onrender.com/rtw/extract", {
      method: "POST",
      body: formData,
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
