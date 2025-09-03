import { NextRequest, NextResponse } from 'next/server'
import { waitlistOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const exists = await waitlistOperations.emailExists(email)
    if (exists) {
      return NextResponse.json(
        { error: 'Email is already on the waitlist' },
        { status: 409 }
      )
    }

    // Add email to waitlist
    const { data, error } = await waitlistOperations.addEmail(email)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to add email to waitlist' },
        { status: 500 }
      )
    }

    // Send confirmation email via Supabase Edge Function
    try {
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-confirmation-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      )

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.warn('Failed to send confirmation email:', errorText)
      } else {
        const emailResult = await emailResponse.json()
        console.log('Confirmation email sent successfully:', emailResult)
      }
    } catch (emailError) {
      console.error('Error calling email Edge Function:', emailError)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist! Check your email for confirmation.',
      data: data
    })

  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all waitlist entries (admin endpoint)
    const { data, error } = await waitlistOperations.getAllEntries()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data
    })

  } catch (error) {
    console.error('Waitlist fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
