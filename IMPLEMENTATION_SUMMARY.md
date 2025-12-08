# Request Access Flow Implementation Summary

## Overview
Full end-to-end implementation of the Request Access flow with email OTP verification, major selection, committee review, and first-login password change enforcement.

## Database Changes

### New Models
1. **Major** - Stores available majors (Software Engineering, Computer Science)
2. **EmailOTP** - Stores hashed OTP codes for email verification

### Updated Models
1. **User** - Added `majorId` (optional) and `requiresPasswordChange` (boolean, default false)
2. **AccessRequest** - Added `majorId` (optional)

### Migration Steps
1. Run Prisma migration: `cd backend && npx prisma migrate dev --name add_majors_otp_password_change`
2. Seed majors: `cd backend && npx tsx -r tsconfig-paths/register src/scripts/seed-majors.ts`

## Backend Changes

### New Routes
1. **`/api/otp/send`** - Send 6-digit OTP to email
   - Rate limited: 5 attempts per hour per email
   - Cooldown: 60 seconds between requests
   - OTP expires in 10 minutes
   - Stores hashed OTP (never logs raw codes)

2. **`/api/otp/verify`** - Verify OTP code
   - Max 5 attempts per OTP
   - Returns success if valid

3. **`/api/otp/status`** - Check if email is verified
   - Returns verification status (valid for 24 hours)

4. **`/api/majors`** - List all available majors

5. **`/api/auth/change-password`** - Change password
   - Supports forced change (no current password required)
   - Clears `requiresPasswordChange` flag on success

### Updated Routes
1. **`/api/access-requests` (POST)** - Now requires:
   - Email verification (OTP must be verified)
   - Major selection (required)
   - Validates major exists

2. **`/api/access-requests/:id/approve`** - Now:
   - Sets `majorId` on created user
   - Sets `requiresPasswordChange: true` on created user
   - Sends approval email with temporary password

3. **`/api/auth/login`** - Returns `requiresPasswordChange` flag

4. **`/api/auth/me`** - Returns `requiresPasswordChange` flag

### Security Features
- OTP codes are hashed using bcrypt (never stored in plain text)
- Rate limiting on OTP endpoints (same as auth endpoints)
- Max 5 OTP attempts per hour per email
- Max 5 verification attempts per OTP
- 60-second cooldown between OTP requests
- 10-minute OTP expiration
- Input validation and sanitization
- No duplicate pending requests per email

## Frontend Changes

### New Pages
1. **`/request-access`** - Public request access page
   - Email verification with OTP
   - Full name, email, role, major selection
   - Optional reason field
   - Submit disabled until email verified
   - 60-second resend cooldown with countdown
   - Modern UI with inline status indicators

2. **`/change-password`** - Password change page
   - Enforced on first login if `requiresPasswordChange` is true
   - Supports both forced and voluntary password changes
   - Password strength validation
   - Redirects to appropriate dashboard after success

### Updated Pages
1. **`/committee/access-requests`** - Now displays:
   - Major column in the requests table
   - Major in decision modal

### Updated Components
1. **`AuthProvider`** - Handles `requiresPasswordChange` redirect
   - Automatically redirects to `/change-password` on login if required

2. **`api.ts`** - Added methods:
   - `sendOTP(email)`
   - `verifyOTP(email, code)`
   - `checkOTPStatus(email)`
   - `getMajors()`
   - `changePassword(data)`
   - Updated `submitAccessRequest()` to include `majorId`

## Email Service

### Email Templates
1. **OTP Email** - Sent when user requests verification code
   - Contains 6-digit code
   - Expires in 10 minutes
   - Professional HTML template

2. **Approval Email** - Sent when request is approved
   - Contains temporary password
   - Includes login link
   - Mentions password change requirement

3. **Rejection Email** - Sent when request is rejected
   - Includes optional decision note
   - Professional and courteous

## Testing Checklist

### Request Access Flow
- [ ] User can access `/request-access` page
- [ ] Email validation works
- [ ] OTP send button works and shows loading state
- [ ] 60-second cooldown countdown displays correctly
- [ ] OTP verification works with correct code
- [ ] OTP verification fails with incorrect code (max 5 attempts)
- [ ] Email field locks after verification
- [ ] Major dropdown loads and displays options
- [ ] Form validation prevents submission without required fields
- [ ] Duplicate request prevention works
- [ ] Success message displays after submission

### Committee Review
- [ ] Committee can view access requests
- [ ] Major column displays in table
- [ ] Approve action works without session errors
- [ ] Reject action works without session errors
- [ ] Lock action works
- [ ] Filters and search work correctly

### Approval Flow
- [ ] Account is created with correct role and major
- [ ] `requiresPasswordChange` is set to true
- [ ] Approval email is sent with temporary password
- [ ] User can login with temporary password
- [ ] User is redirected to password change page
- [ ] Password change works
- [ ] User is redirected to appropriate dashboard after password change

### Rejection Flow
- [ ] Rejection email is sent
- [ ] Decision note is included in email if provided
- [ ] Request status updates correctly

## Security Checklist
- [x] OTP codes are hashed (never stored in plain text)
- [x] Rate limiting on OTP endpoints
- [x] Max attempts enforced (5 per hour for send, 5 per OTP for verify)
- [x] Cooldown period enforced (60 seconds)
- [x] OTP expiration enforced (10 minutes)
- [x] Email verification required before request submission
- [x] Input validation and sanitization
- [x] No duplicate pending requests
- [x] Password change enforced on first login
- [x] Secure password generation for temporary passwords

## Files Created/Modified

### Backend
- `backend/prisma/schema.prisma` - Added Major, EmailOTP models, updated User and AccessRequest
- `backend/src/routes/otp/index.ts` - New OTP routes
- `backend/src/routes/majors/index.ts` - New majors route
- `backend/src/routes/access-requests/service.ts` - Updated to include major and email verification
- `backend/src/routes/auth.ts` - Added password change endpoint, updated login/me
- `backend/src/utils/validation.ts` - Updated schemas
- `backend/src/server.ts` - Added OTP and majors routes
- `backend/src/scripts/seed-majors.ts` - New seeding script

### Frontend
- `smart-schedule/app/request-access/page.tsx` - New request access page
- `smart-schedule/app/change-password/page.tsx` - New password change page
- `smart-schedule/app/committee/access-requests/page.tsx` - Updated to show major
- `smart-schedule/lib/api.ts` - Added OTP and majors methods
- `smart-schedule/components/AuthProvider.tsx` - Added password change redirect

## Next Steps

1. **Run Database Migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_majors_otp_password_change
   ```

2. **Seed Majors:**
   ```bash
   cd backend
   npx tsx -r tsconfig-paths/register src/scripts/seed-majors.ts
   ```

3. **Test the Flow:**
   - Visit `/request-access`
   - Complete email verification
   - Submit access request
   - Approve as committee member
   - Login with temporary password
   - Change password
   - Verify redirect to dashboard

## Notes

- All OTP codes are hashed using bcrypt before storage
- Email service uses existing SMTP configuration
- Rate limiting uses existing express-rate-limit middleware
- Session management uses existing JWT/cookie system
- All changes are backwards compatible
- No breaking changes to existing functionality
