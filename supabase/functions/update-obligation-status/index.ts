import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
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

interface AuthResult {
  userId: string
  apiKeyId?: string
  allowedCountries: string[]
  isAdmin: boolean
}

// Hash a string using SHA-256
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Log API request
// deno-lint-ignore no-explicit-any
async function logRequest(
  serviceClient: any,
  params: {
    apiKeyId?: string
    userId?: string
    endpoint: string
    method: string
    countryCode?: string
    obligationId?: string
    statusCode: number
    responseMessage: string
    ipAddress?: string
    userAgent?: string
    requestBody?: unknown
  }
) {
  try {
    await serviceClient.from('api_logs').insert({
      api_key_id: params.apiKeyId || null,
      user_id: params.userId || null,
      endpoint: params.endpoint,
      method: params.method,
      country_code: params.countryCode || null,
      obligation_id: params.obligationId || null,
      status_code: params.statusCode,
      response_message: params.responseMessage,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      request_body: params.requestBody || null,
    })
  } catch (err) {
    console.error('Failed to log request:', err)
  }
}

// Authenticate via API key or JWT
// deno-lint-ignore no-explicit-any
async function authenticate(
  req: Request,
  serviceClient: any
): Promise<{ result?: AuthResult; error?: { message: string; status: number } }> {
  const apiKey = req.headers.get('X-API-Key')
  const authHeader = req.headers.get('Authorization')

  // Try API key first
  if (apiKey) {
    const keyHash = await hashKey(apiKey)
    
    const { data: keyData, error: keyError } = await serviceClient
      .from('api_keys')
      .select('id, user_id, country_codes, is_active, expires_at')
      .eq('key_hash', keyHash)
      .maybeSingle()

    if (keyError) {
      console.error('Error looking up API key:', keyError)
      return { error: { message: 'Authentication error', status: 500 } }
    }

    if (!keyData) {
      return { error: { message: 'Invalid API key', status: 401 } }
    }

    if (!keyData.is_active) {
      return { error: { message: 'API key has been revoked', status: 401 } }
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { error: { message: 'API key has expired', status: 401 } }
    }

    // Update last_used_at
    await serviceClient
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)

    // Check if user is admin
    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', keyData.user_id)
      .in('role', ['admin', 'super_admin'])

    return {
      result: {
        userId: keyData.user_id,
        apiKeyId: keyData.id,
        allowedCountries: keyData.country_codes || [],
        isAdmin: !!(roleData && roleData.length > 0),
      }
    }
  }

  // Try JWT auth
  if (authHeader?.startsWith('Bearer ')) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    // deno-lint-ignore no-explicit-any
    const { data: claimsData, error: claimsError } = await (supabase.auth as any).getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      return { error: { message: 'Invalid JWT token', status: 401 } }
    }

    const userId = claimsData.claims.sub

    // Get user's assigned countries
    const { data: assignments } = await serviceClient
      .from('user_country_assignments')
      .select('country_code')
      .eq('user_id', userId)

    // Check if user is admin
    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'super_admin'])

    return {
      result: {
        userId,
        // deno-lint-ignore no-explicit-any
        allowedCountries: assignments?.map((a: any) => a.country_code) || [],
        isAdmin: !!(roleData && roleData.length > 0),
      }
    }
  }

  return { error: { message: 'Missing authentication - provide X-API-Key header or Bearer token', status: 401 } }
}

Deno.serve(async (req) => {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('cf-connecting-ip') || 
                    'unknown'
  const userAgent = req.headers.get('user-agent') || undefined

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

  // Create service client for DB operations
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let authResult: AuthResult | undefined
  let requestBody: UpdateRequest | undefined

  try {
    // Authenticate
    const authResponse = await authenticate(req, serviceClient)
    
    if (authResponse.error) {
      await logRequest(serviceClient, {
        endpoint: '/update-obligation-status',
        method: 'POST',
        statusCode: authResponse.error.status,
        responseMessage: authResponse.error.message,
        ipAddress,
        userAgent,
      })
      
      return new Response(
        JSON.stringify({ error: authResponse.error.message }),
        { status: authResponse.error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    authResult = authResponse.result!
    console.log('Authenticated user:', authResult.userId, 'via', authResult.apiKeyId ? 'API key' : 'JWT')

    // Parse request body
    try {
      requestBody = await req.json()
    } catch {
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        statusCode: 400,
        responseMessage: 'Invalid JSON body',
        ipAddress,
        userAgent,
      })
      
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    const { country_code, obligation_id, status, status_notes, evidence_url } = requestBody!

    if (!country_code || typeof country_code !== 'string') {
      const msg = 'country_code is required and must be a string'
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        statusCode: 400,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!obligation_id || typeof obligation_id !== 'string') {
      const msg = 'obligation_id is required and must be a string'
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: country_code,
        statusCode: 400,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validStatuses: ObligationStatus[] = ['not_started', 'in_progress', 'partial', 'completed']
    if (!status || !validStatuses.includes(status)) {
      const msg = `status must be one of: ${validStatuses.join(', ')}`
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: country_code,
        obligationId: obligation_id,
        statusCode: 400,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate country_code format (2-letter ISO code)
    const normalizedCountryCode = country_code.toUpperCase()
    if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) {
      const msg = 'country_code must be a 2-letter ISO country code'
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: country_code,
        obligationId: obligation_id,
        statusCode: 400,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate optional fields
    if (status_notes !== undefined && typeof status_notes !== 'string') {
      const msg = 'status_notes must be a string'
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: normalizedCountryCode,
        obligationId: obligation_id,
        statusCode: 400,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (evidence_url !== undefined && typeof evidence_url !== 'string') {
      const msg = 'evidence_url must be a string'
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: normalizedCountryCode,
        obligationId: obligation_id,
        statusCode: 400,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate evidence_url format if provided
    if (evidence_url) {
      try {
        new URL(evidence_url)
      } catch {
        const msg = 'evidence_url must be a valid URL'
        await logRequest(serviceClient, {
          apiKeyId: authResult.apiKeyId,
          userId: authResult.userId,
          endpoint: '/update-obligation-status',
          method: 'POST',
          countryCode: normalizedCountryCode,
          obligationId: obligation_id,
          statusCode: 400,
          responseMessage: msg,
          ipAddress,
          userAgent,
          requestBody,
        })
        
        return new Response(
          JSON.stringify({ error: msg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check authorization for this country
    const canAccessCountry = authResult.isAdmin || 
      authResult.allowedCountries.includes(normalizedCountryCode)

    if (!canAccessCountry) {
      const msg = 'Forbidden - you are not authorized for this country'
      console.log(`User ${authResult.userId} not authorized for ${normalizedCountryCode}`)
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: normalizedCountryCode,
        obligationId: obligation_id,
        statusCode: 403,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
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
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: normalizedCountryCode,
        obligationId: obligation_id,
        statusCode: 500,
        responseMessage: 'Failed to verify obligation',
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: 'Failed to verify obligation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!obligation) {
      const msg = 'Obligation not found or inactive'
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: normalizedCountryCode,
        obligationId: obligation_id,
        statusCode: 404,
        responseMessage: msg,
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert the obligation status
    const { data: result, error: upsertError } = await serviceClient
      .from('country_obligation_status')
      .upsert({
        country_code: normalizedCountryCode,
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
      await logRequest(serviceClient, {
        apiKeyId: authResult.apiKeyId,
        userId: authResult.userId,
        endpoint: '/update-obligation-status',
        method: 'POST',
        countryCode: normalizedCountryCode,
        obligationId: obligation_id,
        statusCode: 500,
        responseMessage: 'Failed to update obligation status',
        ipAddress,
        userAgent,
        requestBody,
      })
      
      return new Response(
        JSON.stringify({ error: 'Failed to update obligation status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const successMsg = `Updated ${obligation.name} status for ${normalizedCountryCode} to ${status}`
    console.log(successMsg)
    
    await logRequest(serviceClient, {
      apiKeyId: authResult.apiKeyId,
      userId: authResult.userId,
      endpoint: '/update-obligation-status',
      method: 'POST',
      countryCode: normalizedCountryCode,
      obligationId: obligation_id,
      statusCode: 200,
      responseMessage: successMsg,
      ipAddress,
      userAgent,
      requestBody,
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: successMsg
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    
    await logRequest(serviceClient, {
      apiKeyId: authResult?.apiKeyId,
      userId: authResult?.userId,
      endpoint: '/update-obligation-status',
      method: 'POST',
      countryCode: requestBody?.country_code,
      obligationId: requestBody?.obligation_id,
      statusCode: 500,
      responseMessage: 'Internal server error',
      ipAddress,
      userAgent,
      requestBody,
    })
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
