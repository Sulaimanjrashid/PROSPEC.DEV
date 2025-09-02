// const SERPAPI_KEY = "01bc6a76122a87415956be0402edcd29988b2e94a2695b2a42dde9f148b49b27"

// interface SerpApiProduct {
//   position: number
//   product_id: string
//   title: string
//   price?: number
//   price_was?: number
//   brand?: string
//   rating?: number
//   reviews?: number
//   link: string
// }

// interface SerpApiResponse {
//   products?: SerpApiProduct[]
//   search_metadata: {
//     status: string
//   }
// }

export interface PricingResult {
  itemName: string
  quantity: number
  price: number | null
  totalCost: number | null
  productTitle?: string
  brand?: string
  rating?: number
  reviews?: number
  link?: string
  source?: string
  condition?: string
  hasMoreOptions?: boolean
  error?: string
  isLoading?: boolean
}

export interface ProductOption {
  rank: number
  price: number
  totalCost: number
  productTitle: string
  brand?: string
  rating?: number
  reviews?: number
  link: string
  source?: string
  condition?: string
}

export interface CompareResult {
  success: boolean
  itemName: string
  quantity: number
  productOptions?: ProductOption[]
  error?: string
  apiUsageStats?: {
    callsUsed: number
    callsRemaining: number
    maxCalls: number
    sessionAge: number
  }
}

export async function searchHomeDepotPricing(
  items: Array<{ name: string; quantity: number }>,
  projectDescription?: string,
  priceScale?: string,
  location?: string,
): Promise<PricingResult[]> {
  console.log("[v0] Starting SerpAPI pricing search for", items.length, "items")

  try {
    // Get current client session data to sync with server
    let clientSessionData = null
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('prospec-serp-api-session')
        if (stored) {
          clientSessionData = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('[v0] Could not read client session data:', error)
      }
    }

    const response = await fetch("/api/search-pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        items, 
        projectDescription, 
        priceScale, 
        location,
        clientSessionData 
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 429 && data.rateLimitExceeded) {
        throw new Error(`API rate limit exceeded. Maximum 50 searches per session. Remaining calls: ${data.remainingCalls || 0}`)
      }
      throw new Error(`API request failed: ${response.status}`)
    }

    if (data.error) {
      throw new Error(data.error)
    }

    console.log(
      "[v0] Pricing search completed. Found prices for",
      data.results.filter((r: PricingResult) => r.price !== null).length,
      "out of",
      data.results.length,
      "items",
    )

    // Update client-side rate limiter with server stats if provided
    if (data.apiUsageStats && typeof window !== 'undefined') {
      console.log('[v0] Server returned API stats:', data.apiUsageStats)
      const rateLimiter = (await import('@/lib/api-rate-limiter')).default.getInstance()
      // Force update the client-side session data to match server
      const sessionData = {
        apiCallCount: data.apiUsageStats.callsUsed,
        sessionStartTime: Date.now() - data.apiUsageStats.sessionAge,
        lastCallTime: Date.now()
      }
      console.log('[v0] Updating localStorage with session data:', sessionData)
      localStorage.setItem('prospec-serp-api-session', JSON.stringify(sessionData))
      console.log('[v0] Updated client-side API usage stats:', data.apiUsageStats)
      
      // Verify the localStorage was updated
      const savedData = localStorage.getItem('prospec-serp-api-session')
      console.log('[v0] Verified localStorage content:', savedData)
    } else {
      console.log('[v0] No API stats in response or not in browser context')
    }

    return data.results
  } catch (error) {
    console.error("[v0] Error in pricing search:", error)

    // Return empty results with error info
    return items.map((item) => ({
      itemName: item.name,
      quantity: item.quantity,
      price: null,
      totalCost: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }))
  }
}

export async function fetchCompareOptions(
  itemName: string,
  quantity: number,
  projectDescription?: string,
  priceScale?: string,
  location?: string,
): Promise<CompareResult> {
  console.log("[v0] Fetching compare options for:", itemName)

  try {
    // Get current client session data to sync with server
    let clientSessionData = null
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('prospec-serp-api-session')
        if (stored) {
          clientSessionData = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('[v0] Could not read client session data:', error)
      }
    }

    const response = await fetch("/api/compare-pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        itemName, 
        quantity, 
        projectDescription, 
        priceScale, 
        location,
        clientSessionData 
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 429 && data.rateLimitExceeded) {
        throw new Error(`API rate limit exceeded. Maximum 50 searches per session. Remaining calls: ${data.remainingCalls || 0}`)
      }
      throw new Error(`API request failed: ${response.status}`)
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch compare options")
    }

    console.log(
      "[v0] Compare options fetched successfully for:",
      itemName,
      "Found",
      data.productOptions?.length || 0,
      "options",
    )

    // Update client-side rate limiter with server stats if provided
    if (data.apiUsageStats && typeof window !== 'undefined') {
      const rateLimiter = (await import('@/lib/api-rate-limiter')).default.getInstance()
      // Force update the client-side session data to match server
      const sessionData = {
        apiCallCount: data.apiUsageStats.callsUsed,
        sessionStartTime: Date.now() - data.apiUsageStats.sessionAge,
        lastCallTime: Date.now()
      }
      localStorage.setItem('prospec-serp-api-session', JSON.stringify(sessionData))
      console.log('[v0] Updated client-side API usage stats from compare:', data.apiUsageStats)
    }

    return data
  } catch (error) {
    console.error("[v0] Error in fetching compare options:", error)

    return {
      success: false,
      itemName,
      quantity,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
