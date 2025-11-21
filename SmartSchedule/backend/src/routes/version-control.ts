import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireFacultyOrCommittee } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/versions/:scheduleId - Get all versions of a schedule
router.get('/:scheduleId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { scheduleId } = req.params

    const versions = await prisma.scheduleVersion.findMany({
      where: { scheduleId },
      orderBy: { version: 'desc' },
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: versions,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/versions/:scheduleId/create - Create a new version
router.post(
  '/:scheduleId/create',
  authenticateToken,
  requireFacultyOrCommittee,
  async (req: AuthRequest, res, next) => {
    try {
      const { scheduleId } = req.params
      const { name, description, changes } = req.body
      const userId = req.user!.id

      // Get current schedule
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
      })

      if (!schedule) {
        throw new CustomError('Schedule not found', 404)
      }

      // Get next version number
      const latestVersion = await prisma.scheduleVersion.findFirst({
        where: { scheduleId },
        orderBy: { version: 'desc' },
      })

      const nextVersion = latestVersion ? latestVersion.version + 1 : 1

      // Create new version
      const version = await prisma.scheduleVersion.create({
        data: {
          scheduleId,
          version: nextVersion,
          name: name || `Version ${nextVersion}`,
          description,
          changes: changes || {},
          createdBy: userId,
        },
      })

      // Update schedule version
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { version: nextVersion },
      })

      res.status(201).json({
        success: true,
        message: 'Version created successfully',
        data: version,
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /api/versions/:scheduleId/:version - Get specific version details
router.get('/:scheduleId/:version', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { scheduleId, version } = req.params

    const versionData = await prisma.scheduleVersion.findUnique({
      where: {
        scheduleId_version: {
          scheduleId,
          version: parseInt(version),
        },
      },
      include: {
        schedule: true,
      },
    })

    if (!versionData) {
      throw new CustomError('Version not found', 404)
    }

    res.json({
      success: true,
      data: versionData,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/versions/:scheduleId/:version/restore - Restore a specific version
router.post(
  '/:scheduleId/:version/restore',
  authenticateToken,
  requireFacultyOrCommittee,
  async (req: AuthRequest, res, next) => {
    try {
      const { scheduleId, version } = req.params
      const userId = req.user!.id

      // Get version to restore
      const versionToRestore = await prisma.scheduleVersion.findUnique({
        where: {
          scheduleId_version: {
            scheduleId,
            version: parseInt(version),
          },
        },
      })

      if (!versionToRestore) {
        throw new CustomError('Version not found', 404)
      }

      // Get latest version
      const latestVersion = await prisma.scheduleVersion.findFirst({
        where: { scheduleId },
        orderBy: { version: 'desc' },
      })

      const nextVersion = latestVersion ? latestVersion.version + 1 : 1

      // Create new version from restored version
      const restoredVersion = await prisma.scheduleVersion.create({
        data: {
          scheduleId,
          version: nextVersion,
          name: `Restored from Version ${version}`,
          description: `Restored version ${version} by ${req.user!.name}`,
          changes: {
            ...versionToRestore.changes,
            restoredFrom: versionToRestore.version,
            restoredAt: new Date().toISOString(),
            restoredBy: userId,
          },
          createdBy: userId,
        },
      })

      // Update schedule version
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { version: nextVersion },
      })

      res.json({
        success: true,
        message: `Version ${version} restored successfully as version ${nextVersion}`,
        data: restoredVersion,
      })
    } catch (error) {
      next(error)
    }
  }
)

// DELETE /api/versions/:scheduleId/:version - Delete a version (Committee only)
router.delete(
  '/:scheduleId/:version',
  authenticateToken,
  requireFacultyOrCommittee,
  async (req: AuthRequest, res, next) => {
    try {
      const { scheduleId, version } = req.params

      // Cannot delete the only version
      const versionCount = await prisma.scheduleVersion.count({
        where: { scheduleId },
      })

      if (versionCount <= 1) {
        throw new CustomError('Cannot delete the only version', 400)
      }

      await prisma.scheduleVersion.delete({
        where: {
          scheduleId_version: {
            scheduleId,
            version: parseInt(version),
          },
        },
      })

      res.json({
        success: true,
        message: 'Version deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }
)

export { router as versionControlRoutes }

