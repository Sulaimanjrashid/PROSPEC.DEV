import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Types for our waitlist table
export interface WaitlistEntry {
  id: number
  email: string
  timestamp: string
  confirmed: boolean
}

// Database operations
export const waitlistOperations = {
  // Add email to waitlist
  async addEmail(email: string): Promise<{ data: WaitlistEntry | null; error: unknown }> {
    return await supabase
      .from('waitlist')
      .insert([{ email }])
      .select()
      .single()
  },

  // Check if email already exists
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single()
    
    return !!data && !error
  },

  // Get all waitlist entries (admin only)
  async getAllEntries(): Promise<{ data: WaitlistEntry[] | null; error: unknown }> {
    return await supabaseAdmin
      .from('waitlist')
      .select('*')
      .order('timestamp', { ascending: false })
  },

  // Confirm email
  async confirmEmail(email: string): Promise<{ data: WaitlistEntry[] | null; error: unknown }> {
    return await supabase
      .from('waitlist')
      .update({ confirmed: true })
      .eq('email', email)
      .select()
  }
}
