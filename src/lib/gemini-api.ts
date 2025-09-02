interface ProjectData {
  projectType: string
  projectSize: string
  projectDescription: string
  priceScale?: string
  location?: string
}

export interface EstimationItem {
  id: string
  name: string
  description: string
  unit: string
  quantity: number
  baseQuantity: number
  checked: boolean
  removed: boolean
}

interface ParsedItem {
  id?: string
  name: string
  description: string
  unit: string
  quantity: number
}

export interface EstimationResponse {
  supplies: EstimationItem[]
  equipment: EstimationItem[]
}

export async function generateProjectEstimation(projectData: ProjectData): Promise<EstimationResponse> {
  const apiKey = "AIzaSyBWx_wJ_wwVDjJXE3TM2droNOmaULxyoQ0"

  const prompt = `
    You are a highly experienced construction cost estimation expert with deep knowledge of building materials, tools, and project requirements across all construction disciplines.

    ===========================================
    PROJECT ANALYSIS REQUIREMENTS
    ===========================================
    
    PRIMARY SOURCE: ${projectData.projectDescription}
    Supporting Context:
    - Project Type: ${projectData.projectType} (general context only)
    - Project Scale: ${projectData.projectSize}
    - Quality Tier: ${projectData.priceScale || '$$'} (${projectData.priceScale === '$' ? 'Budget/Economy grade materials' : projectData.priceScale === '$$' ? 'Mid-Range/Standard quality materials' : 'Premium/Professional grade materials'})
    - Location: ${projectData.location || 'CA'} (Regional availability and building codes)
    
    ===========================================
    EXPERT ANALYSIS PROTOCOL
    ===========================================
    
    1. COMPREHENSIVE PROJECT UNDERSTANDING
       - Analyze the project description thoroughly to understand the exact scope of work
       - Identify specific construction phases, dimensions, materials, and technical requirements
       - The description is your primary source - use project type only for general context
       - If conflicts exist between project type and description, prioritize the description details
    
    2. PRECISION REQUIREMENTS
       - Generate ONLY items directly required for the described work scope
       - Each item must be essential and justified by the project requirements
       - Avoid generic categories - be specific to the actual work being performed
       - Consider project scale, quality tier, and regional factors in your selections
    
    3. TECHNICAL SPECIFICATIONS
       - Include relevant specifications: dimensions, materials, grades, applications
       - Account for ${projectData.priceScale === '$' ? 'cost-effective but reliable options' : projectData.priceScale === '$$' ? 'standard industry-grade materials and tools' : 'professional-grade, high-performance materials and equipment'}
       - Consider ${projectData.location || 'California'} building codes, climate, and material availability
       - Ensure compatibility between all selected items
    
    ===========================================
    CATEGORIZATION STANDARDS
    ===========================================
    
    SUPPLIES (Materials consumed/installed):
    - Raw materials, fasteners, adhesives, sealants
    - Pipes, wiring, insulation, finishing materials
    - Consumable items that become part of the final structure
    
    EQUIPMENT (Tools and equipment used):
    - Hand tools, power tools, measuring instruments
    - Safety equipment, containers, temporary structures
    - Rental equipment for specific project phases
    
    ===========================================
    NAMING AND SPECIFICATION STANDARDS
    ===========================================
    
    ITEM NAME SPECIFICITY REQUIREMENTS:
    - Item names should be JUST the specific product name with specifications
    - Include material type when relevant (stainless steel, galvanized, pressure-treated)
    - Include dimensions for standard sizes (2x4, 3/4-inch, 12-gauge)
    - Add grade/quality indicators when applicable (commercial-grade, heavy-duty)
    - DO NOT include application purpose in the name (no "for..." phrases)
    - Put application context and reasoning in the description field instead
    
    BRAND NEUTRALITY REQUIREMENTS:
    - Never reference specific manufacturers or model numbers
    - Use functional descriptions with technical specifications
    - Focus on performance characteristics and standards
    
    EXAMPLES OF PROPER NAMING:
    ✓ Name: "2x4x8 pressure-treated lumber" | Description: "Structural lumber for deck framing applications"
    ✓ Name: "3/4-inch copper pipe fittings" | Description: "Plumbing fittings for water supply connections"
    ✓ Name: "Cordless impact driver" | Description: "Power tool for driving screws and fasteners in construction"
    ✓ Name: "Galvanized roofing screws with EPDM washers" | Description: "Weather-resistant fasteners for metal roofing attachment"
    
    ===========================================
    QUANTITY AND SCALE GUIDELINES
    ===========================================
    
    PROJECT SIZE OPTIMIZATION:
    - Small projects (repairs/maintenance): Maximum 4-12 total items
    - Medium projects (room renovation): Maximum 15-25 total items  
    - Large projects (major construction): Maximum 30-40 total items
    - Always prioritize the most critical items if approaching limits
    
    QUANTITY CALCULATIONS:
    - Base quantities on actual project requirements with minimal waste factor
    - CRITICAL: Scale all quantities appropriately for the specified project scale: ${projectData.projectSize}
    - Consider standard packaging/ordering units for the given project scale
    - Account for project size and complexity in your estimates - larger scale = proportionally more materials
    - Ensure quantities are realistic and implementable for a ${projectData.projectSize} project
    - Use the project scale to determine if quantities should be minimal (small) or substantial (large)
    
    ===========================================
    QUALITY AND EFFICIENCY DIRECTIVES
    ===========================================
    
    OUTPUT QUALITY STANDARDS:
    - Every item must be directly justified by the project description
    - Eliminate redundancy - no overlapping or duplicate items
    - Ensure logical completeness - include all essential items for successful project completion
    - Maintain professional-level accuracy in specifications and quantities
    
    EFFICIENCY REQUIREMENTS:
    - Prioritize multi-purpose items when appropriate
    - Consider workflow efficiency in tool and equipment selection
    - Account for project timeline and staging requirements
    - Optimize for the specified quality tier and budget constraints
    
    ===========================================
    OUTPUT FORMAT REQUIREMENTS
    ===========================================
    
    You MUST respond with ONLY a valid JSON object in exactly this structure:
    {
      "supplies": [
        {
          "id": "unique_id",
          "name": "Specific Item Name Only (no 'for...' phrases)",
          "description": "Brief description including application and purpose",
          "unit": "measurement unit",
          "quantity": number
        }
      ],
      "equipment": [
        {
          "id": "unique_id",
          "name": "Specific Equipment Name Only (no 'for...' phrases)", 
          "description": "Brief description including application and purpose",
          "unit": "measurement unit",
          "quantity": number
        }
      ]
    }
    
    CRITICAL OUTPUT RULES:
    - Return ONLY the JSON object, no additional text
    - Do NOT wrap in markdown code blocks
    - Do NOT include explanations or comments
    - Ensure valid JSON syntax with proper quotes and commas
    - All string values must be in double quotes
    - Quantity values must be numbers (not strings)`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      },
    )

    if (!response.ok) {
      throw new Error("Failed to generate estimation")
    }

    const data = await response.json()
    const generatedText = data.candidates[0].content.parts[0].text

    console.log("[v0] Raw Gemini response:", generatedText)

    // Remove markdown code blocks if present
    let cleanedText = generatedText.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim()

    // Remove any comments (lines starting with //)
    cleanedText = cleanedText.replace(/\/\/.*$/gm, "")

    // Extract JSON from the cleaned response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[v0] No JSON found in response:", cleanedText)
      throw new Error("Invalid response format - no JSON found")
    }

    console.log("[v0] Extracted JSON:", jsonMatch[0])

    let parsedData
    try {
      parsedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      console.error("[v0] Attempted to parse:", jsonMatch[0])
      throw new Error(`JSON Parse error: ${parseError}`)
    }

    // Function to remove brand names and make items generic
    const makeBrandNeutral = (item: ParsedItem): ParsedItem => {
      const commonBrands = [
        'fluidmaster', 'dewalt', 'milwaukee', 'makita', 'ryobi', 'black & decker', 'craftsman',
        'home depot', 'lowes', 'kobalt', 'husky', 'ridgid', 'porter cable', 'bosch',
        'stanley', 'irwin', 'klein', 'crescent', 'channellock', 'grk', 'simpson strong-tie'
      ]
      
      let cleanName = item.name
      let cleanDescription = item.description
      
      // Remove brand names from name and description
      commonBrands.forEach(brand => {
        const regex = new RegExp(`\\b${brand}\\b`, 'gi')
        cleanName = cleanName.replace(regex, '').trim()
        cleanDescription = cleanDescription.replace(regex, '').trim()
      })
      
      // Remove model numbers (alphanumeric codes)
      cleanName = cleanName.replace(/\b[A-Z0-9]{3,}\b/g, '').trim()
      cleanDescription = cleanDescription.replace(/\b[A-Z0-9]{3,}\b/g, '').trim()
      
      // Clean up extra spaces
      cleanName = cleanName.replace(/\s+/g, ' ').trim()
      cleanDescription = cleanDescription.replace(/\s+/g, ' ').trim()
      
      return {
        ...item,
        name: cleanName,
        description: cleanDescription
      }
    }

    // Validate and clean the data to prevent duplicates
    const allItemNames = new Set<string>()
    
    // Add default properties to each item, remove duplicates, and make brand neutral
    const supplies = parsedData.supplies
      .map(makeBrandNeutral)
      .filter((item: ParsedItem) => {
        const normalizedName = item.name.toLowerCase().trim()
        if (allItemNames.has(normalizedName)) {
          console.warn(`[v0] Duplicate item removed from supplies: ${item.name}`)
          return false
        }
        allItemNames.add(normalizedName)
        return true
      })
      .map((item: ParsedItem, index: number) => ({
        ...item,
        id: item.id || `supply-${index}`,
        baseQuantity: item.quantity,
        checked: false,
        removed: false,
      }))

    const equipment = parsedData.equipment
      .map(makeBrandNeutral)
      .filter((item: ParsedItem) => {
        const normalizedName = item.name.toLowerCase().trim()
        if (allItemNames.has(normalizedName)) {
          console.warn(`[v0] Duplicate item removed from equipment: ${item.name}`)
          return false
        }
        allItemNames.add(normalizedName)
        return true
      })
      .map((item: ParsedItem, index: number) => ({
        ...item,
        id: item.id || `equipment-${index}`,
        baseQuantity: item.quantity,
        checked: false,
        removed: false,
      }))

    // Enforce 50-item limit
    const totalItems = supplies.length + equipment.length
    if (totalItems > 50) {
      console.warn(`[v0] Total items (${totalItems}) exceeds 50-item limit. Trimming to essential items.`)
      
      // Prioritize supplies over equipment, but keep a reasonable balance
      const maxSupplies = Math.min(supplies.length, 35) // Allow up to 35 supplies
      const maxEquipment = Math.min(equipment.length, 50 - maxSupplies) // Fill remaining with equipment
      
      const trimmedSupplies = supplies.slice(0, maxSupplies)
      const trimmedEquipment = equipment.slice(0, maxEquipment)
      
      console.log(`[v0] Trimmed to ${trimmedSupplies.length} supplies and ${trimmedEquipment.length} equipment (total: ${trimmedSupplies.length + trimmedEquipment.length})`)
      
      return { supplies: trimmedSupplies, equipment: trimmedEquipment }
    }

    return { supplies, equipment }
  } catch (error) {
    console.error("Error generating estimation:", error)
    // Return fallback mock data if API fails
    return {
      supplies: [
        {
          id: "supply-1",
          name: "Concrete Mix",
          description: "Ready-mix concrete for foundation",
          unit: "cubic yards",
          quantity: 15,
          baseQuantity: 15,
          checked: false,
          removed: false,
        },
      ],
      equipment: [
        {
          id: "equipment-1",
          name: "Excavator",
          description: "Mini excavator for site preparation",
          unit: "days",
          quantity: 3,
          baseQuantity: 3,
          checked: false,
          removed: false,
        },
      ],
    }
  }
}
