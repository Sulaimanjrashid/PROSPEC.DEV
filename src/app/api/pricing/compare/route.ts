import { type NextRequest, NextResponse } from "next/server"
import APIRateLimiter from "@/lib/api-rate-limiter"

const SERPAPI_KEY = "01bc6a76122a87415956be0402edcd29988b2e94a2695b2a42dde9f148b49b27"
const GEMINI_API_KEY = "AIzaSyBWx_wJ_wwVDjJXE3TM2droNOmaULxyoQ0"

interface GoogleShoppingProduct {
  position: number
  product_id: string
  title: string
  price?: string
  extracted_price?: number
  original_price?: string
  brand?: string
  rating?: number
  reviews?: number
  product_link: string
  link?: string
  relevanceScore?: number
  availability?: string
  in_stock?: boolean
  source?: string
  delivery?: string
  condition?: string
  snippet?: string
  extensions?: string[]
  thumbnail?: string
}

interface GoogleSearchResponse {
  shopping_results?: GoogleShoppingProduct[]
  search_metadata: {
    status: string
  }
}

// Helper function to parse price from string or number
const parsePrice = (price: string | number | undefined): number | null => {
  if (typeof price === 'number') return price
  if (typeof price === 'string') {
    // Remove currency symbols and whitespace, then parse
    const cleaned = price.replace(/[$,€£¥]/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

// Helper function to ensure we have a valid, absolute URL
const ensureValidUrl = (link: string | undefined): string => {
  if (!link) return ''
  
  // If it's already an absolute URL, return as is
  if (link.startsWith('http://') || link.startsWith('https://')) {
    return link
  }
  
  // If it's a relative URL, make it absolute
  if (link.startsWith('/')) {
    return `https://www.google.com${link}`
  }
  
  // If it's a Google Shopping URL, ensure it's complete
  if (link.includes('google.com/shopping')) {
    return link.startsWith('http') ? link : `https://${link}`
  }
  
  // Default fallback
  return link
}

function createSearchQuery(itemName: string): string {
  // Clean up and optimize the search query
  const query = itemName.trim().toLowerCase()
  
  console.log('[v0] Original item name:', itemName)
  
  // Remove common filler words that might confuse search
  const fillerWords = ['for', 'the', 'a', 'an', 'with', 'of', 'in', 'on', 'at']
  const words = query.split(' ').filter(word => !fillerWords.includes(word))
  
  // Enhance search terms for better matching
  const enhancedWords = words.map(word => {
    // Map common construction terms to Home Depot terminology
    const termMap: { [key: string]: string } = {
      'lumber': 'wood lumber',
      'posts': 'post',
      'rails': 'rail',
      'boards': 'board',
      'concrete': 'concrete mix',
      'gravel': 'gravel aggregate',
      'nails': 'nail',
      'screws': 'screw',
      'bolts': 'bolt'
    }
    return termMap[word] || word
  })
  
  const finalQuery = enhancedWords.join(' ')
  console.log('[v0] Enhanced search query:', finalQuery)
  return finalQuery
}

async function selectTop3ProductsWithAI(
  products: GoogleShoppingProduct[], 
  searchItem: { name: string; quantity: number },
  projectDescription?: string,
  priceScale?: string,
  location?: string
): Promise<GoogleShoppingProduct[]> {
  if (!products || products.length === 0) {
    return []
  }

  // Filter for products with valid prices and stock
  const validProducts = products.filter((product) => {
    // Use extracted_price if available, otherwise parse the price string
    const priceValue = product.extracted_price || parsePrice(product.price)
    const hasPrice = priceValue !== null && priceValue > 0
    
    // For Google Shopping, we'll be more lenient with stock checking
    // since availability info might not be as reliable
    const isInStock = !product.availability || 
                    !product.availability.toLowerCase().includes('out of stock') ||
                    !product.availability.toLowerCase().includes('unavailable')
    
    console.log(`[v0] Product validation: "${product.title}" - Price: ${product.price} (extracted: ${product.extracted_price}) -> ${priceValue}, HasPrice: ${hasPrice}, InStock: ${isInStock}`)
    
    return hasPrice && isInStock
  })

  if (validProducts.length === 0) {
    console.log('[v0] AI: No valid products (with price & in stock) found')
    return []
  }

  // Limit to top 15 products to get more options for selection
  const topProducts = validProducts.slice(0, 15)

  const prompt = `
You are an expert construction materials consultant with deep knowledge of building projects, materials science, and product selection. Your job is to select the TOP 3 BEST products from Google Shopping search results based on the specific project context.

PROJECT CONTEXT: ${projectDescription || 'No specific project context provided'}
PRICE SCALE PREFERENCE: ${priceScale || '$$'} (${priceScale === '$' ? 'Budget/Economy' : priceScale === '$$' ? 'Mid-Range/Standard' : 'Premium/High-End'})
LOCATION: ${location || 'US'} - Consider regional availability and shipping costs

SEARCH ITEM: ${searchItem.name}
QUANTITY NEEDED: ${searchItem.quantity}

AVAILABLE PRODUCTS:
${topProducts.map((product, index) => `
${index + 1}. ${product.title}
   Price: $${product.price}
   Brand: ${product.brand || 'Unknown'}
   Rating: ${product.rating ? `${product.rating}/5 (${product.reviews} reviews)` : 'No rating'}
   Source: ${product.source || 'Unknown'}
   Condition: ${product.condition || 'Unknown'}
   Link: ${product.link}
`).join('')}

TASK: Select the TOP 3 BEST products considering the PROJECT CONTEXT and these factors:

**PROJECT-RELATED CONSIDERATIONS:**
- **Environment**: Indoor vs outdoor use (e.g., outdoor stain vs interior paint)
- **Exposure**: Weather resistance, UV protection, moisture resistance
- **Load-bearing**: Structural requirements, weight capacity
- **Durability**: Expected lifespan, wear resistance
- **Safety**: Code compliance, fire resistance, toxicity
- **Installation**: Ease of installation, required tools/skills
- **Maintenance**: Long-term care requirements

**PRODUCT-SPECIFIC FACTORS:**
- **Exact match**: Does it exactly match the requested item?
- **Quality**: Appropriate grade/quality for the application
- **Size/dimensions**: Correct specifications for the project
- **Material compatibility**: Works with other materials in the project
- **Price**: Good value for the quality and application (considering price scale preference)
- **Availability**: In stock and accessible
- **Brand reputation**: Reliable manufacturer
- **Reviews**: Customer satisfaction and performance
- **Source reliability**: Trusted retailers and suppliers
- **Condition**: New vs used, quality assurance

**PRICE SCALE CONSIDERATIONS:**
- **$ (Budget/Economy)**: Prioritize lower-cost options, value brands, basic quality that meets minimum requirements
- **$$ (Mid-Range/Standard)**: Balance of quality and price, well-known brands, good value for money
- **$$$ (Premium/High-End)**: High-quality materials, premium brands, superior performance and durability

**EXAMPLES OF SMART DECISION-MAKING:**
- For a fence project: Choose outdoor-rated stain, not interior paint
- For a deck: Select pressure-treated lumber, not untreated
- For a roof: Choose roofing nails, not regular nails
- For a bathroom: Choose moisture-resistant materials
- For structural work: Choose load-rated fasteners
- For electrical: Choose code-compliant materials
- Prefer major retailers (Home Depot, Lowe's, etc.) for construction materials
- Consider shipping costs and delivery times

RESPONSE FORMAT: Return ONLY a JSON object with this exact structure:
{
  "top3Products": [
    {
      "productIndex": <number between 1-${topProducts.length}>,
      "rank": 1,
      "reasoning": "<detailed explanation considering project context, why this product is the best choice>",
      "confidence": <number between 1-10, where 10 is very confident>,
      "projectConsiderations": "<specific project-related factors that influenced this choice>"
    },
    {
      "productIndex": <number between 1-${topProducts.length}>,
      "rank": 2,
      "reasoning": "<detailed explanation considering project context, why this product is the second best choice>",
      "confidence": <number between 1-10, where 10 is very confident>,
      "projectConsiderations": "<specific project-related factors that influenced this choice>"
    },
    {
      "productIndex": <number between 1-${topProducts.length}>,
      "rank": 3,
      "reasoning": "<detailed explanation considering project context, why this product is the third best choice>",
      "confidence": <number between 1-10, where 10 is very confident>,
      "projectConsiderations": "<specific project-related factors that influenced this choice>"
    }
  ]
}

If fewer than 3 products are suitable, return only the suitable ones. If no products are suitable, return:
{
  "top3Products": []
}

IMPORTANT: Return ONLY valid JSON, no additional text or formatting.
`

  try {
    console.log('[v0] AI: Sending request to Gemini for product selection')
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      console.error('[v0] AI: Gemini API request failed:', response.status)
      return []
    }

    const data = await response.json()
    const generatedText = data.candidates[0].content.parts[0].text

    console.log('[v0] AI: Raw Gemini response:', generatedText)

    // Clean up the response
    const cleanedText = generatedText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
    
    // Extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[v0] AI: No JSON found in response:', cleanedText)
      console.log('[v0] AI: Using fallback due to no JSON')
      return validProducts.slice(0, 3)
    }

    let aiSelection
    try {
      aiSelection = JSON.parse(jsonMatch[0])
      console.log('[v0] AI: Parsed selection:', aiSelection)
    } catch (parseError) {
      console.error('[v0] AI: JSON parse error:', parseError)
      console.log('[v0] AI: Using fallback due to parse error')
      return validProducts.slice(0, 3)
    }

    if (!aiSelection.top3Products || aiSelection.top3Products.length === 0) {
      console.log('[v0] AI: No suitable products found, using fallback')
      // Fallback: return first 3 valid products if AI returns empty
      return validProducts.slice(0, 3)
    }

    const selectedProducts: GoogleShoppingProduct[] = []
    
    for (const selection of aiSelection.top3Products) {
      if (selection.productIndex < 1 || selection.productIndex > topProducts.length) {
        console.error('[v0] AI: Invalid product index:', selection.productIndex)
        continue
      }
      
      const selectedProduct = topProducts[selection.productIndex - 1]
      console.log(`[v0] AI: Rank ${selection.rank} product:`, selectedProduct.title)
      console.log(`[v0] AI: Reasoning:`, selection.reasoning)
      console.log(`[v0] AI: Confidence:`, selection.confidence)
      
      selectedProducts.push(selectedProduct)
    }

    return selectedProducts

  } catch (error) {
    console.error('[v0] AI: Error in Gemini API call:', error)
    // Fallback: return first 3 valid products if AI fails
    console.log('[v0] AI: Using fallback - returning first 3 valid products')
    return validProducts.slice(0, 3)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { itemName, quantity, projectDescription, priceScale, location, clientSessionData } = await request.json()

    if (!itemName) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 })
    }

    // Check API rate limit and sync with client session if provided
    const rateLimiter = APIRateLimiter.getInstance()
    
    // If client provides session data, sync server session with it
    if (clientSessionData && typeof clientSessionData === 'object') {
      console.log('[v0] Compare: Syncing with client session data:', clientSessionData)
      rateLimiter.syncWithClientSession(clientSessionData)
    }
    if (!rateLimiter.canMakeCall()) {
      console.warn("[v0] Compare: API rate limit exceeded")
      return NextResponse.json({ 
        error: "API rate limit exceeded. Maximum 50 searches per session.",
        rateLimitExceeded: true,
        remainingCalls: rateLimiter.getRemainingCalls()
      }, { status: 429 })
    }

    // Record the API call
    if (!rateLimiter.recordCall()) {
      console.warn("[v0] Compare: Failed to record API call")
      return NextResponse.json({ 
        error: "API rate limit exceeded",
        rateLimitExceeded: true
      }, { status: 429 })
    }

    console.log("[v0] Compare: Starting SerpAPI pricing search for:", itemName)

    const searchQuery = createSearchQuery(itemName)
    console.log("[v0] Compare: Searching with query:", searchQuery)

    const params = new URLSearchParams({
      engine: "google_shopping",
      q: searchQuery,
      api_key: SERPAPI_KEY,
      gl: "us", // Always use US for Google Shopping
      hl: "en", // Language
      num: "20", // Number of results
      safe: "active",
    })
    
    console.log('[v0] Compare: Full API URL:', `https://serpapi.com/search.json?${params}`)

    const response = await fetch(`https://serpapi.com/search.json?${params}`)

    if (!response.ok) {
      console.error("[v0] Compare: Google Shopping API request failed:", response.status, response.statusText)
      return NextResponse.json({ error: `API request failed: ${response.status}` }, { status: 500 })
    }

    const data: GoogleSearchResponse = await response.json()

    console.log("[v0] Compare: Google Shopping API Response status:", data.search_metadata?.status)
    console.log("[v0] Compare: Raw shopping results found:", data.shopping_results?.length || 0)

    if (data.shopping_results && data.shopping_results.length > 0) {
      // Use AI to select the top 3 products
      const top3Products = await selectTop3ProductsWithAI(
        data.shopping_results, 
        { name: itemName, quantity: quantity || 1 },
        projectDescription, 
        priceScale,
        location
      )
      
      if (top3Products && top3Products.length > 0) {
        console.log(
          "[v0] Compare: AI SELECTED top 3 products for:",
          itemName,
          "Found",
          top3Products.length,
          "products"
        )

        // Return all 3 options for comparison
        const productOptions = top3Products.map((product, index) => {
          // Use extracted_price if available, otherwise parse the price string
          const priceValue = product.extracted_price || parsePrice(product.price) || 0
          // Use product_link as the primary link, fallback to link
          const productLink = product.product_link || product.link || ''
          const validLink = ensureValidUrl(productLink)
          console.log(`[v0] Compare option ${index + 1} - Original link: ${productLink} - Valid link: ${validLink}`)
          return {
            rank: index + 1,
            price: priceValue,
            totalCost: priceValue * (quantity || 1),
            productTitle: product.title,
            brand: product.brand,
            rating: product.rating,
            reviews: product.reviews,
            link: validLink,
            source: product.source,
            condition: product.condition,
          }
        })

        // Include current API usage stats in response
        const finalStats = rateLimiter.getSessionStats()
        
        return NextResponse.json({ 
          success: true,
          itemName,
          quantity: quantity || 1,
          productOptions,
          apiUsageStats: {
            callsUsed: finalStats.callsUsed,
            callsRemaining: finalStats.callsRemaining,
            maxCalls: finalStats.maxCalls,
            sessionAge: finalStats.sessionAge
          }
        })
      } else {
        console.log("[v0] Compare: AI found no suitable products for:", itemName)
        return NextResponse.json({ 
          success: false,
          error: "No suitable products found for comparison" 
        }, { status: 404 })
      }
    } else {
      console.log("[v0] Compare: No products found for:", itemName)
      return NextResponse.json({ 
        success: false,
        error: "No products found" 
      }, { status: 404 })
    }
  } catch (error) {
    console.error("[v0] Compare: API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
