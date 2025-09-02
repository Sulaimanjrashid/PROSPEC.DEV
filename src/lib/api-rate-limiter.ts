/**
 * Session-based API rate limiter for SERP API calls
 * Implements a token bucket algorithm to limit API calls to 50 per session
 */

interface SessionData {
  apiCallCount: number
  sessionStartTime: number
  lastCallTime: number
}

// Server-side session storage (in-memory)
const serverSessions = new Map<string, SessionData>()

class APIRateLimiter {
  private static instance: APIRateLimiter
  private sessionKey = 'prospec-serp-api-session'
  private serverSessionKey = 'default-server-session'
  private maxCallsPerSession = 50
  private sessionTimeoutMs = 24 * 60 * 60 * 1000 // 24 hours

  private constructor() {}

  static getInstance(): APIRateLimiter {
    if (!APIRateLimiter.instance) {
      APIRateLimiter.instance = new APIRateLimiter()
    }
    return APIRateLimiter.instance
  }

  private getSessionData(): SessionData {
    if (typeof window === 'undefined') {
      // Server-side: use in-memory storage
      let sessionData = serverSessions.get(this.serverSessionKey)
      
      if (!sessionData) {
        // Create new server session
        sessionData = {
          apiCallCount: 0,
          sessionStartTime: Date.now(),
          lastCallTime: 0
        }
        serverSessions.set(this.serverSessionKey, sessionData)
        console.log('[API Rate Limiter] Created new server session')
      } else {
        // Check if session has expired
        if (Date.now() - sessionData.sessionStartTime > this.sessionTimeoutMs) {
          console.log('[API Rate Limiter] Server session expired, creating new session')
          sessionData = {
            apiCallCount: 0,
            sessionStartTime: Date.now(),
            lastCallTime: 0
          }
          serverSessions.set(this.serverSessionKey, sessionData)
        }
      }
      
      return sessionData
    }

    try {
      const stored = localStorage.getItem(this.sessionKey)
      if (!stored) {
        return this.createNewSession()
      }

      const sessionData: SessionData = JSON.parse(stored)
      
      // Check if session has expired
      if (Date.now() - sessionData.sessionStartTime > this.sessionTimeoutMs) {
        console.log('[API Rate Limiter] Session expired, creating new session')
        return this.createNewSession()
      }

      return sessionData
    } catch (error) {
      console.error('[API Rate Limiter] Error reading session data:', error)
      return this.createNewSession()
    }
  }

  private createNewSession(): SessionData {
    const newSession: SessionData = {
      apiCallCount: 0,
      sessionStartTime: Date.now(),
      lastCallTime: 0
    }
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.sessionKey, JSON.stringify(newSession))
      } catch (error) {
        console.error('[API Rate Limiter] Error saving new session:', error)
      }
    }
    
    return newSession
  }

  private saveSessionData(sessionData: SessionData): void {
    if (typeof window === 'undefined') {
      // Server-side: save to in-memory storage
      serverSessions.set(this.serverSessionKey, sessionData)
      return
    }

    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData))
    } catch (error) {
      console.error('[API Rate Limiter] Error saving session data:', error)
    }
  }

  /**
   * Check if an API call can be made
   * @returns {boolean} true if call is allowed, false if limit exceeded
   */
  canMakeCall(): boolean {
    const sessionData = this.getSessionData()
    return sessionData.apiCallCount < this.maxCallsPerSession
  }

  /**
   * Record an API call and update the session data
   * @returns {boolean} true if call was recorded, false if limit would be exceeded
   */
  recordCall(): boolean {
    const sessionData = this.getSessionData()
    
    if (sessionData.apiCallCount >= this.maxCallsPerSession) {
      console.warn(`[API Rate Limiter] API call limit reached (${this.maxCallsPerSession} calls per session)`)
      return false
    }

    sessionData.apiCallCount += 1
    sessionData.lastCallTime = Date.now()
    
    this.saveSessionData(sessionData)
    
    console.log(`[API Rate Limiter] API call recorded. Count: ${sessionData.apiCallCount}/${this.maxCallsPerSession}`)
    return true
  }

  /**
   * Get current session statistics
   */
  getSessionStats(): {
    callsUsed: number
    callsRemaining: number
    maxCalls: number
    sessionAge: number
  } {
    const sessionData = this.getSessionData()
    return {
      callsUsed: sessionData.apiCallCount,
      callsRemaining: this.maxCallsPerSession - sessionData.apiCallCount,
      maxCalls: this.maxCallsPerSession,
      sessionAge: Date.now() - sessionData.sessionStartTime
    }
  }

  /**
   * Sync server session with client session data (for persistence across server restarts)
   */
  syncWithClientSession(clientSessionData: SessionData): void {
    if (typeof window === 'undefined') {
      // Server-side: update server session with client data
      const currentTime = Date.now()
      
      // Validate client session data
      if (clientSessionData.apiCallCount >= 0 && 
          clientSessionData.sessionStartTime > 0 && 
          currentTime - clientSessionData.sessionStartTime < this.sessionTimeoutMs) {
        
        serverSessions.set(this.serverSessionKey, {
          apiCallCount: clientSessionData.apiCallCount,
          sessionStartTime: clientSessionData.sessionStartTime,
          lastCallTime: clientSessionData.lastCallTime || currentTime
        })
        
        console.log('[API Rate Limiter] Server session synced with client data:', {
          apiCallCount: clientSessionData.apiCallCount,
          sessionAge: currentTime - clientSessionData.sessionStartTime
        })
      } else {
        console.log('[API Rate Limiter] Client session data invalid or expired, keeping server session')
      }
    }
  }

  /**
   * Reset the session (for testing or manual reset)
   */
  resetSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.sessionKey)
    } else {
      serverSessions.delete(this.serverSessionKey)
    }
    console.log('[API Rate Limiter] Session reset')
  }

  /**
   * Get remaining calls in current session
   */
  getRemainingCalls(): number {
    const sessionData = this.getSessionData()
    return Math.max(0, this.maxCallsPerSession - sessionData.apiCallCount)
  }
}

export default APIRateLimiter
