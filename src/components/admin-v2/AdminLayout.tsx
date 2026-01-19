import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  BookMarked,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  TrendingUp,
  FileText,
  Bell,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  category: 'main' | 'content' | 'system';
  badge?: string;
}

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    // Main
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin',
      icon: <Home className="w-5 h-5" />,
      category: 'main',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'main',
    },
    // Content Management
    {
      id: 'questions',
      label: 'Questions',
      path: '/admin/questions',
      icon: <HelpCircle className="w-5 h-5" />,
      category: 'content',
    },
    {
      id: 'chapters',
      label: 'Chapters',
      path: '/admin/chapters',
      icon: <BookMarked className="w-5 h-5" />,
      category: 'content',
    },
    {
      id: 'topics',
      label: 'Topics',
      path: '/admin/topics',
      icon: <GraduationCap className="w-5 h-5" />,
      category: 'content',
    },
    {
      id: 'pdf-extractor',
      label: 'PDF Extractor',
      path: '/admin/pdf-extractor',
      icon: <FileText className="w-5 h-5" />,
      category: 'content',
    },
    {
      id: 'review-queue',
      label: 'Review Queue',
      path: '/admin/review-queue',
      icon: <ClipboardCheck className="w-5 h-5" />,
      category: 'content',
    },
    // System Management
    {
      id: 'users',
      label: 'Users',
      path: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      category: 'system',
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/admin/reports',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'system',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/admin/notifications',
      icon: <Bell className="w-5 h-5" />,
      category: 'system',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      category: 'system',
    },
  ];

  const groupedNavItems = {
    main: navItems.filter(item => item.category === 'main'),
    content: navItems.filter(item => item.category === 'content'),
    system: navItems.filter(item => item.category === 'system'),
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-white to-blue-50 border-r flex flex-col transition-transform duration-300 z-40 shadow-lg',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'border-r-2'
        )}
        style={{ borderRightColor: '#e9e9e9' }}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b" style={{ borderBottomColor: '#e9e9e9' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#013062' }}>
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <div>
              <h2 className="font-bold" style={{ color: '#013062' }}>JEEnius</h2>
              <p className="text-xs" style={{ color: '#666' }}>Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {/* Main Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-3" style={{ color: '#013062' }}>
              Main
            </p>
            <div className="space-y-1 mb-6">
              {groupedNavItems.main.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(item.path)
                      ? 'text-white border-l-2'
                      : 'text-slate-700 hover:bg-blue-50'
                  )}
                  style={isActive(item.path) ? { backgroundColor: '#013062', borderLeftColor: '#013062' } : {}}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-semibold text-white rounded" style={{ backgroundColor: '#013062' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Management Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-3" style={{ color: '#013062' }}>
              Content
            </p>
            <div className="space-y-1 mb-6">
              {groupedNavItems.content.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(item.path)
                      ? 'text-white border-l-2'
                      : 'text-slate-700 hover:bg-blue-50'
                  )}
                  style={isActive(item.path) ? { backgroundColor: '#013062', borderLeftColor: '#013062' } : {}}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-semibold text-white rounded" style={{ backgroundColor: '#013062' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* System Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider px-4 mb-3" style={{ color: '#013062' }}>
              System
            </p>
            <div className="space-y-1">
              {groupedNavItems.system.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(item.path)
                      ? 'text-white border-l-2'
                      : 'text-slate-700 hover:bg-blue-50'
                  )}
                  style={isActive(item.path) ? { backgroundColor: '#013062', borderLeftColor: '#013062' } : {}}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-1 text-xs font-semibold text-white rounded" style={{ backgroundColor: '#013062' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderTopColor: '#e9e9e9' }}>
          <button
            variant="outline"
            className="w-full justify-start gap-2 mb-3 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ 
              backgroundColor: '#f0f0f0',
              color: '#013062',
              border: '1px solid #e9e9e9'
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-4 h-4" />
            Back to App
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-100"
            style={{ 
              backgroundColor: '#fff3f3',
              color: '#d32f2f',
              border: '1px solid #e9e9e9'
            }}
            onClick={() => handleLogout()}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">Admin User</p>
              <p className="text-xs text-slate-500">Full Access</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
