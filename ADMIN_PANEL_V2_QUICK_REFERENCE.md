# Admin Panel V2 - Quick Reference Guide

## 📍 File Locations

```
Project Root
├── src/components/admin-v2/          ← NEW ADMIN COMPONENTS
│   ├── AdminLayout.tsx               ← Main layout with sidebar
│   ├── AdminDashboard.tsx            ← Dashboard/home
│   ├── AdminUsers.tsx                ← User management
│   ├── AdminQuestions.tsx            ← Questions management
│   ├── AdminChapters.tsx             ← Chapters (placeholder)
│   ├── AdminTopics.tsx               ← Topics (placeholder)
│   ├── AdminAnalytics.tsx            ← Analytics (placeholder)
│   ├── AdminReports.tsx              ← Reports (placeholder)
│   ├── AdminNotifications.tsx        ← Notifications (placeholder)
│   ├── AdminPDFExtractor.tsx         ← PDF tool (placeholder)
│   ├── AdminSettings.tsx             ← Settings (placeholder)
│   └── index.ts                      ← Export barrel
│
├── ADMIN_PANEL_V2_ARCHITECTURE.md    ← Architecture guide
├── ADMIN_PANEL_V2_INTEGRATION.md     ← Integration steps
├── ADMIN_PANEL_V2_SUMMARY.md         ← Project summary
└── ADMIN_PANEL_V2_QUICK_REFERENCE.md ← This file
```

---

## 🚀 Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/admin` | AdminDashboard | Overview & stats |
| `/admin/analytics` | AdminAnalytics | Advanced charts |
| `/admin/users` | AdminUsers | User management |
| `/admin/questions` | AdminQuestions | Question bank |
| `/admin/chapters` | AdminChapters | Chapter management |
| `/admin/topics` | AdminTopics | Topic organization |
| `/admin/reports` | AdminReports | Export reports |
| `/admin/notifications` | AdminNotifications | Send announcements |
| `/admin/pdf-extractor` | AdminPDFExtractor | PDF extraction |
| `/admin/settings` | AdminSettings | Configuration |

---

## 🎨 Colors & Icons

### Color Scheme
- **Main** (Blue): #3B82F6 - Dashboard, Analytics
- **Content** (Emerald): #10B981 - Questions, Chapters, Topics
- **System** (Violet): #8B5CF6 - Users, Reports, Notifications

### Common Icons
```tsx
// Navigation
import { Home, BarChart3, Users, HelpCircle, BookMarked, GraduationCap } from 'lucide-react';

// Actions
import { Plus, Edit, Trash2, Search, Download, Upload } from 'lucide-react';

// Status
import { Crown, Award, Zap, Activity } from 'lucide-react';
```

---

## 📋 Component Templates

### Creating a New Admin Component

```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SomeIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

const AdminNewFeature: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from('table_name')
        .select('*');
      
      if (error) throw error;
      setData(result || []);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feature Name</h1>
        <p className="text-slate-600 mt-2">Feature description</p>
      </div>

      {/* Your content here */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewFeature;
```

---

## 🔧 Common Patterns

### Fetching Data
```tsx
const { data, error } = await supabase
  .from('table_name')
  .select('id, name, email')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(100);

if (error) throw error;
```

### Form Submission
```tsx
try {
  const { error } = await supabase
    .from('table_name')
    .insert([formData]);
  
  if (error) throw error;
  toast.success('Created successfully');
  loadData();
} catch (error) {
  logger.error('Error:', error);
  toast.error('Failed to create');
}
```

### Deletion
```tsx
try {
  const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
  toast.success('Deleted successfully');
  loadData();
} catch (error) {
  logger.error('Error:', error);
  toast.error('Failed to delete');
}
```

### Filtering
```tsx
useEffect(() => {
  filterData();
}, [data, searchTerm, selectedFilter]);

const filterData = () => {
  let filtered = data;
  
  if (searchTerm) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (selectedFilter !== 'all') {
    filtered = filtered.filter(item => item.status === selectedFilter);
  }
  
  setFilteredData(filtered);
};
```

---

## 📊 Layouts

### Card Layout
```tsx
<Card className="border-0 shadow-sm bg-white border-l-4 border-l-blue-500">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Header Section
```tsx
<div>
  <h1 className="text-3xl font-bold text-slate-900">Title</h1>
  <p className="text-slate-600 mt-2">Subtitle</p>
</div>
```

### Stat Cards (4-column grid)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat, idx) => (
    <Card key={idx} className="border-0 shadow-sm">
      {/* Stat content */}
    </Card>
  ))}
</div>
```

### Table
```tsx
<div className="rounded-lg border border-slate-200 overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-slate-50 border-b border-slate-200">
        <TableHead className="font-semibold text-slate-900">Column</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map(item => (
        <TableRow key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
          <TableCell>{item.name}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

---

## 🎯 Navigation Setup

### In AdminLayout.tsx
```tsx
const navItems: NavItem[] = [
  {
    id: 'unique-id',
    label: 'Feature Name',
    path: '/admin/feature-path',
    icon: <IconName className="w-5 h-5" />,
    category: 'content', // or 'main', 'system'
    badge: '5', // optional
  },
];
```

### In App.tsx
```tsx
<Route path="/admin/feature-path" element={<AdminFeature />} />
```

---

## 🧪 Testing Checklist

### Before Launching Feature
- [ ] Data loads correctly
- [ ] Filtering works
- [ ] Forms validate input
- [ ] CRUD operations work
- [ ] Errors display properly
- [ ] Loading states appear
- [ ] Mobile layout works
- [ ] No console errors
- [ ] Supabase RLS allows access
- [ ] Navigation works

---

## 🐛 Debugging Tips

### Check Loading State
```tsx
if (loading) return <LoadingSpinner />;
```

### Check Error Messages
```tsx
catch (error) {
  console.error('Full error:', error);
  logger.error('Context:', error);
}
```

### Monitor Supabase Queries
- Open Supabase dashboard
- Check SQL logs
- Verify RLS policies
- Test with admin user

### Verify Navigation
- Check URL in address bar
- Verify route is defined
- Check sidebar active state
- Test all navigation paths

---

## 📱 Mobile Considerations

### Responsive Grid Sizes
```tsx
// Adapts from 1 column (mobile) to 4 columns (desktop)
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

// Common patterns
grid-cols-1 md:grid-cols-2        // 1 → 2 columns
grid-cols-1 md:grid-cols-2 lg:grid-cols-4  // 1 → 2 → 4 columns
```

### Mobile Menu
```tsx
// Use on mobile-only elements
lg:hidden

// Use for desktop-only elements
hidden lg:block
```

---

## 🔐 Security Notes

### RLS Policies Checked
✅ All table access respects RLS
✅ Admin role required for admin operations
✅ User data properly isolated
✅ No direct SQL execution

### Input Validation
- Always validate user input
- Use TypeScript types
- Check form fields before submit
- Show validation error messages

---

## 📦 Dependencies Used

```json
{
  "@radix-ui/react-*": "UI components",
  "recharts": "Charts and graphs",
  "lucide-react": "Icons",
  "@supabase/supabase-js": "Database client",
  "sonner": "Toast notifications",
  "react-router-dom": "Routing",
  "tailwindcss": "Styling"
}
```

---

## 📚 Documentation Map

```
Start Here:
└── ADMIN_PANEL_V2_SUMMARY.md
    ├── Quick overview
    └── Project scope

For Integration:
└── ADMIN_PANEL_V2_INTEGRATION.md
    ├── Step-by-step setup
    └── Routing configuration

For Architecture:
└── ADMIN_PANEL_V2_ARCHITECTURE.md
    ├── Design decisions
    ├── Component details
    └── Future plans

For Quick Help:
└── ADMIN_PANEL_V2_QUICK_REFERENCE.md (this file)
    ├── File locations
    ├── Common patterns
    └── Debugging tips
```

---

## ⚡ Quick Commands

### View Admin Panel
- Navigate to `/admin` in your browser
- Login as admin user
- Browse different sections

### Test a Component
- Add mock data in useState
- Render component in isolation
- Check TypeScript errors
- Test error states

### Debug Supabase
- Open browser DevTools → Network
- Filter for API requests
- Check response status
- Review error messages

---

## 📞 Getting Help

### Problems?
1. Check relevant documentation file
2. Review component source code
3. Check browser console for errors
4. Verify Supabase configuration
5. Test with fresh data

### Want to Extend?
1. Create new component following template
2. Add to navigation
3. Export from index.ts
4. Configure routing
5. Test thoroughly

### Found a Bug?
1. Document the steps to reproduce
2. Check error logs
3. Verify data in Supabase
4. Check browser console
5. Review recent changes

---

**Last Updated:** January 19, 2026
**Version:** 2.0.0
**Status:** Production Ready

✨ Happy Coding! ✨
