import { Router } from 'express'
import { loginSchema } from '@/utils/validation'

const router = Router()

// Test endpoint to check what loginSchema expects
router.post('/test-login-schema', (req, res) => {
  try {
    console.log('Request body:', req.body)
    console.log('Login schema shape:', loginSchema.shape)
    
    const result = loginSchema.parse(req.body)
    res.json({
      success: true,
      message: 'Validation passed',
      data: result
    })
  } catch (error: any) {
    console.error('Validation error:', error)
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.issues || error.message
    })
  }
})

export { router as testValidationRoutes }

