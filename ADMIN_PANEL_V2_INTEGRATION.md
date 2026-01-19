# Admin Panel V2 - Integration Guide

## Quick Start

### Step 1: Update App Router

Replace the old admin routes in `src/App.tsx` with the new structure:

```tsx
import { AdminLayout, AdminDashboard, AdminUsers, AdminQuestions, AdminChapters, AdminTopics, AdminAnalytics, AdminReports, AdminNotifications, AdminPDFExtractor, AdminSettings } from '@/components/admin-v2';

// ... in your Routes component

{/* New Admin Routes */}
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  {/* Outlet will render nested routes */}
  <Route index element={<AdminDashboard />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="questions" element={<AdminQuestions />} />
  <Route path="chapters" element={<AdminChapters />} />
  <Route path="topics" element={<AdminTopics />} />
  <Route path="reports" element={<AdminReports />} />
  <Route path="notifications" element={<AdminNotifications />} />
  <Route path="pdf-extractor" element={<AdminPDFExtractor />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>
```

### Step 2: Update Navigation Paths

The new admin panel uses these routes:
- `/admin` - Dashboard
- `/admin/analytics` - Advanced Analytics
- `/admin/users` - User Management
- `/admin/questions` - Question Bank
- `/admin/chapters` - Chapter Management
- `/admin/topics` - Topic Management
- `/admin/reports` - Reports & Exports
- `/admin/notifications` - Notifications
- `/admin/pdf-extractor` - PDF Extraction
- `/admin/settings` - Settings

### Step 3: Verify Admin Route Protection

Ensure `AdminRoute` component checks for admin role:

```tsx
// src/components/AdminRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userRole, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (userRole !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

export default AdminRoute;
```

---

## File Changes Required

### 1. Update `src/App.tsx`

**Location:** Lines 150-220 (approximately)

**Old Code:**
```tsx
{/* Admin Routes */}
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>
<Route
  path="/admin/analytics"
  element={
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  }
/>
{/* ... many more individual routes ... */}
```

**New Code:**
```tsx
{/* Admin Routes with Layout */}
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  <Route index element={<AdminDashboard />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="questions" element={<AdminQuestions />} />
  <Route path="chapters" element={<AdminChapters />} />
  <Route path="topics" element={<AdminTopics />} />
  <Route path="reports" element={<AdminReports />} />
  <Route path="notifications" element={<AdminNotifications />} />
  <Route path="pdf-extractor" element={<AdminPDFExtractor />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>
```

### 2. Update Lazy Imports

**Add to top of `src/App.tsx` with other lazy imports:**

```tsx
// Lazy load admin components
const AdminLayout = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminUsers })));
const AdminQuestions = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminQuestions })));
const AdminChapters = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminChapters })));
const AdminTopics = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminTopics })));
const AdminAnalytics = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminAnalytics })));
const AdminReports = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminReports })));
const AdminNotifications = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminNotifications })));
const AdminPDFExtractor = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminPDFExtractor })));
const AdminSettings = lazy(() => import('@/components/admin-v2').then(m => ({ default: m.AdminSettings })));
```

### 3. Remove Old AdminDashboard Import

**Find and remove:**
```tsx
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
```

---

## Backward Compatibility

The old admin panel (`/src/pages/AdminDashboard.tsx`) can be kept as a fallback:

1. **Rename old file:**
   ```bash
   mv src/pages/AdminDashboard.tsx src/pages/AdminDashboard.legacy.tsx
   ```

2. **Create redirect route** (optional):
   ```tsx
   <Route path="/admin-legacy" element={<AdminRoute><AdminDashboardLegacy /></AdminRoute>} />
   ```

3. **Update existing links** pointing to old admin panel gradually

---

## Testing Checklist

### ✅ Routing Tests
- [ ] `/admin` loads dashboard
- [ ] All navigation links work
- [ ] Mobile hamburger menu opens/closes
- [ ] Active route highlighting works
- [ ] Can navigate between sections

### ✅ Functionality Tests
- [ ] Dashboard stats load correctly
- [ ] User list displays and filters work
- [ ] Questions can be added/deleted
- [ ] Search functionality works
- [ ] Sidebar collapses on mobile

### ✅ Data Tests
- [ ] Supabase queries succeed
- [ ] Data displays correctly
- [ ] Filters apply properly
- [ ] Error messages show on failures
- [ ] Loading states display

### ✅ Security Tests
- [ ] Non-admins cannot access `/admin`
- [ ] RLS policies are respected
- [ ] User data is not exposed inappropriately
- [ ] Admin-only actions are restricted

---

## Performance Notes

### Current Optimizations
- Components are lazy-loaded
- Queries are optimized with proper selects
- State updates are batched
- Images are not loaded unnecessarily

### Recommended Future Optimizations
- Add React.memo to prevent unnecessary re-renders
- Implement virtual scrolling for large tables
- Add request caching
- Use Supabase real-time subscriptions
- Implement pagination for large datasets

---

## Common Issues & Solutions

### Issue: Components not loading
**Solution:** Ensure all components are exported in `src/components/admin-v2/index.ts`

### Issue: Styling not applying
**Solution:** Verify Tailwind CSS is properly configured and admin-v2 folder is included in template paths

### Issue: Supabase queries failing
**Solution:** Check RLS policies allow admin access and verify user has admin role in database

### Issue: Mobile menu not working
**Solution:** Ensure Tailwind responsive classes are working (check `tailwind.config.ts`)

---

## Deployment Checklist

Before deploying to production:

- [ ] All routes are configured
- [ ] Supabase RLS policies allow admin access
- [ ] Error handling is working
- [ ] Loading states display properly
- [ ] Mobile view is responsive
- [ ] Database queries are optimized
- [ ] No console errors
- [ ] Admin users can access all features
- [ ] Non-admins are redirected properly
- [ ] Old admin panel removed or hidden

---

## Support & Maintenance

### Getting Help
- Check [ADMIN_PANEL_V2_ARCHITECTURE.md](./ADMIN_PANEL_V2_ARCHITECTURE.md) for detailed documentation
- Review component source code for implementation details
- Check Supabase logs for database errors

### Reporting Issues
Include:
- What you were trying to do
- What error occurred
- Browser/device information
- Steps to reproduce

### Adding Features
1. Create new component in `admin-v2/`
2. Add to navigation in `AdminLayout.tsx`
3. Export from `index.ts`
4. Add route in `App.tsx`
5. Test thoroughly
6. Update documentation

---

**Last Updated:** January 2026
**Version:** 2.0.0
**Status:** Ready for Production
