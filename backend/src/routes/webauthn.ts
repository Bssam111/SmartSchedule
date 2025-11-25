import { Router, Request, Response } from 'express'
import { prisma } from '@/config/database'
import { generateTokens, setTokenCookies } from '@/utils/jwt'
import {
  generateRegistrationOptionsForUser,
  verifyRegistrationResponse as verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthenticationResponse as verifyAuthentication,
} from '@/utils/webauthn'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// Store challenges temporarily (in production, use Redis)
const challenges = new Map<string, { challenge: string; userId: string; timestamp: number }>()

// Clean up old challenges every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of challenges.entries()) {
    if (now - value.timestamp > 60000) { // 1 minute expiry
      challenges.delete(key)
    }
  }
}, 5 * 60 * 1000)

// POST /api/webauthn/register/start - Start WebAuthn registration
router.post('/register/start', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id

    // Get user's existing authenticators
    const existingAuthenticators = await prisma.authenticator.findMany({
      where: { userId },
      select: {
        credentialID: true,
        counter: true,
        deviceName: true,
      },
    })

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    // Generate registration options
    const options = await generateRegistrationOptionsForUser(
      user.id,
      user.name,
      user.email,
      existingAuthenticators
    )

    // Store challenge
    const challengeKey = `register:${userId}:${Date.now()}`
    challenges.set(challengeKey, {
      challenge: options.challenge,
      userId,
      timestamp: Date.now(),
    })

    res.json({
      success: true,
      options,
      challengeKey,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/webauthn/register/finish - Complete WebAuthn registration
router.post('/register/finish', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id
    const { challengeKey, credential, deviceName } = req.body

    if (!challengeKey || !credential) {
      throw new CustomError('Challenge key and credential are required', 400)
    }

    // Validate credential structure
    if (!credential || typeof credential !== 'object') {
      throw new CustomError('Invalid credential format', 400)
    }

    if (!credential.id) {
      throw new CustomError('Invalid credential: missing credential ID', 400)
    }

    if (!credential.response || typeof credential.response !== 'object') {
      throw new CustomError('Invalid credential: missing response data', 400)
    }

    if (!credential.response.clientDataJSON) {
      throw new CustomError('Invalid credential: missing clientDataJSON', 400)
    }

    if (!credential.response.attestationObject) {
      throw new CustomError('Invalid credential: missing attestationObject', 400)
    }

    // Get stored challenge
    const storedChallenge = challenges.get(challengeKey)
    if (!storedChallenge || storedChallenge.userId !== userId) {
      throw new CustomError('Invalid or expired challenge', 400)
    }

    if (!storedChallenge.challenge || storedChallenge.challenge.trim() === '') {
      throw new CustomError('Invalid challenge. Please try registering again.', 400)
    }

    // Log credential structure for debugging
    console.log('🔐 Register finish - Credential structure:', {
      hasCredential: !!credential,
      credentialId: credential?.id,
      credentialIdType: typeof credential?.id,
      hasResponse: !!credential?.response,
      hasClientDataJSON: !!credential?.response?.clientDataJSON,
      hasAttestationObject: !!credential?.response?.attestationObject,
      responseKeys: credential?.response ? Object.keys(credential.response) : null,
    })

    // Verify registration
    let verification
    try {
      verification = await verifyRegistration(
        userId,
        credential,
        storedChallenge.challenge
      )
    } catch (error: any) {
      console.error('❌ Registration verification error:', error)
      // Provide more helpful error messages
      if (error.message && error.message.includes('undefined')) {
        throw new CustomError('Invalid credential data received. Please try registering your fingerprint again.', 400)
      }
      if (error.message && error.message.includes('Buffer')) {
        throw new CustomError('Invalid credential format. Please try registering your fingerprint again.', 400)
      }
      throw new CustomError(error.message || 'Registration verification failed', 400)
    }

    if (!verification || !verification.verified) {
      throw new CustomError('Registration verification failed', 400)
    }

    // Save authenticator to database
    await prisma.authenticator.create({
      data: {
        userId,
        credentialID: verification.credentialID,
        publicKey: verification.publicKey,
        counter: verification.counter,
        deviceName: deviceName || 'Unknown Device',
      },
    })

    // Remove challenge
    challenges.delete(challengeKey)

    res.json({
      success: true,
      message: 'Fingerprint registered successfully',
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/webauthn/authenticate/start - Start WebAuthn authentication
router.post('/authenticate/start', async (req: Request, res: Response, next) => {
  try {
    const { email } = req.body

    if (!email) {
      throw new CustomError('Email is required', 400)
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        authenticators: true,
      },
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    if (user.authenticators.length === 0) {
      throw new CustomError('No fingerprint registered for this user', 400)
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions(
      user.authenticators.map(auth => ({
        credentialID: auth.credentialID,
        counter: auth.counter,
      }))
    )

    // Store challenge
    const challengeKey = `auth:${user.id}:${Date.now()}`
    challenges.set(challengeKey, {
      challenge: options.challenge,
      userId: user.id,
      timestamp: Date.now(),
    })

    res.json({
      success: true,
      options,
      challengeKey,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/webauthn/authenticate/finish - Complete WebAuthn authentication
router.post('/authenticate/finish', async (req: Request, res: Response, next) => {
  try {
    const { email, challengeKey, credential } = req.body

    if (!email || !challengeKey || !credential) {
      throw new CustomError('Email, challenge key, and credential are required', 400)
    }

    // Validate credential structure
    if (!credential || typeof credential !== 'object') {
      throw new CustomError('Invalid credential format', 400)
    }

    if (!credential.id || !credential.response) {
      throw new CustomError('Invalid credential: missing required fields (id or response)', 400)
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        authenticators: true,
      },
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    // Get stored challenge
    const storedChallenge = challenges.get(challengeKey)
    if (!storedChallenge || storedChallenge.userId !== user.id) {
      throw new CustomError('Invalid or expired challenge', 400)
    }

    // Validate credential structure
    if (!credential || !credential.id) {
      throw new CustomError('Invalid credential: missing credential ID', 400)
    }

    // Find the authenticator being used
    const credentialId = credential.id
    
    if (!credentialId || typeof credentialId !== 'string') {
      throw new CustomError('Invalid credential ID format', 400)
    }

    const authenticator = user.authenticators.find(
      auth => auth.credentialID === credentialId
    )

    if (!authenticator) {
      throw new CustomError('Authenticator not found. Please register your fingerprint again.', 404)
    }

    if (!authenticator.credentialID || !authenticator.publicKey) {
      console.error('❌ Invalid authenticator data:', {
        hasCredentialID: !!authenticator.credentialID,
        hasPublicKey: !!authenticator.publicKey,
        credentialIDLength: authenticator.credentialID?.length,
        publicKeyLength: authenticator.publicKey?.length
      })
      throw new CustomError('Invalid authenticator data. Please register your fingerprint again.', 400)
    }

    // Validate challenge
    if (!storedChallenge.challenge || storedChallenge.challenge.trim() === '') {
      throw new CustomError('Invalid challenge. Please try again.', 400)
    }

    console.log('🔐 Starting authentication verification:', {
      userId: user.id,
      email: user.email,
      authenticatorId: authenticator.id,
      hasCredentialID: !!authenticator.credentialID,
      hasPublicKey: !!authenticator.publicKey,
      counter: authenticator.counter,
      hasChallenge: !!storedChallenge.challenge
    })

    // Verify authentication
    const verification = await verifyAuthentication(
      user.id,
      credential,
      {
        credentialID: authenticator.credentialID,
        publicKey: authenticator.publicKey,
        counter: authenticator.counter,
      },
      storedChallenge.challenge
    )

    if (!verification.verified) {
      throw new CustomError('Authentication verification failed', 401)
    }

    // Update authenticator counter and last used
    await prisma.authenticator.update({
      where: { id: authenticator.id },
      data: {
        counter: verification.newCounter,
        lastUsed: new Date(),
      },
    })

    // Remove challenge
    challenges.delete(challengeKey)

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken)

    res.json({
      success: true,
      message: 'Fingerprint authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        universityId: user.universityId,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/webauthn/authenticators - Get user's registered authenticators
router.get('/authenticators', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id

    const authenticators = await prisma.authenticator.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: {
        lastUsed: 'desc',
      },
    })

    res.json({
      success: true,
      authenticators,
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/webauthn/authenticators/:id - Delete an authenticator
router.delete('/authenticators/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id
    const { id } = req.params

    // Verify the authenticator belongs to the user
    const authenticator = await prisma.authenticator.findUnique({
      where: { id },
    })

    if (!authenticator || authenticator.userId !== userId) {
      throw new CustomError('Authenticator not found', 404)
    }

    await prisma.authenticator.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Fingerprint removed successfully',
    })
  } catch (error) {
    next(error)
  }
})

export { router as webauthnRoutes }

