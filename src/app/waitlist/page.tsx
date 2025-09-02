"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  CheckCircle, 
  Package, 
  Search, 
  DollarSign, 
  Users, 
  MapPin, 
  Download,
  BarChart3,
  Globe
} from "lucide-react"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Here you would typically send the email to your backend
      console.log("Email submitted:", email)
      setIsSubmitted(true)
      setEmail("")
    }
  }

  const upcomingFeatures = [
    {
      icon: Package,
      title: "Personal Inventory Management",
      description: "Smart supply lists that automatically account for your existing inventory, reducing waste and optimizing purchases for maximum efficiency."
    },
    {
      icon: Search,
      title: "Enhanced API Search Limits",
      description: "Increased monthly API searches with premium tiers offering unlimited pricing lookups and real-time market data access."
    },
    {
      icon: DollarSign,
      title: "Multi-Supplier Price Matching",
      description: "Expanded network of suppliers including Lowe's, Menards, and local distributors with intelligent price comparison and best deal recommendations."
    },
    {
      icon: Users,
      title: "Multi-User Collaboration",
      description: "Team workspaces allowing contractors, architects, and clients to collaborate on estimates with role-based permissions and real-time updates."
    },
    {
      icon: MapPin,
      title: "Smart Store Locator",
      description: "Integrated store finder that shows inventory availability, driving directions, and pickup scheduling for your entire supply list."
    },
    {
      icon: Download,
      title: "Advanced Export Options",
      description: "Export estimates to Excel, PDF, QuickBooks, and construction management software with customizable templates and branding."
    },
    {
      icon: BarChart3,
      title: "Project Analytics Dashboard",
      description: "Comprehensive reporting on cost trends, supplier performance, and project profitability with predictive insights and recommendations."
    },
    {
      icon: Globe,
      title: "Supply Chain Trend Tracking",
      description: "Monitor emerging supply chain patterns and market conditions to identify optimal purchasing windows and avoid price spikes."
    }
  ]

  return (
    <div className="min-h-full bg-neutral-900 text-white">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"></div>
      
      <div className="relative p-6 space-y-6">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-800 border border-orange-500/30 rounded-full text-xs mb-3">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-orange-500 font-mono">COMING SOON</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider mb-3">
            <span className="text-white">NEXT-GEN</span>{" "}
            <span className="text-white">PRO</span><span className="text-orange-500">SPEC</span>
          </h1>
          <p className="text-sm text-neutral-300 max-w-xl mx-auto">
            Join the waitlist for exclusive early access to revolutionary features.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Features Grid - Left Side */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingFeatures.map((feature, index) => (
                <Card key={index} className="bg-neutral-900/90 border-neutral-700 backdrop-blur-sm hover:border-orange-500/50 transition-all duration-300 group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500/20 rounded group-hover:bg-orange-500/30 transition-colors">
                        <feature.icon className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-orange-500 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Email Signup Section - Right Side */}
          <div className="lg:col-span-1">
            <Card className="bg-neutral-900/90 border-neutral-700 backdrop-blur-sm h-full">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-bold text-white tracking-wider mb-2">
                  GET EARLY ACCESS
                </CardTitle>
                <p className="text-neutral-400 text-sm">
                  Be the first to experience the future of construction estimation
                </p>
              </CardHeader>
              <CardContent>
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 py-2 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wider py-2"
                    >
                      JOIN WAITLIST
                    </Button>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-neutral-400">
                        You&apos;ll be notified when features are available
                      </p>
                      <p className="text-xs text-neutral-500">
                        Early access members get 50% off first year
                      </p>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-white font-bold text-lg tracking-wider mb-2">WELCOME!</h3>
                    <p className="text-neutral-300 text-sm mb-2">
                      You&apos;re on the waitlist.
                    </p>
                    <p className="text-neutral-400 text-xs mb-4">
                      We&apos;ll notify you when ready.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white bg-transparent text-sm"
                    >
                      Add Another Email
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
