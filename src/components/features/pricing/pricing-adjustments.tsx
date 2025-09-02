"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calculator, Receipt, Plus, X, Download } from "lucide-react"

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
  error?: string
}

interface CustomFee {
  id: string
  name: string
  amount: number
}

interface PricingAdjustmentsProps {
  pricingResults: PricingResult[]
}

export default function PricingAdjustments({ pricingResults }: PricingAdjustmentsProps) {
  // Labor inputs
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1)
  const [costPerHour, setCostPerHour] = useState<number>(25)
  const [totalHours, setTotalHours] = useState<number>(8)

  // Markup inputs
  const [generalMarkup, setGeneralMarkup] = useState<number>(15)
  const [customFees, setCustomFees] = useState<CustomFee[]>([])

  // Receipt state
  const [showReceipt, setShowReceipt] = useState(false)

  // Calculate material costs
  const materialCost = pricingResults.reduce((total, item) => {
    return total + (item.totalCost || 0)
  }, 0)

  // Calculate labor cost
  const laborCost = numberOfPeople * costPerHour * totalHours

  // Calculate custom fees total
  const customFeesTotal = customFees.reduce((total, fee) => total + fee.amount, 0)

  // Calculate markup on materials
  const markupAmount = (materialCost * generalMarkup) / 100

  // Calculate final total
  const finalTotal = materialCost + laborCost + customFeesTotal + markupAmount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleAddCustomFee = () => {
    const newFee: CustomFee = {
      id: Date.now().toString(),
      name: "",
      amount: 0
    }
    setCustomFees([...customFees, newFee])
  }

  const handleUpdateCustomFee = (id: string, field: 'name' | 'amount', value: string | number) => {
    setCustomFees(customFees.map(fee => 
      fee.id === id ? { ...fee, [field]: value } : fee
    ))
  }

  const handleRemoveCustomFee = (id: string) => {
    setCustomFees(customFees.filter(fee => fee.id !== id))
  }

  const handleCalculateFinalCost = () => {
    setShowReceipt(true)
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Toggle Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowReceipt(!showReceipt)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {showReceipt ? "Edit Calculations" : "Calculate Final Cost"}
        </Button>
      </div>

      {/* Two Side-by-Side Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Box - Labor & Markup Inputs */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              COST ADJUSTMENTS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Labor Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white border-b border-neutral-700 pb-2">LABOR COSTS</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Number of People</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numberOfPeople}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setNumberOfPeople(Number(value) || 1)
                    }}
                    className="bg-neutral-800 border-neutral-600 text-white text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Cost per Hour ($)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={costPerHour}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setCostPerHour(Number(value) || 0)
                    }}
                    className="bg-neutral-800 border-neutral-600 text-white text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Total Hours</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={totalHours}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setTotalHours(Number(value) || 0)
                    }}
                    className="bg-neutral-800 border-neutral-600 text-white text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
              </div>
              
              <div className="p-3 bg-neutral-800 rounded border border-neutral-700">
                <div className="text-xs text-neutral-400">Labor Subtotal</div>
                <div className="text-lg font-bold text-orange-500 tabular-nums">
                  {formatCurrency(laborCost)}
                </div>
                <div className="text-xs text-neutral-500">
                  {numberOfPeople} people × {formatCurrency(costPerHour)}/hr × {totalHours} hrs
                </div>
              </div>
            </div>

            {/* Markup Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white border-b border-neutral-700 pb-2">GENERAL OVERHEAD</h3>
              
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">General Markup (%)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={generalMarkup}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    const numValue = Number(value)
                    if (numValue <= 100) {
                      setGeneralMarkup(numValue || 0)
                    }
                  }}
                  className="bg-neutral-800 border-neutral-600 text-white text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ MozAppearance: 'textfield' }}
                />
                <div className="text-xs text-neutral-500 mt-1">
                  Applied to material costs: {formatCurrency(markupAmount)}
                </div>
              </div>

              {/* Custom Fees */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-400">Custom Fees</label>
                  <Button
                    size="sm"
                    onClick={handleAddCustomFee}
                    className="text-xs px-2 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-300 transition-all"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Fee
                  </Button>
                </div>
                
                {customFees.map((fee) => (
                  <div key={fee.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Fee name"
                      value={fee.name}
                      onChange={(e) => handleUpdateCustomFee(fee.id, 'name', e.target.value)}
                      className="bg-neutral-800 border-neutral-600 text-white text-xs flex-1"
                    />
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={fee.amount || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '')
                        handleUpdateCustomFee(fee.id, 'amount', Number(value) || 0)
                      }}
                      className="bg-neutral-800 border-neutral-600 text-white text-xs w-24 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveCustomFee(fee.id)}
                      className="text-xs px-2 py-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {customFees.length > 0 && (
                  <div className="text-xs text-neutral-500">
                    Custom fees total: {formatCurrency(customFeesTotal)}
                  </div>
                )}
              </div>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={handleCalculateFinalCost}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Final Cost
            </Button>
          </CardContent>
        </Card>

        {/* Right Box - Receipt */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center">
              <Receipt className="h-4 w-4 mr-2" />
              PROJECT COST SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showReceipt ? (
              <div className="space-y-4">
                {/* Materials Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white border-b border-neutral-700 pb-2">MATERIALS</h3>
                  {pricingResults.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <div className="text-neutral-300">{item.itemName}</div>
                        <div className="text-xs text-neutral-500">
                          Qty: {item.quantity} × {item.price ? formatCurrency(item.price) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-neutral-300 tabular-nums">
                        {item.totalCost ? formatCurrency(item.totalCost) : 'N/A'}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-neutral-700">
                    <div className="font-medium text-white">Materials Subtotal</div>
                    <div className="font-bold text-orange-500 tabular-nums">{formatCurrency(materialCost)}</div>
                  </div>
                </div>

                {/* Labor Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-white border-b border-neutral-700 pb-2">LABOR</h3>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <div className="text-neutral-300">Labor Cost</div>
                      <div className="text-xs text-neutral-500">
                        {numberOfPeople} people × {formatCurrency(costPerHour)}/hr × {totalHours} hrs
                      </div>
                    </div>
                    <div className="text-orange-500 font-bold tabular-nums">{formatCurrency(laborCost)}</div>
                  </div>
                </div>

                {/* Markup Section */}
                {generalMarkup > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-white border-b border-neutral-700 pb-2">MARKUP</h3>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <div className="text-neutral-300">General Markup</div>
                        <div className="text-xs text-neutral-500">{generalMarkup}% on materials</div>
                      </div>
                      <div className="text-orange-500 font-bold tabular-nums">{formatCurrency(markupAmount)}</div>
                    </div>
                  </div>
                )}

                {/* Custom Fees Section */}
                {customFees.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-white border-b border-neutral-700 pb-2">ADDITIONAL FEES</h3>
                    {customFees.map((fee) => (
                      <div key={fee.id} className="flex justify-between items-center text-sm">
                        <div className="text-neutral-300">{fee.name || 'Custom Fee'}</div>
                        <div className="text-orange-500 font-bold tabular-nums">{formatCurrency(fee.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Total */}
                <div className="pt-4 border-t-2 border-orange-500">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-white">TOTAL PROJECT COST</div>
                    <div className="text-2xl font-bold text-orange-500 tabular-nums">{formatCurrency(finalTotal)}</div>
                  </div>
                </div>

                {/* Export Button */}
                <Button
                  disabled
                  variant="outline"
                  className="w-full mt-4 border-neutral-600 text-neutral-500 bg-neutral-800/50 cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export (Coming Soon)
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Receipt className="h-12 w-12 text-neutral-600 mb-4" />
                <div className="text-neutral-400 text-sm mb-2">Click &quot;Calculate Final Cost&quot; to see</div>
                <div className="text-neutral-400 text-sm">your complete project summary</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
