# 🚀 SPAMKLR Production Deployment Guide

## 🔧 Production Environment Setup

### 1. **Environment Variables (.env)**
Create `.env` file in production with these variables:

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/spamklr?retryWrites=true&w=majority

# Security
SESSION_SECRET=your-super-secure-session-secret-min-32-chars
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTP_ONLY=true
SESSION_MAX_AGE=3600000

# CORS - Add your production domain
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
MAX_WAITLIST_ENTRIES=10000
MAX_SIGNUPS_PER_IP_24H=3
MAX_CONTACTS_PER_IP_24H=5
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MAX_SIGNUP_REQUESTS=5
```

### 2. **Database Setup (MongoDB Atlas)**
1. Create MongoDB Atlas cluster
2. Whitelist your server IP address
3. Create database user with read/write permissions
4. Update MONGODB_URI with connection string

### 3. **Common Production Issues & Fixes**

#### 🔴 **Issue: "Validation failed" in production**
**Cause**: Environment variables not loaded
**Fix**: Ensure `.env` file exists and has correct values

#### 🔴 **Issue: CORS errors**
**Cause**: Production domain not in ALLOWED_ORIGINS
**Fix**: Add your domain to ALLOWED_ORIGINS in .env

#### 🔴 **Issue: Database connection fails**
**Cause**: MongoDB URI incorrect or IP not whitelisted
**Fix**: 
- Check MongoDB Atlas connection string
- Whitelist server IP (or use 0.0.0.0/0 for all IPs)
- Verify database user permissions

#### 🔴 **Issue: Forms submit but don't save**
**Cause**: Database connection lost or validation errors
**Fix**: Check server logs for specific error messages

### 4. **Production Startup Command**
```bash
NODE_ENV=production node presentation/presentation.js
```

### 5. **Health Check Endpoint**
Test if server is running: `GET /health`

### 6. **Production Logs**
Server will show detailed error messages in console:
- 📧 Contact form submissions
- 📝 Waitlist join attempts  
- ❌ Validation errors
- 🔄 Database connection status

## 🧪 **Testing in Production**

1. **Test Health Check**: `https://yourdomain.com/health`
2. **Test Waitlist**: Fill out waitlist form
3. **Test Contact**: Fill out contact form
4. **Check Server Logs**: Look for error messages

## 📋 **Deployment Checklist**

- [ ] MongoDB Atlas cluster created and configured
- [ ] Environment variables (.env) file created  
- [ ] Production domain added to ALLOWED_ORIGINS
- [ ] Server IP whitelisted in MongoDB Atlas
- [ ] Node.js and npm installed on server
- [ ] Dependencies installed (`npm install`)
- [ ] Server started with production command
- [ ] Health check endpoint responding
- [ ] Forms tested and working
- [ ] Server logs monitored for errors

## 🆘 **Troubleshooting Commands**

```bash
# Check if server is running
curl https://yourdomain.com/health

# Test waitlist API directly
curl -X POST https://yourdomain.com/join \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Test contact API directly
curl -X POST https://yourdomain.com/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"general","message":"Test message"}'
```