"use client"

import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Plus, Minus } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import PricingResults from "../pricing/pricing-results"
import { searchHomeDepotPricing, type PricingResult as ServicePricingResult, type ProductOption } from "@/lib/serpapi-service"
import APIRateLimiter from "@/lib/api-rate-limiter"

interface EstimationItem {
  id: string
  name: string
  description: string
  unit: string
  quantity: number
  baseQuantity: number // Added base quantity to track original amounts
  checked: boolean
  removed: boolean
  isCustom?: boolean // Added flag to identify custom items
}



interface EstimationResultsProps {
  data: {
    supplies: EstimationItem[]
    equipment: EstimationItem[]
  }
  initialProjectSize: string
  projectSizeUnit: string
  projectDescription?: string
  priceScale?: string
  location?: string
}

export default function EstimationResults({ data, initialProjectSize, projectSizeUnit, projectDescription, priceScale, location }: EstimationResultsProps) {
  // Function to calculate reasonable maximum quantities based on item type and project size
  // This is project-agnostic and works for all project types
  const getMaxQuantityForItem = (item: EstimationItem, projectSize: number): number => {
    const itemUnit = item.unit.toLowerCase()
    
    // For TBD project size, use reasonable defaults based on item type
    if (isNaN(projectSize) || projectSize === 0) {
      // Provide reasonable defaults for TBD projects
      if (itemUnit.includes('ft') || itemUnit.includes('linear') || itemUnit.includes('foot') || itemUnit.includes('meter')) {
        return Math.max(item.baseQuantity * 5, 500) // 5x base quantity, max 500 ft
      }
      if (itemUnit.includes('sq') || itemUnit.includes('square') || itemUnit.includes('m²')) {
        return Math.max(item.baseQuantity * 5, 2000) // 5x base quantity, max 2000 sq ft
      }
      if (itemUnit.includes('each') || itemUnit.includes('piece') || itemUnit.includes('unit') || 
          itemUnit.includes('pcs') || itemUnit.includes('count') || itemUnit.includes('set')) {
        return Math.max(item.baseQuantity * 5, 200) // 5x base quantity, max 200 units
      }
      if (itemUnit.includes('lb') || itemUnit.includes('kg') || itemUnit.includes('pound')) {
        return Math.max(item.baseQuantity * 5, 10000) // 5x base quantity, max 10,000 lbs
      }
      if (itemUnit.includes('gal') || itemUnit.includes('liter') || itemUnit.includes('l') || 
          itemUnit.includes('quart') || itemUnit.includes('pint')) {
        return Math.max(item.baseQuantity * 5, 500) // 5x base quantity, max 500 gal
      }
      if (itemUnit.includes('hr') || itemUnit.includes('hour') || itemUnit.includes('day')) {
        return Math.max(item.baseQuantity * 5, 100) // 5x base quantity, max 100 hours
      }
      return Math.max(item.baseQuantity * 5, 1000) // Default: 5x base quantity, max 1000
    }
    
    // For linear measurements (ft, linear ft, etc.)
    if (itemUnit.includes('ft') || itemUnit.includes('linear') || itemUnit.includes('foot') || itemUnit.includes('meter')) {
      // Linear items scale with project size but with reasonable limits
      // Examples: lumber, pipes, wiring, trim, siding, rails, etc.
      // Use a more conservative multiplier to prevent overestimation
      const maxLinearFt = Math.min(projectSize * 2.5, 1000) // 2.5x project size, max 1000 ft
      return Math.max(maxLinearFt, item.baseQuantity)
    }
    
    // For area-based items (sq ft, sq m, etc.)
    if (itemUnit.includes('sq') || itemUnit.includes('square') || itemUnit.includes('m²')) {
      // Area items scale with project size but with reasonable limits
      // Examples: flooring, drywall, paint coverage, insulation, etc.
      return Math.min(projectSize * 3, 10000) // 3x project size, max 10,000 sq ft
    }
    
    // For count-based items (each, pieces, units, etc.)
    if (itemUnit.includes('each') || itemUnit.includes('piece') || itemUnit.includes('unit') || 
        itemUnit.includes('pcs') || itemUnit.includes('count') || itemUnit.includes('set')) {
      // Count items scale with project size but with reasonable limits
      // Examples: fixtures, outlets, switches, hardware, etc.
      return Math.min(projectSize * 2, 1000) // 2x project size, max 1000 units
    }
    
    // For weight-based items (lbs, kg, etc.)
    if (itemUnit.includes('lb') || itemUnit.includes('kg') || itemUnit.includes('pound')) {
      // Weight items scale with project size but with reasonable limits
      // Examples: concrete, gravel, sand, etc.
      return Math.min(projectSize * 15, 50000) // 15x project size, max 50,000 lbs
    }
    
    // For volume-based items (gal, L, etc.)
    if (itemUnit.includes('gal') || itemUnit.includes('liter') || itemUnit.includes('l') || 
        itemUnit.includes('quart') || itemUnit.includes('pint')) {
      // Volume items scale with project size but with reasonable limits
      // Examples: paint, sealant, adhesive, etc.
      return Math.min(projectSize * 5, 1000) // 5x project size, max 1000 gal
    }
    
    // For time-based items (hr, day, etc.)
    if (itemUnit.includes('hr') || itemUnit.includes('hour') || itemUnit.includes('day')) {
      // Time items scale with project size but with reasonable limits
      // Examples: labor hours, rental days, etc.
      return Math.min(projectSize * 0.5, 500) // 0.5x project size, max 500 hours
    }
    
    // Default: don't exceed 10x the base quantity for any other units
    return Math.max(item.baseQuantity * 10, 1000)
  }

  const [projectSize, setProjectSize] = useState(initialProjectSize)
  const [supplies, setSupplies] = useState<EstimationItem[]>(
    data.supplies.map((item) => {
      console.log(`[v0] Supply item: ${item.name} - Base quantity: ${item.quantity} ${item.unit}`)
      
      // Validate and correct initial quantities that are too high
      const projectSizeNum = initialProjectSize.toUpperCase() === "TBD" ? 0 : Number.parseFloat(initialProjectSize)
      const maxQuantity = getMaxQuantityForItem({ ...item, baseQuantity: item.quantity }, projectSizeNum)
      const correctedQuantity = Math.min(item.quantity, maxQuantity)
      
      if (correctedQuantity !== item.quantity) {
        console.log(`[v0] Corrected ${item.name}: ${item.quantity} → ${correctedQuantity} (project size: ${initialProjectSize})`)
      }
      
      return { 
        ...item, 
        baseQuantity: correctedQuantity, 
        quantity: correctedQuantity,
        checked: true, 
        removed: false 
      }
    }),
  )
  const [equipment, setEquipment] = useState<EstimationItem[]>(
    data.equipment.map((item) => {
      console.log(`[v0] Equipment item: ${item.name} - Base quantity: ${item.quantity} ${item.unit}`)
      
      // Validate and correct initial quantities that are too high
      const projectSizeNum = initialProjectSize.toUpperCase() === "TBD" ? 0 : Number.parseFloat(initialProjectSize)
      const maxQuantity = getMaxQuantityForItem({ ...item, baseQuantity: item.quantity }, projectSizeNum)
      const correctedQuantity = Math.min(item.quantity, maxQuantity)
      
      if (correctedQuantity !== item.quantity) {
        console.log(`[v0] Corrected ${item.name}: ${item.quantity} → ${correctedQuantity} (project size: ${initialProjectSize})`)
      }
      
      return { 
        ...item, 
        baseQuantity: correctedQuantity, 
        quantity: correctedQuantity,
        checked: true, 
        removed: false 
      }
    }),
  )

  const [customSupplies, setCustomSupplies] = useState<EstimationItem[]>([])
  const [customEquipment, setCustomEquipment] = useState<EstimationItem[]>([])

  const [pricingResults, setPricingResults] = useState<ServicePricingResult[]>([])
  const [isLoadingPricing, setIsLoadingPricing] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [itemsToSearch, setItemsToSearch] = useState<Array<{ name: string; quantity: number }>>([])
  const [isProjectListCollapsed, setIsProjectListCollapsed] = useState(false)
  const [apiUsageStats, setApiUsageStats] = useState({ callsUsed: 0, callsRemaining: 50, maxCalls: 50, sessionAge: 0 })
  const shouldStopPricingRef = useRef(false)

  // Update API usage stats
  const updateApiUsageStats = () => {
    if (typeof window !== 'undefined') {
      const rateLimiter = APIRateLimiter.getInstance()
      const stats = rateLimiter.getSessionStats()
      console.log('[v0] Client: updateApiUsageStats called, current stats:', stats)
      setApiUsageStats({
        callsUsed: stats.callsUsed,
        callsRemaining: stats.callsRemaining,
        maxCalls: stats.maxCalls,
        sessionAge: stats.sessionAge
      })
    }
  }

  // Handle API usage updates from child components (like compare operations)
  const handleApiUsageUpdate = (newStats: { callsUsed: number; callsRemaining: number; maxCalls: number; sessionAge: number }) => {
    setApiUsageStats(newStats)
  }

  // Update API stats on component mount and when pricing starts
  useEffect(() => {
    updateApiUsageStats()
  }, [])

  // Create a unique key for this project based on form data
  const projectKey = `prospec-project-${JSON.stringify({
    projectType: data.supplies[0]?.description || 'default',
    size: initialProjectSize,
    unit: projectSizeUnit
  }).replace(/[^a-zA-Z0-9]/g, '-')}`

  // Load saved project state from localStorage on component mount
  useEffect(() => {
    const savedProjectSize = localStorage.getItem(`${projectKey}-project-size`)
    const savedSupplies = localStorage.getItem(`${projectKey}-supplies`)
    const savedEquipment = localStorage.getItem(`${projectKey}-equipment`)
    const savedCustomSupplies = localStorage.getItem(`${projectKey}-custom-supplies`)
    const savedCustomEquipment = localStorage.getItem(`${projectKey}-custom-equipment`)
    const savedPricingResults = localStorage.getItem(`${projectKey}-pricing-results`)
    const savedShowPricing = localStorage.getItem(`${projectKey}-show-pricing`)
    const savedIsCollapsed = localStorage.getItem(`${projectKey}-is-collapsed`)

    // Restore project size
    if (savedProjectSize) {
      setProjectSize(savedProjectSize)
    }

    // Restore supplies
    if (savedSupplies) {
      try {
        const parsedSupplies = JSON.parse(savedSupplies)
        setSupplies(parsedSupplies)
      } catch (error) {
        console.error('Error parsing saved supplies:', error)
      }
    }

    // Restore equipment
    if (savedEquipment) {
      try {
        const parsedEquipment = JSON.parse(savedEquipment)
        setEquipment(parsedEquipment)
      } catch (error) {
        console.error('Error parsing saved equipment:', error)
      }
    }

    // Restore custom supplies
    if (savedCustomSupplies) {
      try {
        const parsedCustomSupplies = JSON.parse(savedCustomSupplies)
        setCustomSupplies(parsedCustomSupplies)
      } catch (error) {
        console.error('Error parsing saved custom supplies:', error)
      }
    }

    // Restore custom equipment
    if (savedCustomEquipment) {
      try {
        const parsedCustomEquipment = JSON.parse(savedCustomEquipment)
        setCustomEquipment(parsedCustomEquipment)
      } catch (error) {
        console.error('Error parsing saved custom equipment:', error)
      }
    }

    // Restore pricing results
    if (savedPricingResults) {
      try {
        const parsedPricingResults = JSON.parse(savedPricingResults)
        setPricingResults(parsedPricingResults)
      } catch (error) {
        console.error('Error parsing saved pricing results:', error)
      }
    }

    // Restore pricing visibility
    if (savedShowPricing) {
      setShowPricing(savedShowPricing === 'true')
    }

    // Restore collapsed state
    if (savedIsCollapsed) {
      setIsProjectListCollapsed(savedIsCollapsed === 'true')
    }
  }, [projectKey])

  // Save project size
  useEffect(() => {
    localStorage.setItem(`${projectKey}-project-size`, projectSize)
  }, [projectSize, projectKey])

  // Save supplies
  useEffect(() => {
    localStorage.setItem(`${projectKey}-supplies`, JSON.stringify(supplies))
  }, [supplies, projectKey])

  // Save equipment
  useEffect(() => {
    localStorage.setItem(`${projectKey}-equipment`, JSON.stringify(equipment))
  }, [equipment, projectKey])

  // Save custom supplies
  useEffect(() => {
    localStorage.setItem(`${projectKey}-custom-supplies`, JSON.stringify(customSupplies))
  }, [customSupplies, projectKey])

  // Save custom equipment
  useEffect(() => {
    localStorage.setItem(`${projectKey}-custom-equipment`, JSON.stringify(customEquipment))
  }, [customEquipment, projectKey])

  // Save pricing results
  useEffect(() => {
    if (pricingResults.length > 0) {
      localStorage.setItem(`${projectKey}-pricing-results`, JSON.stringify(pricingResults))
    }
  }, [pricingResults, projectKey])

  // Save pricing visibility
  useEffect(() => {
    localStorage.setItem(`${projectKey}-show-pricing`, showPricing.toString())
  }, [showPricing, projectKey])

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem(`${projectKey}-is-collapsed`, isProjectListCollapsed.toString())
  }, [isProjectListCollapsed, projectKey])

  useEffect(() => {
    // Handle TBD project size - skip scaling if size is TBD
    if (projectSize.toUpperCase() === "TBD" || projectSizeUnit === "tbd") {
      console.log("[v0] Project size is TBD - skipping scaling")
      return
    }

    // Only apply scaling if the project size has actually changed from the initial size
    // and if we have valid numbers
    const currentSize = Number.parseFloat(projectSize)
    const originalSize = Number.parseFloat(initialProjectSize)
    
    if (isNaN(currentSize) || isNaN(originalSize) || currentSize === 0) {
      return
    }

    // Calculate scaling factor based on the ratio of current to original size
    // But only if there's a meaningful difference (more than 5% change)
    const sizeRatio = currentSize / originalSize
    const hasSignificantChange = Math.abs(sizeRatio - 1) > 0.05

    if (hasSignificantChange) {
      console.log(`[v0] Scaling quantities: ${originalSize} → ${currentSize} (ratio: ${sizeRatio.toFixed(2)})`)
      
      setSupplies((prev) =>
        prev.map((item) => {
          const newQuantity = Math.round(item.baseQuantity * sizeRatio)
          // Add reasonable limits based on item type and project size
          const maxQuantity = getMaxQuantityForItem(item, currentSize)
          const finalQuantity = Math.min(newQuantity, maxQuantity)
          
          console.log(`[v0] Scaling ${item.name}: ${item.baseQuantity} → ${newQuantity} (capped at ${finalQuantity})`)
          
          return {
            ...item,
            quantity: finalQuantity,
          }
        }),
      )

      setEquipment((prev) =>
        prev.map((item) => {
          const newQuantity = Math.round(item.baseQuantity * sizeRatio)
          // Add reasonable limits based on item type and project size
          const maxQuantity = getMaxQuantityForItem(item, currentSize)
          const finalQuantity = Math.min(newQuantity, maxQuantity)
          
          console.log(`[v0] Scaling ${item.name}: ${item.baseQuantity} → ${newQuantity} (capped at ${finalQuantity})`)
          
          return {
            ...item,
            quantity: finalQuantity,
          }
        }),
      )
    }
  }, [projectSize, initialProjectSize, projectSizeUnit])

  const handleProjectSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow TBD, numbers, and decimal points
    if (value === "" || value.toUpperCase() === "TBD" || /^\d*\.?\d*$/.test(value)) {
      setProjectSize(value)
    }
  }

  const updateQuantity = (
    items: EstimationItem[],
    setItems: (items: EstimationItem[]) => void,
    id: string,
    change: number,
  ) => {
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item)))
  }

  const toggleCheck = (items: EstimationItem[], setItems: (items: EstimationItem[]) => void, id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, checked: true, removed: false } : item)))
  }

  const removeItem = (items: EstimationItem[], setItems: (items: EstimationItem[]) => void, id: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, checked: false, removed: true } : item)))
  }

  const ItemRow = ({
    item,
    items,
    setItems,
  }: {
    item: EstimationItem
    items: EstimationItem[]
    setItems: (items: EstimationItem[]) => void
  }) => (
    <div
      className={`flex items-center justify-between p-3 rounded transition-colors ${
        item.removed
          ? "bg-red-900/30 border border-red-800/50"
          : "bg-green-900/30 border border-green-800/50"
      }`}
    >
      <div className="flex-1">
        <div className={`text-sm font-medium ${item.removed ? "text-red-400" : "text-white"}`}>{item.name}</div>
        <div className="text-xs text-neutral-500 mb-1">{item.description}</div>
        <div className="text-xs text-neutral-400">
          {item.quantity} {item.unit}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-neutral-400 hover:text-white hover:bg-neutral-600"
            onClick={() => updateQuantity(items, setItems, item.id, -1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            value={item.quantity}
            onChange={(e) => {
              const newQuantity = Number.parseInt(e.target.value) || 0
              setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i)))
            }}
            className="w-16 h-6 text-center bg-neutral-700 border-neutral-600 text-white text-xs"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-neutral-400 hover:text-white hover:bg-neutral-600"
            onClick={() => updateQuantity(items, setItems, item.id, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 w-6 p-0 ${item.removed ? "text-neutral-500 hover:text-green-500" : "text-green-500 hover:text-green-400"}`}
            onClick={() => toggleCheck(items, setItems, item.id)}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 w-6 p-0 ${item.removed ? "text-red-500 hover:text-red-400" : "text-neutral-500 hover:text-red-500"}`}
            onClick={() => removeItem(items, setItems, item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )

  const handleAddCustomSupply = (item: Omit<EstimationItem, 'id'>) => {
    const newItem: EstimationItem = {
      ...item,
      id: `custom-supply-${Date.now()}`,
    }
    setCustomSupplies((prev) => [...prev, newItem])
  }

  const handleAddCustomEquipment = (item: Omit<EstimationItem, 'id'>) => {
    const newItem: EstimationItem = {
      ...item,
      id: `custom-equipment-${Date.now()}`,
    }
    setCustomEquipment((prev) => [...prev, newItem])
  }

  const deleteCustomItem = (type: "supplies" | "equipment", id: string) => {
    if (type === "supplies") {
      setCustomSupplies((prev) => prev.map((item) => item.id === id ? { ...item, checked: false, removed: true } : item))
    } else {
      setCustomEquipment((prev) => prev.map((item) => item.id === id ? { ...item, checked: false, removed: true } : item))
    }
  }

  const CustomItemRow = ({ item, type }: { item: EstimationItem; type: "supplies" | "equipment" }) => (
    <div
      className={`flex items-center justify-between p-3 rounded transition-colors ${
        item.removed
          ? "bg-red-900/30 border border-red-800/50"
          : "bg-green-900/30 border border-green-800/50"
      }`}
    >
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{item.name}</div>
        <div className="text-xs text-neutral-500 mb-1">{item.description}</div>
        <div className="text-xs text-neutral-400">
          {item.quantity} {item.unit}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-neutral-400 hover:text-white hover:bg-neutral-600"
            onClick={() => updateQuantity([...customSupplies, ...customEquipment], 
              type === "supplies" ? setCustomSupplies : setCustomEquipment, item.id, -1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            value={item.quantity}
            onChange={(e) => {
              const newQuantity = Number.parseInt(e.target.value) || 0
              const items = type === "supplies" ? customSupplies : customEquipment
              const setItems = type === "supplies" ? setCustomSupplies : setCustomEquipment
              setItems(items.map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i)))
            }}
            className="w-16 h-6 text-center bg-neutral-700 border-neutral-600 text-white text-xs"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-neutral-400 hover:text-white hover:bg-neutral-600"
            onClick={() => updateQuantity([...customSupplies, ...customEquipment], 
              type === "supplies" ? setCustomSupplies : setCustomEquipment, item.id, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 w-6 p-0 ${item.removed ? "text-neutral-500 hover:text-green-500" : "text-green-500 hover:text-green-400"}`}
            onClick={() => toggleCheck([...customSupplies, ...customEquipment], 
              type === "supplies" ? setCustomSupplies : setCustomEquipment, item.id)}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 w-6 p-0 ${item.removed ? "text-red-500 hover:text-red-400" : "text-neutral-500 hover:text-red-500"}`}
            onClick={() => deleteCustomItem(type, item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )

  const AddCustomItemForm = React.memo(({ type, onAdd }: { 
    type: "supplies" | "equipment"
    onAdd: (item: Omit<EstimationItem, 'id'>) => void
  }) => {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [quantity, setQuantity] = useState("1")
    const [unit, setUnit] = useState("units")

    const handleSubmit = () => {
      if (!name.trim()) return

      const newItem: Omit<EstimationItem, 'id'> = {
        name: name.trim(),
        description: description.trim(),
        unit: unit,
        quantity: parseInt(quantity) || 1,
        baseQuantity: parseInt(quantity) || 1,
        checked: true,
        removed: false,
        isCustom: true,
      }

      onAdd(newItem)
      
      // Clear form
      setName("")
      setDescription("")
      setQuantity("1")
      setUnit("units")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    }

    return (
      <div className="p-3 rounded bg-neutral-800/50 border border-neutral-700/50">
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`${type === "supplies" ? "Add Custom Supply" : "Add Custom Equipment"} name...`}
            className="text-sm bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Description (optional)..."
            className="text-xs bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400"
          />
          <div className="flex items-center gap-2">
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Qty"
              type="number"
              min="1"
              className="w-20 text-xs bg-neutral-700 border-neutral-600 text-white"
            />
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Unit"
              className="w-24 text-xs bg-neutral-700 border-neutral-600 text-white"
            />
            <Button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-black text-xs px-3"
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    )
  })
  AddCustomItemForm.displayName = 'AddCustomItemForm'

  const handleStopPricing = () => {
    console.log("[v0] User requested to stop pricing - setting ref to true")
    shouldStopPricingRef.current = true
    console.log("[v0] Stop ref current value:", shouldStopPricingRef.current)
  }

  const handleReplaceItem = (originalItem: ServicePricingResult, replacementOption: ProductOption, updateCompareOptions: (itemKey: string, updatedOptions: ProductOption[]) => void) => {
    console.log("[v0] User requested to replace item:", originalItem.itemName, "with:", replacementOption.productTitle)
    
    // Create the new item with replacement data
    const replacedItem: ServicePricingResult = {
      itemName: originalItem.itemName,
      quantity: originalItem.quantity,
      price: replacementOption.price,
      totalCost: replacementOption.totalCost,
      productTitle: replacementOption.productTitle,
      brand: replacementOption.brand,
      rating: replacementOption.rating,
      reviews: replacementOption.reviews,
      link: replacementOption.link,
      source: replacementOption.source,
      condition: replacementOption.condition,
      hasMoreOptions: originalItem.hasMoreOptions,
      isLoading: false
    }

    // Update the pricing results by swapping the main item with the replacement
    setPricingResults(prevResults => 
      prevResults.map(result => {
        if (result.itemName === originalItem.itemName && result.quantity === originalItem.quantity) {
          return replacedItem
        }
        return result
      })
    )

    // Update the compare options to swap the original item into the alternatives
    const itemKey = `${originalItem.itemName}-${originalItem.quantity}`
    
    // Create a new ProductOption from the original item
    const originalAsOption: ProductOption = {
      productTitle: originalItem.productTitle || 'Original Item',
      price: originalItem.price || 0,
      totalCost: originalItem.totalCost || 0,
      brand: originalItem.brand,
      rating: originalItem.rating,
      reviews: originalItem.reviews,
      link: originalItem.link || '',
      source: originalItem.source,
      condition: originalItem.condition,
      rank: 1 // Set as rank 1 when swapped back
    }

    // Get current options and replace the selected one with the original
    // Note: We need to get the current options from the PricingResults component state
    // For now, we'll assume the options exist and just replace the matching one
    // The PricingResults component will handle this through the updateCompareOptions callback
    console.log("[v0] Swapping original item into alternatives for item key:", itemKey)
  }

  const handleSubmitForProjectSpec = async () => {
    setIsLoadingPricing(true)
    setShowPricing(true)
    setIsProjectListCollapsed(true) // Collapse the project list when pricing starts
    shouldStopPricingRef.current = false // Reset stop flag

    try {
      // Only include checked items that are not removed
      const allItems = [
        ...supplies.filter((item) => !item.removed && item.checked),
        ...equipment.filter((item) => !item.removed && item.checked),
        ...customSupplies.filter((item) => !item.removed && item.checked && item.name.trim()),
        ...customEquipment.filter((item) => !item.removed && item.checked && item.name.trim()),
      ].map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }))

      console.log("[v0] Submitting for pricing:", allItems.length, "items")
      
      // Set items to search for placeholder display
      setItemsToSearch(allItems)

      // Initialize all items with placeholder data immediately
      const placeholderResults: ServicePricingResult[] = allItems.map(item => ({
        itemName: item.name,
        quantity: item.quantity,
        price: null,
        totalCost: null,
        isLoading: true, // Add loading flag
      }))
      
      setPricingResults(placeholderResults)
      console.log("[v0] Set placeholder results:", placeholderResults)

      // Process items one by one and update individual results
      for (let i = 0; i < allItems.length; i++) {
        // Check if user requested to stop
        console.log(`[v0] Checking stop flag before item ${i + 1}: ${shouldStopPricingRef.current}`)
        if (shouldStopPricingRef.current) {
          console.log("[v0] STOPPING pricing at user request")
          // Mark remaining items as not loading
          setPricingResults(prevResults => 
            prevResults.map(prevResult => 
              prevResult.isLoading ? { ...prevResult, isLoading: false } : prevResult
            )
          )
          break
        }

        const item = allItems[i]
        try {
          console.log(`[v0] Processing item ${i + 1}/${allItems.length}:`, item.name)
          
          // Call API for single item
          const result = await searchHomeDepotPricing([item], projectDescription, priceScale, location)
          
          // Update API usage stats after each call (with small delay to ensure localStorage is updated)
          setTimeout(() => {
            updateApiUsageStats()
          }, 100)
          
          // Check again if user requested to stop (in case they clicked during API call)
          if (shouldStopPricingRef.current) {
            console.log("[v0] Stopping pricing after API call completed")
            // Mark remaining items as not loading
            setPricingResults(prevResults => 
              prevResults.map(prevResult => 
                prevResult.isLoading ? { ...prevResult, isLoading: false } : prevResult
              )
            )
            break
          }

          // Update the specific item in the results array
          setPricingResults(prevResults => 
            prevResults.map(prevResult => 
              prevResult.itemName === item.name && prevResult.quantity === item.quantity
                ? { ...(result && result.length > 0 ? result[0] : prevResult), isLoading: false }
                : prevResult
            )
          )
        } catch (itemError) {
          console.error(`[v0] Error getting pricing for ${item.name}:`, itemError)
          
          // Check if user requested to stop (even after error)
          if (shouldStopPricingRef.current) {
            console.log("[v0] Stopping pricing after error")
            // Mark remaining items as not loading
            setPricingResults(prevResults => 
              prevResults.map(prevResult => 
                prevResult.isLoading ? { ...prevResult, isLoading: false } : prevResult
              )
            )
            break
          }
          
          // Update with error result
          setPricingResults(prevResults => 
            prevResults.map(prevResult => 
              prevResult.itemName === item.name && prevResult.quantity === item.quantity
                ? { 
                    ...prevResult, 
                    error: itemError instanceof Error ? itemError.message : "Unknown error",
                    isLoading: false 
                  }
                : prevResult
            )
          )
        }
        
        // Add a small delay between items to better show incremental loading
        if (i < allItems.length - 1 && !shouldStopPricingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error("[v0] Error getting pricing:", error)
    } finally {
      setIsLoadingPricing(false)
    }
  }

  return (
    <>
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PROJECT LIST</CardTitle>
              {isProjectListCollapsed && (
                <div className="text-xs text-neutral-500 mt-1">
                  {(() => {
                    const suppliesSelected = supplies.filter(item => !item.removed && item.checked).length
                    const equipmentSelected = equipment.filter(item => !item.removed && item.checked).length
                    const customSuppliesSelected = customSupplies.filter(item => !item.removed && item.checked).length
                    const customEquipmentSelected = customEquipment.filter(item => !item.removed && item.checked).length
                    const totalSupplies = supplies.length + customSupplies.length
                    const totalEquipment = equipment.length + customEquipment.length
                    return `${suppliesSelected + customSuppliesSelected}/${totalSupplies} supplies selected • ${equipmentSelected + customEquipmentSelected}/${totalEquipment} equipment selected`
                  })()}
                </div>
              )}
            </div>
            {isProjectListCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsProjectListCollapsed(false)}
                className="text-xs px-3 py-1 bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-300 transition-all"
              >
                Expand List
              </Button>
            )}
          </div>
        </CardHeader>
        {!isProjectListCollapsed && (
          <CardContent>
          <div className="mb-6 p-3 bg-neutral-800 rounded border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">PROJECT SIZE</h3>
                <p className="text-xs text-neutral-400">Adjust size to scale all quantities</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={projectSizeUnit === "tbd" ? "DEFAULT" : projectSize}
                  onChange={handleProjectSizeChange}
                  className={`w-24 h-8 text-center bg-neutral-700 border-neutral-600 text-white text-sm ${
                    projectSize === "0" ? "border-red-500" : ""
                  }`}
                  placeholder="Size or TBD"
                  disabled={projectSizeUnit === "tbd"}
                />
                <span className="text-xs text-neutral-400">
                  {projectSizeUnit === "tbd" ? "TBD" : projectSizeUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Supplies Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">SUPPLIES</h3>
            </div>
            <div className="space-y-2">
              {supplies.map((item) => (
                <ItemRow key={item.id} item={item} items={supplies} setItems={setSupplies} />
              ))}
              {customSupplies.map((item) => (
                <CustomItemRow key={item.id} item={item} type="supplies" />
              ))}
              <AddCustomItemForm type="supplies" onAdd={handleAddCustomSupply} />
            </div>
          </div>

          {/* Equipment Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">EQUIPMENT</h3>
            </div>
            <div className="space-y-2">
              {equipment.map((item) => (
                <ItemRow key={item.id} item={item} items={equipment} setItems={setEquipment} />
              ))}
              {customEquipment.map((item) => (
                <CustomItemRow key={item.id} item={item} type="equipment" />
              ))}
              <AddCustomItemForm type="equipment" onAdd={handleAddCustomEquipment} />
            </div>
          </div>

          <div className="border-t border-neutral-700 pt-4">
            <div className="text-xs text-neutral-400 mb-2 text-center">
              {(() => {
                const checkedCount = [
                  ...supplies.filter(item => !item.removed && item.checked),
                  ...equipment.filter(item => !item.removed && item.checked),
                  ...customSupplies.filter(item => !item.removed && item.checked),
                  ...customEquipment.filter(item => !item.removed && item.checked)
                ].length
                return `${checkedCount} items selected for pricing`
              })()}
            </div>
            <div className="space-y-2">
              {/* API Usage Display */}
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>API Usage:</span>
                <span className={`font-mono ${apiUsageStats.callsRemaining < 10 ? 'text-orange-400' : apiUsageStats.callsRemaining === 0 ? 'text-red-400' : 'text-neutral-400'}`}>
                  {apiUsageStats.callsUsed}/{apiUsageStats.maxCalls} calls used ({apiUsageStats.callsRemaining} remaining)
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50"
                  onClick={handleSubmitForProjectSpec}
                  disabled={isLoadingPricing || apiUsageStats.callsRemaining === 0}
                >
                  {isLoadingPricing ? "Getting Prices..." : apiUsageStats.callsRemaining === 0 ? "API Limit Reached" : "Submit Checked Items for Pricing"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        )}
      </Card>

      {showPricing && <PricingResults results={pricingResults} isLoading={isLoadingPricing} projectDescription={projectDescription} priceScale={priceScale} location={location} onReplaceItem={handleReplaceItem} isLoadingPricing={isLoadingPricing} onStopPricing={handleStopPricing} apiUsageStats={apiUsageStats} onApiUsageUpdate={handleApiUsageUpdate} />}
    </>
  )
}
