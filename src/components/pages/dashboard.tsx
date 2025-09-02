"use client"

import { useState, useEffect } from "react"
import { Plus, Users, Smartphone, RefreshCw, Home, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import EstimationPage from "@/app/estimation/page"
import WaitlistPage from "@/app/waitlist/page"
import LandingPage from "@/components/pages/landing"
import PasswordProtection from "../password-protection"

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("landing")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isIPhone15Mode, setIsIPhone15Mode] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileScreen = window.innerWidth < 768
      setIsMobile(isMobileScreen || isIPhone15Mode)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [isIPhone15Mode])

  // Toggle iPhone 15 mode
  const toggleIPhone15Mode = () => {
    setIsIPhone15Mode(!isIPhone15Mode)
  }

  // Close mobile menu when section changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [activeSection, isMobile])

  const navigationItems = [
    { id: "landing", icon: Home, label: "OVERVIEW" },
    { id: "overview", icon: Plus, label: "PROJECTS (DEMO)" },
    { id: "agents", icon: Users, label: "JOIN WAITLIST" },
  ]

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
    setIsMobileMenuOpen(false)
  }

  const renderContent = () => (
    <>
              {/* Mobile Header */}
      {isMobile && (
        <div className={`${isIPhone15Mode ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-50 h-14 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-3`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-xs tracking-wider">
                <span className="text-white">PRO</span><span className="text-orange-500">SPEC</span>
              </h1>
            </div>
          </div>
          <div className="text-xs text-neutral-400 truncate">
            {activeSection === "landing"
              ? "OVERVIEW"
              : activeSection === "overview"
                ? "PROJECTS"
                : "WAITLIST"}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-80 bg-neutral-900 border-r border-neutral-700 flex-shrink-0">
          <div className="p-6">
            <div className="mb-8">
              <h1 className="font-bold text-xl tracking-wider">
                <span className="text-white">PRO</span><span className="text-orange-500">SPEC</span>
              </h1>
              <p className="text-neutral-500 text-sm mt-1">ESTIMATE WITH CONFIDENCE</p>
            </div>

            <nav className="space-y-3">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white font-medium">TESTING PROTOTYPE</span>
              </div>
              <div className="text-xs text-neutral-500 space-y-1">
                <div>UPTIME: 72:14:33</div>
                <div>PROJECTS: 847 ESTIMATED</div>
                <div>ESTIMATIONS: $23,469 ONGOING</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-80 bg-neutral-900 border-r border-neutral-700 z-50 transform transition-transform">
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-bold text-lg tracking-wider">
                    <span className="text-white">PRO</span><span className="text-orange-500">SPEC</span>
                  </h1>
                  <p className="text-neutral-500 text-xs">ESTIMATE WITH CONFIDENCE</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-neutral-400 hover:text-orange-500"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                      activeSection === item.id
                        ? "bg-orange-500 text-white"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs text-white">TESTING PROTOTYPE</span>
                </div>
                <div className="text-xs text-neutral-500">
                  <div>UPTIME: 72:14:33</div>
                  <div>PROJECTS: 847 ESTIMATED</div>
                  <div>ESTIMATIONS: $23,469 ONGOING</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile ? 'pt-14' : ''}`}>
        {/* Desktop Top Toolbar */}
        {!isMobile && (
          <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-400">
                PROSPEC /{" "}
                <span className="text-orange-500">
                  {activeSection === "landing"
                    ? "OVERVIEW"
                    : activeSection === "overview"
                      ? "PROJECTS"
                      : "JOIN WAITLIST"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-neutral-500">A KAIZENWORKS PRODUCT</div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleIPhone15Mode}
                className={`${isIPhone15Mode ? 'text-orange-500 bg-orange-500/20' : 'text-neutral-400 hover:text-orange-500'}`}
                title={isIPhone15Mode ? 'Exit iPhone 15 Preview' : 'iPhone 15 Preview'}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          <div className={`min-h-full ${isMobile ? 'p-2 pb-16' : ''}`}>
            {activeSection === "landing" && <LandingPage onNavigateToProjects={() => setActiveSection("overview")} />}
            {activeSection === "overview" && <EstimationPage />}
            {activeSection === "agents" && <WaitlistPage />}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className={`${isIPhone15Mode ? 'absolute' : 'fixed'} bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 px-2 py-1 z-30`}>
            <div className="flex justify-around">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
                    activeSection === item.id
                      ? "text-orange-500"
                      : "text-neutral-400"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )

  const appContent = isIPhone15Mode ? (
    <div className="flex justify-center items-center min-h-screen bg-black p-4">
      <div className="w-[393px] h-[852px] bg-neutral-900 rounded-[47px] border-4 border-neutral-800 shadow-2xl overflow-hidden relative">
        {/* iPhone 15 Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50"></div>
        
        {/* Exit Button */}
        <div className="absolute top-2 right-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleIPhone15Mode}
            className="text-neutral-400 hover:text-orange-500 text-xs px-2 py-1"
          >
            Exit
          </Button>
        </div>
        
        <div className="w-full h-full bg-neutral-900 flex flex-col relative">
          {renderContent()}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-screen bg-neutral-900">
      {renderContent()}
    </div>
  )

  return (
    <PasswordProtection>
      {appContent}
    </PasswordProtection>
  )
}