// WebAuthn utility functions for fingerprint/biometric authentication

export interface WebAuthnResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
    universityId?: string
  }
  error?: string
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  )
}

/**
 * Authenticate user using WebAuthn (fingerprint/biometric)
 */
export async function authenticateWithFingerprint(email: string): Promise<WebAuthnResult> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'WebAuthn is not supported in this browser',
    }
  }

  try {
    // Step 1: Request authentication challenge from backend
    const challengeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/webauthn/authenticate/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      }
    )

    if (!challengeResponse.ok) {
      const errorData = await challengeResponse.json()
      return {
        success: false,
        error: errorData.error || 'Failed to start authentication',
      }
    }

    const challengeData = await challengeResponse.json()

    // Step 2: Use browser WebAuthn API to authenticate
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(atob(challengeData.challenge), (c) => c.charCodeAt(0)),
        allowCredentials: challengeData.allowCredentials?.map((cred: any) => ({
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
          type: 'public-key',
        })),
        timeout: 60000,
        userVerification: 'required',
      },
    }) as PublicKeyCredential | null

    if (!credential) {
      return {
        success: false,
        error: 'Authentication cancelled or failed',
      }
    }

    // Step 3: Send authentication response to backend
    const response = credential.response as AuthenticatorAssertionResponse
    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/webauthn/authenticate/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          credentialId: btoa(
            String.fromCharCode(...new Uint8Array(credential.rawId))
          ),
          authenticatorData: btoa(
            String.fromCharCode(...new Uint8Array(response.authenticatorData))
          ),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(response.clientDataJSON))
          ),
          signature: btoa(
            String.fromCharCode(...new Uint8Array(response.signature))
          ),
          userHandle: response.userHandle
            ? btoa(String.fromCharCode(...new Uint8Array(response.userHandle)))
            : null,
        }),
      }
    )

    const authData = await authResponse.json()

    if (authResponse.ok && authData.success) {
      return {
        success: true,
        user: authData.user,
      }
    } else {
      return {
        success: false,
        error: authData.error || 'Authentication failed',
      }
    }
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error)
    
    // Handle specific WebAuthn errors
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Authentication was cancelled or not allowed',
      }
    }
    
    if (error.name === 'InvalidStateError') {
      return {
        success: false,
        error: 'No fingerprint registered for this account. Please register one first.',
      }
    }

    if (error.message?.includes('No fingerprint')) {
      return {
        success: false,
        error: 'No fingerprint registered for this account. Please log in with password first and register a fingerprint.',
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred during authentication',
    }
  }
}

/**
 * Register a new WebAuthn credential (fingerprint/biometric)
 */
export async function registerFingerprint(email: string): Promise<WebAuthnResult> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'WebAuthn is not supported in this browser',
    }
  }

  try {
    // Step 1: Request registration challenge from backend
    const challengeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/webauthn/register/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      }
    )

    if (!challengeResponse.ok) {
      const errorData = await challengeResponse.json()
      return {
        success: false,
        error: errorData.error || 'Failed to start registration',
      }
    }

    const challengeData = await challengeResponse.json()

    // Step 2: Use browser WebAuthn API to create credential
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: Uint8Array.from(atob(challengeData.challenge), (c) => c.charCodeAt(0)),
        rp: {
          name: 'SmartSchedule',
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(atob(challengeData.user.id), (c) => c.charCodeAt(0)),
          name: email,
          displayName: challengeData.user.displayName || email,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      },
    }) as PublicKeyCredential | null

    if (!credential) {
      return {
        success: false,
        error: 'Registration cancelled or failed',
      }
    }

    // Step 3: Send registration response to backend
    const response = credential.response as AuthenticatorAttestationResponse
    const regResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/webauthn/register/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          credentialId: btoa(
            String.fromCharCode(...new Uint8Array(credential.rawId))
          ),
          attestationObject: btoa(
            String.fromCharCode(...new Uint8Array(response.attestationObject))
          ),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(response.clientDataJSON))
          ),
        }),
      }
    )

    const regData = await regResponse.json()

    if (regResponse.ok && regData.success) {
      return {
        success: true,
        user: regData.user,
      }
    } else {
      return {
        success: false,
        error: regData.error || 'Registration failed',
      }
    }
  } catch (error: any) {
    console.error('WebAuthn registration error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during registration',
    }
  }
}


