# Railway Database Users - Login Guide

## Available Users in Railway Database

### Committee Users
- **Email:** `committee@ksu.edu.sa`
- **Email:** `admin@ksu.edu.sa`

### Faculty Users  
- **Email:** `dr.ahmed@ksu.edu.sa`
- **Email:** `dr.sara@ksu.edu.sa`
- **Email:** `dr.khalid@ksu.edu.sa`
- **Email:** `dr.fatima@ksu.edu.sa`
- **Email:** `dr.mohammed@ksu.edu.sa`
- **Email:** `dr.noura@ksu.edu.sa`

### Student Users
- **Email:** `student@example.com`
- **Email:** `ahmed.student@ksu.edu.sa`
- **Email:** `sara.student@ksu.edu.sa`
- **Email:** `khalid.student@ksu.edu.sa`
- **Email:** `fatima.student@ksu.edu.sa`

## Password Issue

**⚠️ Important:** If you're getting "invalid credentials" error, the passwords in Railway database might not be set correctly.

### To Fix Password Issues:

**Option 1: Reset Password via Backend API**
```bash
# You may need to create a password reset endpoint or update passwords directly
```

**Option 2: Create New User**
- Use the registration endpoint to create a new user with a known password
- Register at: http://localhost:3000/register

**Option 3: Check/Update Passwords in Railway Database**
- Access Railway dashboard
- Query the User table directly
- Update password hashes if needed

## Testing Connection

The backend is now connected to Railway database. To verify:

```bash
# Check backend logs show Railway connection
docker compose logs backend | grep railway

# Test health endpoint
curl http://localhost:3001/api/health
```

## Next Steps

1. **Try registering a new user** with a known password
2. **Or check Railway database** to see if passwords are properly hashed
3. **Or reset passwords** for existing users

---

**Database:** Railway ✅
**Backend Status:** Connected ✅




