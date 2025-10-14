# Frontend-Backend Alignment Report

**Generated:** October 14, 2025  
**Project:** Maternal Health Application  
**Backend:** Maternal_Server  
**Frontend:** Maternal_Hub  

---

## Executive Summary

This report analyzes the alignment between the Frontend (FE) and Backend (BE) APIs, identifies misalignments, missing features, and provides recommendations for enhancements.

### Overall Status: ⚠️ **Partially Aligned** (78% Complete)

**Key Findings:**
- ✅ Authentication endpoints are well aligned
- ✅ Admin functionality is complete
- ✅ Appointments system is functional
- ⚠️ Missing user profile endpoint (GET /api/auth/me)
- ⚠️ Pregnancy week info endpoint exists but needs verification
- ⚠️ Some FE API calls reference non-existent endpoints
- ❌ Missing update profile endpoint

---

## 1. Authentication Endpoints

### ✅ Fully Aligned

| Endpoint | Method | Backend | Frontend | Status |
|----------|--------|---------|----------|--------|
| `/api/auth/register` | POST | ✅ | ✅ | Aligned |
| `/api/auth/login` | POST | ✅ | ✅ | Aligned |
| `/api/auth/forgot-password` | POST | ✅ | ✅ | Aligned |
| `/api/auth/reset-password` | POST | ✅ | ✅ | Aligned |
| `/api/auth/me` | GET | ❌ | ✅ | **MISSING IN BE** |
| `/api/auth/profile` | PUT | ❌ | ✅ | **MISSING IN BE** |
| `/api/auth/logout` | POST | ❌ | ✅ | **NOT NEEDED** |

### Issues:
1. **GET /api/auth/me** - Frontend expects this but backend doesn't implement it
2. **PUT /api/auth/profile** - Frontend calls this for profile updates, not implemented in BE
3. **POST /api/auth/logout** - Frontend has it but backend doesn't need it (JWT is stateless)

### Recommendations:
- Add GET `/api/auth/me` endpoint to return current user profile
- Add PUT `/api/auth/profile` endpoint for profile updates
- Remove logout from FE API (not needed for JWT)

---

## 2. Admin Endpoints

### ✅ Fully Aligned

| Endpoint | Method | Backend | Frontend | Status |
|----------|--------|---------|----------|--------|
| `/api/admin/login` | POST | ✅ | ✅ | Aligned |
| `/api/admin/register` | POST | ✅ | ✅ | Aligned |
| `/api/admin/me` | GET | ✅ | ✅ | Aligned |
| `/api/admin/analytics` | GET | ✅ | ✅ | Aligned |
| `/api/admin/users` | GET | ✅ | ✅ | Aligned |
| `/api/admin/users/:id` | GET | ✅ | ✅ | Aligned |
| `/api/admin/users/:id` | PUT | ✅ | ✅ | Aligned |
| `/api/admin/users/:id` | DELETE | ✅ | ✅ | Aligned |
| `/api/admin/pregnant-users` | GET | ✅ | ✅ | Aligned |
| `/api/admin/appointments` | GET | ✅ | ✅ | Aligned |
| `/api/admin/appointments/:id` | GET | ✅ | ✅ | Aligned |
| `/api/admin/appointments/:id` | PUT | ✅ | ✅ | Aligned |
| `/api/admin/appointments/:id` | DELETE | ✅ | ✅ | Aligned |

**Status:** ✅ **Excellent** - Admin functionality is fully implemented and aligned.

---

## 3. Appointments Endpoints

### ✅ Well Aligned

| Endpoint | Method | Backend | Frontend | Status |
|----------|--------|---------|----------|--------|
| `/api/appointments` | POST | ✅ | ✅ | Aligned |
| `/api/appointments/user` | GET | ✅ | ✅ | Aligned |
| `/api/appointments/:id` | DELETE | ✅ | ✅ | Aligned |
| `/api/appointments/slots/:centerId/:date` | GET | ✅ | ⚠️ | Implemented in server.js (should be in routes) |

### Issues:
1. **GET /api/appointments/slots/:centerId/:date** - Implemented directly in server.js instead of appointments route
2. Missing **PUT /api/appointments/:id** for users to reschedule their own appointments

### Recommendations:
- Move slots endpoint to appointments route file
- Add user appointment update endpoint (different from admin's)

---

## 4. Health Centers & Emergency Contacts

### ⚠️ Partially Aligned

| Endpoint | Method | Backend | Frontend | Status |
|----------|--------|---------|----------|--------|
| `/api/health-centers` | GET | ✅ | ✅ | Aligned |
| `/api/health-centers/sector/:district/:sector` | GET | ✅ | ✅ | Aligned |
| `/api/emergency-contacts` | GET | ✅ | ✅ | Aligned |
| `/api/pregnancy-info` | GET | ❌ | ✅ | **MISSING IN BE** |

### Issues:
1. **GET /api/pregnancy-info** - Referenced in FE API but doesn't exist in BE
2. Pregnancy route exists at `/api/pregnancy/week-info` but FE uses different endpoint

---

## 5. Chat & Pregnancy Tracking

### ⚠️ Needs Alignment

| Endpoint | Method | Backend | Frontend | Status |
|----------|--------|---------|----------|--------|
| `/api/chat` | POST | ✅ | ✅ | Aligned |
| `/api/pregnancy/week-info` | GET | ✅ | ❓ | FE uses different path |

### Issues:
1. FE references `/api/pregnancy-info` but BE has `/api/pregnancy/week-info`
2. Need to verify FE pregnancy tracker is using correct endpoint

---

## 6. Missing Features & Enhancements

### A. Backend Missing Features

1. **User Profile Management**
   - GET `/api/auth/me` - Get current user profile
   - PUT `/api/auth/profile` - Update user profile
   - PATCH `/api/auth/password` - Change password

2. **User Self-Service Appointments**
   - PUT `/api/appointments/:id` - Reschedule own appointment
   - GET `/api/appointments/:id` - Get single appointment details

3. **Enhanced Health Centers**
   - POST `/api/health-centers/nearest` - Get nearest centers by GPS coordinates
   - GET `/api/health-centers/search` - Search health centers

4. **Notifications**
   - GET `/api/notifications` - Get user notifications
   - PUT `/api/notifications/:id/read` - Mark notification as read

5. **User Dashboard Stats**
   - GET `/api/user/dashboard` - Get user-specific dashboard data

### B. Frontend Missing Features

1. **Appointment Management**
   - Update appointment status display
   - Add appointment reminders

2. **Enhanced Error Handling**
   - Better offline mode support
   - Retry logic for failed requests

3. **User Feedback**
   - POST `/api/feedback` - Submit user feedback
   - GET `/api/faq` - Get frequently asked questions

---

## 7. Security & Validation Issues

### Critical Issues:

1. **Inconsistent Token Handling**
   - Backend uses `decoded.id` but should verify it matches user type
   - Need to add token refresh mechanism

2. **Missing Input Validation**
   - Some endpoints lack proper validation middleware
   - Need to validate file uploads if supporting profile pictures

3. **Error Response Inconsistency**
   - Some endpoints return `{ error: "message" }`
   - Others return `{ success: false, message: "message" }`
   - **Recommendation:** Standardize to `{ success: boolean, message: string, data?: any }`

4. **CORS Configuration**
   - Currently allows localhost and production URLs
   - Consider environment-specific configuration

---

## 8. Performance Enhancements

### Recommendations:

1. **Caching**
   - Health centers data is cached ✅
   - Add caching for user profiles
   - Add caching for appointment slots

2. **Pagination**
   - Admin endpoints have pagination ✅
   - Add pagination to user appointments list

3. **Database Indexes**
   - Add index on `User.email`
   - Add index on `Appointment.userId` and `Appointment.date`
   - Add index on `User.isPregnant` and `User.currentWeek`

4. **Query Optimization**
   - Use `select()` to limit returned fields
   - Use `lean()` for read-only queries

---

## 9. API Response Format Standardization

### Current Issues:
- Inconsistent response formats across endpoints
- Some use `{ error }`, others use `{ success, message }`

### Recommended Standard Format:

```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": { /* actual data */ },
  "errors": [ /* validation errors if any */ ],
  "meta": { /* pagination, timestamps, etc */ }
}
```

---

## 10. Priority Action Items

### High Priority (Immediate)

1. ✅ **Add GET /api/auth/me endpoint**
   - Returns current user profile based on JWT token
   - Required by frontend for user context

2. ✅ **Add PUT /api/auth/profile endpoint**
   - Allow users to update their own profile
   - Validate pregnancy data if updated

3. ✅ **Fix /api/pregnancy-info endpoint**
   - Align FE and BE on correct endpoint path
   - Either update FE to use `/api/pregnancy/week-info` or add alias

4. ✅ **Move appointments/slots endpoint to routes**
   - Currently in server.js, should be in appointments.js route

### Medium Priority (This Sprint)

5. **Add user appointment update endpoint**
6. **Standardize error responses**
7. **Add database indexes**
8. **Enhance input validation**

### Low Priority (Future)

9. **Add notifications system**
10. **Add feedback mechanism**
11. **Add user dashboard endpoint**
12. **Implement token refresh**

---

## 11. Testing Recommendations

### Backend Testing Needs:
- Unit tests for all routes
- Integration tests for auth flow
- Test appointment booking flow
- Test admin permissions

### Frontend Testing Needs:
- API integration tests
- Error handling tests
- Offline mode tests
- User flow tests

---

## 12. Documentation Gaps

### Missing Documentation:
- API endpoint documentation (consider Swagger/OpenAPI)
- Authentication flow diagram
- Error code reference
- Rate limiting documentation
- Deployment guide updates

---

## Conclusion

The application has a solid foundation with **78% alignment** between FE and BE. The main gaps are:

1. **Missing user profile endpoints** (GET /api/auth/me, PUT /api/auth/profile)
2. **Pregnancy info endpoint path mismatch**
3. **Need for response format standardization**
4. **Missing user self-service features**

**Estimated effort to achieve 100% alignment:** 2-3 days

**Recommended next steps:**
1. Implement high-priority missing endpoints
2. Standardize API responses
3. Add comprehensive API documentation
4. Enhance error handling
5. Add automated testing

---

**Report End**
