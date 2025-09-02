"use client"

import { Calculator, TrendingUp, Database, Zap, Shield, Building } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingPageProps {
  onNavigateToProjects?: () => void
}

export default function LandingPage({ onNavigateToProjects }: LandingPageProps) {
  return (
    <div className="min-h-full bg-neutral-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
        <div className="relative px-6 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-orange-500/30 rounded-full text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-orange-500 font-mono">SYSTEM ACTIVE</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-white">PRO</span>
              <span className="text-orange-500">SPEC</span>
            </h1>
            <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              AI-driven cost estimation platform for contractors. Access real-time pricing data from major suppliers
              nationwide to build comprehensive project estimates with precision and confidence.
            </p>
            <div className="flex justify-center">
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
                onClick={onNavigateToProjects}
              >
                START ESTIMATING
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-orange-500">CORE</span> CAPABILITIES
            </h2>
            <p className="text-neutral-400 text-lg">Professional-grade tools for accurate project estimation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "REAL-TIME PRICING",
                description: "Live material and equipment costs aggregated from major suppliers across the nation",
              },
              {
                icon: Calculator,
                title: "AI COST ANALYSIS",
                description: "Machine learning algorithms analyze project specs to generate accurate cost breakdowns",
              },
              {
                icon: TrendingUp,
                title: "MARKET TRENDS",
                description: "Track price fluctuations and market trends to optimize project timing and budgets",
              },
              {
                icon: Building,
                title: "PROJECT TEMPLATES",
                description: "Pre-built estimation templates for common construction and contracting projects",
              },
              {
                icon: Zap,
                title: "INSTANT ESTIMATES",
                description: "Generate comprehensive cost packages in minutes, not hours or days",
              },
              {
                icon: Shield,
                title: "VERIFIED SUPPLIERS",
                description: "Trusted network of verified suppliers with competitive pricing and reliable delivery",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded">
                    <feature.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="px-6 py-16 bg-neutral-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-orange-500">PLATFORM</span> METRICS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-neutral-800 border border-neutral-700 rounded-lg">
              <div className="text-3xl font-bold text-orange-500 mb-2">2,847</div>
              <div className="text-neutral-400 text-sm">ACTIVE SUPPLIERS</div>
            </div>
            <div className="text-center p-6 bg-neutral-800 border border-neutral-700 rounded-lg">
              <div className="text-3xl font-bold text-orange-500 mb-2">15K+</div>
              <div className="text-neutral-400 text-sm">PROJECTS ESTIMATED</div>
            </div>
            <div className="text-center p-6 bg-neutral-800 border border-neutral-700 rounded-lg">
              <div className="text-3xl font-bold text-orange-500 mb-2">98.7%</div>
              <div className="text-neutral-400 text-sm">ACCURACY RATE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-6 py-12 border-t border-neutral-700">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded text-sm mb-4">
            <Shield className="w-4 h-4 text-orange-500" />
            <span className="text-orange-400 font-mono">PROFESSIONAL PLATFORM</span>
          </div>
          <p className="text-neutral-500 text-sm">
            PROSPEC provides enterprise-grade cost estimation tools for professional contractors. All pricing data is
            verified and updated in real-time for maximum accuracy.
          </p>
        </div>
      </div>
    </div>
  )
}
