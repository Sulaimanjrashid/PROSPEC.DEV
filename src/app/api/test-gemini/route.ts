import { NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyBWx_wJ_wwVDjJXE3TM2droNOmaULxyoQ0"

export async function GET() {
  try {
    console.log("[Test Gemini] Testing Gemini 2.5 Flash API...")
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Say hello and confirm you can access Google Search",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
      },
      tools: [
        {
          google_search: {}
        }
      ]
    }

    console.log("[Test Gemini] Making API request...")
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )

    console.log("[Test Gemini] Response status:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Test Gemini] Error response:", errorText)
      return NextResponse.json({
        success: false,
        error: `API request failed: ${response.status}`,
        details: errorText
      }, { status: 500 })
    }

    const data = await response.json()
    console.log("[Test Gemini] Response received:", JSON.stringify(data, null, 2))

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    return NextResponse.json({
      success: true,
      response: generatedText,
      fullData: data
    })

  } catch (error) {
    console.error("[Test Gemini] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

