"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import EstimationResults from "@/components/features/estimation/estimation-results"
import { useState, useEffect, useCallback } from "react"
import { Command, CornerDownLeft } from "lucide-react"
import { generateProjectEstimation, type EstimationResponse } from "@/lib/gemini-api"

export default function EstimationPage() {
  const [showEstimation, setShowEstimation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [estimationData, setEstimationData] = useState<EstimationResponse | null>(null)
  const [formData, setFormData] = useState({
    projectType: "",
    projectSize: "",
    projectSizeUnit: "tbd",
    projectDescription: "",
    priceScale: 2.0, // 1 = $, 2 = $$, 3 = $$$
    location: "LA", // Default to Los Angeles
  })

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('prospec-form-data')
    const savedShowEstimation = localStorage.getItem('prospec-show-estimation')
    const savedEstimationData = localStorage.getItem('prospec-estimation-data')

    if (savedFormData) {
      try {
        const parsedFormData = JSON.parse(savedFormData)
        setFormData(parsedFormData)
      } catch (error) {
        console.error('Error parsing saved form data:', error)
      }
    }

    if (savedShowEstimation) {
      setShowEstimation(savedShowEstimation === 'true')
    }

    if (savedEstimationData) {
      try {
        const parsedEstimationData = JSON.parse(savedEstimationData)
        setEstimationData(parsedEstimationData)
      } catch (error) {
        console.error('Error parsing saved estimation data:', error)
      }
    }
  }, [])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('prospec-form-data', JSON.stringify(formData))
  }, [formData])

  // Save estimation visibility state
  useEffect(() => {
    localStorage.setItem('prospec-show-estimation', showEstimation.toString())
  }, [showEstimation])

  // Save estimation data
  useEffect(() => {
    if (estimationData) {
      localStorage.setItem('prospec-estimation-data', JSON.stringify(estimationData))
    }
  }, [estimationData])

  const handleEstimateProject = useCallback(async () => {
    if (!formData.projectType || (!formData.projectSize && formData.projectSizeUnit !== "tbd") || !formData.projectDescription) {
      alert("Please fill in all fields before estimating")
      return
    }

    setIsLoading(true)
    try {
      // Convert price scale number to string format
      const priceScaleString = formData.priceScale === 1 ? "$" : formData.priceScale === 2 ? "$$" : "$$$"
      const estimation = await generateProjectEstimation({
        ...formData,
        priceScale: priceScaleString,
      })
      setEstimationData(estimation)
      setShowEstimation(true)
    } catch (error) {
      console.error("Failed to generate estimation:", error)
      alert("Failed to generate estimation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [formData])

  // Keyboard shortcut for Generate Supply List (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!isLoading) {
          handleEstimateProject()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLoading, handleEstimateProject]) // Dependencies to ensure we have the latest state

  const getPriceScaleLabel = (value: number) => {
    switch (value) {
      case 1: return "$ Budget"
      case 2: return "$$ Standard"
      case 3: return "$$$ Premium"
      default: return "$$ Standard"
    }
  }

  const handleClearProject = () => {
    if (confirm('Are you sure you want to clear all project data? This will remove all saved information and cannot be undone.')) {
      // Clear localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('prospec-')) {
          localStorage.removeItem(key)
        }
      })
      
      // Reset all state
      setFormData({
        projectType: "",
        projectSize: "",
        projectSizeUnit: "tbd",
        projectDescription: "",
        priceScale: 2.0,
        location: "LA",
      })
      setShowEstimation(false)
      setEstimationData(null)
    }
  }

  return (
    <div className="min-h-full bg-neutral-900 text-white">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"></div>
      
      <div className="relative p-2 md:p-6 space-y-3 md:space-y-6">
      <Card className="bg-neutral-900/90 border-neutral-700 backdrop-blur-sm">
        <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium text-neutral-300 tracking-wider">PROJECT REQUIREMENTS</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {/* Single line form layout */}
          <div className="flex flex-col md:flex-row md:space-x-4 mb-3 md:mb-4 space-y-3 md:space-y-0">
            {/* Project Type */}
            <div className="w-full md:w-1/4 mb-0">
              <label className="text-xs text-neutral-500 mb-1 block">PROJECT TYPE</label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, projectType: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-300 h-10 w-full text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-white shadow-xl">
                  <SelectItem value="kitchen-remodel" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Kitchen Remodel</SelectItem>
                  <SelectItem value="bathroom-remodel" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Bathroom Remodel</SelectItem>
                  <SelectItem value="home-addition" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Home Addition</SelectItem>
                  <SelectItem value="basement-finishing" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Basement Finishing</SelectItem>
                  <SelectItem value="deck-patio" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Deck & Patio</SelectItem>
                  <SelectItem value="flooring" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Flooring Installation</SelectItem>
                  <SelectItem value="roofing" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Roofing</SelectItem>
                  <SelectItem value="siding" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Siding & Exterior</SelectItem>
                  <SelectItem value="windows-doors" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Windows & Doors</SelectItem>
                  <SelectItem value="painting" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Interior/Exterior Painting</SelectItem>
                  <SelectItem value="drywall" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Drywall & Texturing</SelectItem>
                  <SelectItem value="plumbing" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Plumbing</SelectItem>
                  <SelectItem value="electrical" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Electrical</SelectItem>
                  <SelectItem value="hvac" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">HVAC</SelectItem>
                  <SelectItem value="landscaping" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Landscaping</SelectItem>
                  <SelectItem value="fence-installation" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Fence Installation</SelectItem>
                  <SelectItem value="concrete-masonry" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Concrete & Masonry</SelectItem>
                  <SelectItem value="insulation" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Insulation</SelectItem>
                  <SelectItem value="tile-work" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Tile Work</SelectItem>
                  <SelectItem value="general-repairs" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">General Repairs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Size */}
            <div className="w-full md:w-1/4 mb-0">
              <label className="text-xs text-neutral-500 mb-1 block">SIZE</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter size or TBD"
                  className={`bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 h-10 flex-1 text-sm ${
                    formData.projectSize === "0" ? "border-red-500" : ""
                  }`}
                  value={formData.projectSizeUnit === "tbd" ? "DEFAULT" : formData.projectSize}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow TBD, numbers, and decimal points
                    if (value === "" || value.toUpperCase() === "TBD" || /^\d*\.?\d*$/.test(value)) {
                      setFormData((prev) => ({ ...prev, projectSize: value }))
                    }
                  }}
                  disabled={formData.projectSizeUnit === "tbd"}
                />
                <Select
                  value={formData.projectSizeUnit}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, projectSizeUnit: value }))}
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white w-24 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 text-white shadow-xl">
                    <SelectItem value="tbd" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">TBD</SelectItem>
                    <SelectItem value="sqft" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">sq ft</SelectItem>
                    <SelectItem value="ft" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">ft</SelectItem>
                    <SelectItem value="sqm" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">sq m</SelectItem>
                    <SelectItem value="m" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">m</SelectItem>
                    <SelectItem value="acres" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">acres</SelectItem>
                    <SelectItem value="units" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">units</SelectItem>
                    <SelectItem value="rooms" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">rooms</SelectItem>
                    <SelectItem value="floors" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">floors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Scale Slider */}
            <div className="w-full md:w-1/4 mb-0">
              <label className="text-xs text-neutral-500 mb-1 block">BUDGET ESTIMATION</label>
              <div className="relative h-10 flex items-center">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={formData.priceScale}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceScale: parseFloat(e.target.value) }))}
                  className="w-16/17 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider mx-auto"
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${((formData.priceScale - 1) / 2) * 100}%, #374151 ${((formData.priceScale - 1) / 2) * 100}%, #374151 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-400 mt-1 px-2">
                <span>$</span>
                <span>$$</span>
                <span>$$$</span>
              </div>
              <div className="text-xs text-orange-500 mt-1 font-medium text-center">
                {getPriceScaleLabel(Math.round(formData.priceScale))}
              </div>
            </div>

            {/* Location (US States) */}
            <div className="w-full md:w-1/4 mb-0">
              <label className="text-xs text-neutral-500 mb-1 block">LOCATION (CLOSEST MAJOR CITY)</label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-300 h-10 w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-white shadow-xl max-h-60">
                  <SelectItem value="ALB" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Albuquerque</SelectItem>
                  <SelectItem value="ANC" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Anchorage</SelectItem>
                  <SelectItem value="ARL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Arlington</SelectItem>
                  <SelectItem value="ATL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Atlanta</SelectItem>
                  <SelectItem value="AUS" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Austin</SelectItem>
                  <SelectItem value="BAL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Baltimore</SelectItem>
                  <SelectItem value="BOS" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Boston</SelectItem>
                  <SelectItem value="BUF" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Buffalo</SelectItem>
                  <SelectItem value="CHA" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Charlotte</SelectItem>
                  <SelectItem value="CHI" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Chicago</SelectItem>
                  <SelectItem value="CLE" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Cleveland</SelectItem>
                  <SelectItem value="COL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Columbus</SelectItem>
                  <SelectItem value="DAL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Dallas</SelectItem>
                  <SelectItem value="DEN" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Denver</SelectItem>
                  <SelectItem value="DET" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Detroit</SelectItem>
                  <SelectItem value="ELP" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">El Paso</SelectItem>
                  <SelectItem value="FW" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Fort Worth</SelectItem>
                  <SelectItem value="FRES" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Fresno</SelectItem>
                  <SelectItem value="HON" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Honolulu</SelectItem>
                  <SelectItem value="HOU" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Houston</SelectItem>
                  <SelectItem value="IND" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Indianapolis</SelectItem>
                  <SelectItem value="JAX" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Jacksonville</SelectItem>
                  <SelectItem value="KC" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Kansas City</SelectItem>
                  <SelectItem value="LA" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Los Angeles</SelectItem>
                  <SelectItem value="LV" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Las Vegas</SelectItem>
                  <SelectItem value="LOU" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Louisville</SelectItem>
                  <SelectItem value="MEM" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Memphis</SelectItem>
                  <SelectItem value="MIA" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Miami</SelectItem>
                  <SelectItem value="MIL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Milwaukee</SelectItem>
                  <SelectItem value="MIN" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Minneapolis</SelectItem>
                  <SelectItem value="NASH" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Nashville</SelectItem>
                  <SelectItem value="NEW" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">New Orleans</SelectItem>
                  <SelectItem value="NYC" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">New York City</SelectItem>
                  <SelectItem value="OKC" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Oklahoma City</SelectItem>
                  <SelectItem value="OMA" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Omaha</SelectItem>
                  <SelectItem value="PHI" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Philadelphia</SelectItem>
                  <SelectItem value="PHX" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Phoenix</SelectItem>
                  <SelectItem value="POR" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Portland</SelectItem>
                  <SelectItem value="RALE" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Raleigh</SelectItem>
                  <SelectItem value="SAC" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Sacramento</SelectItem>
                  <SelectItem value="SAN" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">San Antonio</SelectItem>
                  <SelectItem value="SD" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">San Diego</SelectItem>
                  <SelectItem value="SF" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">San Francisco</SelectItem>
                  <SelectItem value="SJ" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">San Jose</SelectItem>
                  <SelectItem value="SEA" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Seattle</SelectItem>
                  <SelectItem value="TUC" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Tucson</SelectItem>
                  <SelectItem value="TUL" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Tulsa</SelectItem>
                  <SelectItem value="WAS" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Washington DC</SelectItem>
                  <SelectItem value="WICH" className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white cursor-pointer">Wichita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mb-3 md:mb-4">
            <label className="text-xs text-neutral-500 mb-1 block">PROJECT DESCRIPTION</label>
            <Textarea
              placeholder="Describe your project in detail including materials, timeline, special requirements..."
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 min-h-[80px] md:min-h-[100px] text-sm"
              value={formData.projectDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectDescription: e.target.value }))}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-medium disabled:opacity-50 h-10 md:h-auto text-sm"
              onClick={handleEstimateProject}
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-2 w-full">
                <span>
                  {isLoading ? "GENERATING LIST..." : "GENERATE SUPPLY LIST"}
                </span>
                {!isLoading && (
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    <Command className="w-3 h-3" />
                    <CornerDownLeft className="w-3 h-3" />
                  </div>
                )}
              </div>
            </Button>
            <Button
              variant="outline"
              className="px-4 bg-neutral-800 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-300 transition-all h-10 md:h-auto text-sm"
              onClick={handleClearProject}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {showEstimation && estimationData && (
        <EstimationResults
          data={estimationData}
          initialProjectSize={formData.projectSize}
          projectSizeUnit={formData.projectSizeUnit}
          projectDescription={formData.projectDescription}
          priceScale={formData.priceScale === 1 ? "$" : formData.priceScale === 2 ? "$$" : "$$$"}
          location={formData.location}
        />
      )}
      </div>
    </div>
  )
}
