import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ObligationStatus = 'not_started' | 'in_progress' | 'partial' | 'completed'

interface UpdateRequest {
  country_code: string
  obligation_id: string
  status: ObligationStatus
  status_notes?: string
  evidence_url?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing or invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the JWT and get claims
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.log('JWT verification failed:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub
    console.log('Authenticated user:', userId)

    // Parse request body
    let body: UpdateRequest
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    const { country_code, obligation_id, status, status_notes, evidence_url } = body

    if (!country_code || typeof country_code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'country_code is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!obligation_id || typeof obligation_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'obligation_id is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validStatuses: ObligationStatus[] = ['not_started', 'in_progress', 'partial', 'completed']
    if (!status || !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          error: `status must be one of: ${validStatuses.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate country_code format (2-letter ISO code)
    if (!/^[A-Z]{2}$/.test(country_code.toUpperCase())) {
      return new Response(
        JSON.stringify({ error: 'country_code must be a 2-letter ISO country code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate optional fields
    if (status_notes !== undefined && typeof status_notes !== 'string') {
      return new Response(
        JSON.stringify({ error: 'status_notes must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (evidence_url !== undefined && typeof evidence_url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'evidence_url must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate evidence_url format if provided
    if (evidence_url) {
      try {
        new URL(evidence_url)
      } catch {
        return new Response(
          JSON.stringify({ error: 'evidence_url must be a valid URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Use service role to check country assignment (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if user is assigned to this country
    const { data: assignment, error: assignmentError } = await serviceClient
      .from('user_country_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('country_code', country_code.toUpperCase())
      .maybeSingle()

    if (assignmentError) {
      console.error('Error checking country assignment:', assignmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify country assignment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also check if user is admin/super_admin (they can update any country)
    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin'])

    const isAdmin = roleData && roleData.length > 0

    if (!assignment && !isAdmin) {
      console.log(`User ${userId} is not assigned to country ${country_code} and is not an admin`)
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - you are not assigned to this country' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the obligation exists
    const { data: obligation, error: obligationError } = await serviceClient
      .from('ehds_obligations')
      .select('id, name')
      .eq('id', obligation_id)
      .eq('is_active', true)
      .maybeSingle()

    if (obligationError) {
      console.error('Error checking obligation:', obligationError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify obligation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!obligation) {
      return new Response(
        JSON.stringify({ error: 'Obligation not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert the obligation status
    const { data: result, error: upsertError } = await serviceClient
      .from('country_obligation_status')
      .upsert({
        country_code: country_code.toUpperCase(),
        obligation_id,
        status,
        status_notes: status_notes || null,
        evidence_url: evidence_url || null,
        last_verified_at: new Date().toISOString(),
      }, {
        onConflict: 'country_code,obligation_id',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting status:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to update obligation status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully updated obligation status for ${country_code}/${obligation_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Updated ${obligation.name} status for ${country_code} to ${status}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
