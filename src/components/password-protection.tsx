"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, AlertCircle, Eye, EyeOff } from "lucide-react"

interface PasswordProtectionProps {
  children: React.ReactNode
}

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const CORRECT_PASSWORD = "rafikiworks"
  const AUTH_KEY = "prospec-auth-token"

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const authToken = localStorage.getItem(AUTH_KEY)
    if (authToken === "authenticated") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.toLowerCase() === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      setError("")
      // Store authentication in localStorage
      localStorage.setItem(AUTH_KEY, "authenticated")
    } else {
      setError("Incorrect password. Please try again.")
      setPassword("")
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) {
      setError("")
    }
  }

  // Show loading state briefly to prevent flash
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // If authenticated, show the main app
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show password protection overlay
  return (
    <div className="fixed inset-0 z-50">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md"></div>
      
      {/* Blurred content behind */}
      <div className="absolute inset-0 filter blur-sm pointer-events-none">
        {children}
      </div>
      
      {/* Password prompt */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-neutral-800 border-neutral-700 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-orange-500" />
            </div>
            <CardTitle className="text-4xl font-bold text-white mb-1">
              <span className="text-white">PRO</span><span className="text-orange-500">SPEC</span>
            </CardTitle>
            <div className="text-xs text-neutral-500 mb-3 font-mono tracking-wider">
              A KAIZENWORKS PRODUCT
            </div>
            <div className="text-lg font-medium text-neutral-300">
              PROTOTYPE ACCESS
            </div>
            <p className="text-sm text-neutral-400 mt-2">
              This prototype is locked for testing purposes.
              <br />
              Please enter the access password to continue.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400 h-12 text-center text-lg pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-3">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-12 text-lg"
                disabled={!password.trim()}
              >
                ACCESS PROTOTYPE
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-neutral-700">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-700 rounded-full text-xs text-neutral-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-mono">SECURE ACCESS REQUIRED</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
