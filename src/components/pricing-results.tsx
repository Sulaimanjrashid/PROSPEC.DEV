"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Star, Calculator } from "lucide-react"
import { fetchCompareOptions, type ProductOption } from "@/lib/serpapi-service"
import APIRateLimiter from "@/lib/api-rate-limiter"
import PricingAdjustments from "./pricing-adjustments"

interface PricingResult {
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
  productOptions?: ProductOption[]
}

interface PricingResultsProps {
  results: PricingResult[]
  isLoading: boolean
  projectDescription?: string
  priceScale?: string
  location?: string
  onReplaceItem?: (originalItem: PricingResult, replacementOption: ProductOption, updateCompareOptions: (itemKey: string, updatedOptions: ProductOption[]) => void) => void
  isLoadingPricing?: boolean
  onStopPricing?: () => void
  apiUsageStats?: {
    callsUsed: number
    callsRemaining: number
    maxCalls: number
    sessionAge: number
  }
  onApiUsageUpdate?: (stats: {
    callsUsed: number
    callsRemaining: number
    maxCalls: number
    sessionAge: number
  }) => void
}

export default function PricingResults({ results, isLoading, projectDescription, priceScale, location, onReplaceItem, isLoadingPricing, onStopPricing, apiUsageStats: passedApiUsageStats, onApiUsageUpdate }: PricingResultsProps) {
  // Debug: Log the results to see what links we're getting
  console.log('PricingResults received:', results)
  console.log('PricingResults isLoading:', isLoading)
  
  // State for tracking expanded items and their compare options
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [compareOptions, setCompareOptions] = useState<Map<string, ProductOption[]>>(new Map())
  const [loadingCompare, setLoadingCompare] = useState<Set<string>>(new Set())
  
  // State for animated total cost
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [targetTotal, setTargetTotal] = useState(0)
  
  // State for pricing adjustments
  const [showPricingAdjustments, setShowPricingAdjustments] = useState(false)
  
  // Use passed API usage stats or fallback to local tracking
  const [localApiUsageStats, setLocalApiUsageStats] = useState({ 
    callsUsed: 0, 
    callsRemaining: 50, 
    maxCalls: 50,
    sessionAge: 0
  })

  // Update local API usage stats for compare calls
  const updateLocalApiUsageStats = () => {
    if (typeof window !== 'undefined') {
      const rateLimiter = APIRateLimiter.getInstance()
      const stats = rateLimiter.getSessionStats()
      setLocalApiUsageStats({
        callsUsed: stats.callsUsed,
        callsRemaining: stats.callsRemaining,
        maxCalls: stats.maxCalls,
        sessionAge: stats.sessionAge
      })
    }
  }

  // Use passed stats if available, otherwise use local stats
  const apiUsageStats = passedApiUsageStats || localApiUsageStats

  // Update local stats on mount if no passed stats
  useEffect(() => {
    if (!passedApiUsageStats) {
      updateLocalApiUsageStats()
    }
  }, [passedApiUsageStats])

  // Use results directly since they now contain the loading state
  const displayItems = results

  // Calculate the actual total cost
  const totalProjectCost = displayItems
    .filter((result) => result.totalCost !== null)
    .reduce((sum, result) => sum + (result.totalCost || 0), 0)

  // Animation effect for the total cost
  useEffect(() => {
    setTargetTotal(totalProjectCost)
  }, [totalProjectCost])

  useEffect(() => {
    if (targetTotal !== animatedTotal) {
      const startValue = animatedTotal
      const endValue = targetTotal
      const duration = 800 // 800ms animation
      const startTime = Date.now()

      const animate = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Use easeOutQuart for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 4)
        const currentValue = startValue + (endValue - startValue) * easeProgress
        
        setAnimatedTotal(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }
  }, [targetTotal, animatedTotal])

  // Helper function to format currency with commas
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleCompareClick = async (result: PricingResult) => {
    const itemKey = `${result.itemName}-${result.quantity}`
    
    if (expandedItems.has(itemKey)) {
      // Collapse if already expanded
      const newExpanded = new Set(expandedItems)
      newExpanded.delete(itemKey)
      setExpandedItems(newExpanded)
    } else {
      // Expand and fetch compare options if not already fetched
      const newExpanded = new Set(expandedItems)
      newExpanded.add(itemKey)
      setExpandedItems(newExpanded)
      
      if (!compareOptions.has(itemKey)) {
        const newLoading = new Set(loadingCompare)
        newLoading.add(itemKey)
        setLoadingCompare(newLoading)
        
        try {
          const compareResult = await fetchCompareOptions(
            result.itemName,
            result.quantity,
            projectDescription,
            priceScale,
            location
          )
          
          if (compareResult.success && compareResult.productOptions) {
            const newOptions = new Map(compareOptions)
            newOptions.set(itemKey, compareResult.productOptions)
            setCompareOptions(newOptions)
          }
          
          // Update API usage stats if provided in the response
          if (compareResult.apiUsageStats) {
            if (passedApiUsageStats && onApiUsageUpdate) {
              // If we have passed stats, notify parent to update them
              onApiUsageUpdate(compareResult.apiUsageStats)
            } else {
              // If no passed stats, update local stats
              setLocalApiUsageStats({
                callsUsed: compareResult.apiUsageStats.callsUsed,
                callsRemaining: compareResult.apiUsageStats.callsRemaining,
                maxCalls: compareResult.apiUsageStats.maxCalls,
                sessionAge: compareResult.apiUsageStats.sessionAge
              })
            }
          }
        } catch (error) {
          console.error("Error fetching compare options:", error)
        } finally {
          const newLoading = new Set(loadingCompare)
          newLoading.delete(itemKey)
          setLoadingCompare(newLoading)
        }
      }
    }
  }
  
  // Don't show global loading anymore - individual items will show their own loading state
  if (isLoading && (!results || results.length === 0)) {
    return (
      <Card className="bg-neutral-900 border-neutral-700 mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PRICING ANALYSIS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-sm text-neutral-400">Preparing pricing analysis...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const itemsWithPricing = displayItems.filter((result) => result.price !== null).length
  const totalItems = displayItems.length

  return (
    <>
    <Card className="bg-neutral-900 border-neutral-700 mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PRICING ANALYSIS</CardTitle>
            <div className="text-xs text-neutral-500">
              Found pricing for {itemsWithPricing} of {totalItems} items from Google Shopping
            </div>
          </div>
          {isLoadingPricing && onStopPricing && (
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs"
              onClick={onStopPricing}
            >
              Stop
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-neutral-800 rounded border border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Estimated Total Cost</h3>
              <p className="text-xs text-neutral-400">Based on lowest available prices</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500 tabular-nums">
                {formatCurrency(animatedTotal)}
              </div>
              {itemsWithPricing < totalItems && <div className="text-xs text-neutral-500">+ items without pricing</div>}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {displayItems.map((result, index) => {
            const itemKey = `${result.itemName}-${result.quantity}`
            const isExpanded = expandedItems.has(itemKey)
            const isLoadingOptions = loadingCompare.has(itemKey)
            const options = compareOptions.get(itemKey) || []
            const isItemLoading = (result as PricingResult & { isLoading?: boolean }).isLoading || false
            
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  result.price !== null ? "bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800 hover:border-neutral-600" : "bg-neutral-800/30 border-neutral-700/30"
                }`}
              >
                {/* Main Product Row */}
                {isItemLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-orange-500" />
                        <span className="text-xs font-medium px-2 py-1 rounded bg-neutral-700 text-neutral-300">
                          Searching...
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{result.itemName}</h4>
                        <span className="text-xs text-neutral-500 shrink-0">× {result.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neutral-400">--.--</div>
                    </div>
                  </div>
                ) : result.price !== null ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-white truncate">{result.itemName}</h4>
                        <span className="text-xs text-neutral-500 shrink-0">× {result.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-500 tabular-nums">
                            {formatCurrency(result.totalCost || 0)}
                          </div>
                          <div className="text-xs text-neutral-500 tabular-nums">
                            {formatCurrency(result.price)} each
                          </div>
                        </div>
                        {result.hasMoreOptions && (
                          <button
                            onClick={() => handleCompareClick(result)}
                            disabled={isLoadingOptions}
                            className="text-xs px-2 py-1 rounded border bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-300 transition-all disabled:opacity-50 shrink-0"
                          >
                            {isLoadingOptions ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-500" />
                            ) : isExpanded ? (
                              "hide"
                            ) : (
                              "compare"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Product Details Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-700/30">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-xs text-neutral-400 truncate flex-1">
                          {result.productTitle}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 shrink-0">
                          {result.brand && <span>{result.brand}</span>}
                          {result.source && <span>{result.source}</span>}
                          {result.rating && result.reviews && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span>{result.rating.toFixed(1)}</span>
                              <span>({result.reviews})</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {result.link && (
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-orange-500 ml-3 shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-white">{result.itemName}</h4>
                      <span className="text-xs text-neutral-500">× {result.quantity}</span>
                    </div>
                    <div className="text-sm text-neutral-500">Price not found</div>
                  </div>
                )}

                {/* Expanded Compare Options */}
                {isExpanded && result.price !== null && (
                  <div className="mt-3 pt-3 border-t border-neutral-700/30 space-y-2">
                    {options.length > 0 ? (
                      options.slice(1).map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="p-2 rounded border bg-neutral-700/30 border-neutral-600/30 hover:bg-neutral-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="text-xs text-neutral-400 truncate flex-1">
                                {option.productTitle}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-neutral-500 shrink-0">
                                {option.brand && <span>{option.brand}</span>}
                                {option.source && <span>{option.source}</span>}
                                {option.rating && option.reviews && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    <span>{option.rating.toFixed(1)}</span>
                                    <span>({option.reviews})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <div className="text-sm font-bold text-orange-500 tabular-nums">
                                  {formatCurrency(option.totalCost)}
                                </div>
                                <div className="text-xs text-neutral-500 tabular-nums">
                                  {formatCurrency(option.price)} each
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {onReplaceItem && (
                                  <button
                                    onClick={() => {
                                      const itemKey = `${result.itemName}-${result.quantity}`
                                      const currentOptions = compareOptions.get(itemKey) || []
                                      
                                      // Create a new ProductOption from the current main item
                                      const originalAsOption: ProductOption = {
                                        productTitle: result.productTitle || 'Original Item',
                                        price: result.price || 0,
                                        totalCost: result.totalCost || 0,
                                        brand: result.brand,
                                        rating: result.rating,
                                        reviews: result.reviews,
                                        link: result.link || '',
                                        source: result.source,
                                        condition: result.condition,
                                        rank: 1 // Set as rank 1 when swapped back
                                      }

                                      // Replace the selected option with the original item in the alternatives
                                      const updatedOptions = currentOptions.map(opt => 
                                        opt.productTitle === option.productTitle && 
                                        opt.price === option.price
                                          ? originalAsOption
                                          : opt
                                      )

                                      // Update the compare options first
                                      setCompareOptions(prev => {
                                        const newMap = new Map(prev)
                                        newMap.set(itemKey, updatedOptions)
                                        return newMap
                                      })

                                      // Then call the replacement handler
                                      const updateCompareOptions = (itemKey: string, updatedOptions: ProductOption[]) => {
                                        setCompareOptions(prev => {
                                          const newMap = new Map(prev)
                                          newMap.set(itemKey, updatedOptions)
                                          return newMap
                                        })
                                      }
                                      onReplaceItem(result, option, updateCompareOptions)
                                    }}
                                    className="text-xs px-2 py-1 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-300 transition-all shrink-0"
                                  >
                                    replace
                                  </button>
                                )}
                                <a
                                  href={option.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-orange-500 shrink-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded border bg-neutral-700/20 border-neutral-600/20">
                        <div className="text-sm text-neutral-500 text-center">
                          Searching for additional options...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* API Usage Tracker - Minimal */}
        <div className="mt-4 px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">API Usage</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono ${
                apiUsageStats.callsRemaining < 10 ? 'text-orange-400' : 
                apiUsageStats.callsRemaining === 0 ? 'text-red-400' : 
                'text-neutral-300'
              }`}>
                {apiUsageStats.callsUsed}/{apiUsageStats.maxCalls}
              </span>

              <div className="w-16 bg-neutral-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    apiUsageStats.callsRemaining < 10 ? 'bg-orange-500' : 
                    apiUsageStats.callsRemaining === 0 ? 'bg-red-500' : 
                    'bg-neutral-500'
                  }`}
                  style={{ width: `${(apiUsageStats.callsUsed / apiUsageStats.maxCalls) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Show item success rate only if some items failed */}
          {itemsWithPricing < totalItems && (
            <div className="mt-1 text-xs text-neutral-500">
              {itemsWithPricing}/{totalItems} items priced
            </div>
          )}
        </div>

        {/* Final Cost Calculation Button */}
        <div className="mt-6 pt-4 border-t border-neutral-700">
          <Button
            onClick={() => setShowPricingAdjustments(!showPricingAdjustments)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {showPricingAdjustments ? "Hide Final Cost Calculator" : "Calculate Final Project Cost"}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Pricing Adjustments Component */}
    {showPricingAdjustments && (
      <PricingAdjustments 
        pricingResults={results}
      />
    )}
  </>
  )
}
