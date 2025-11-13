import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronDown, BookOpen, Target, BarChart3, Brain, Award, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EnhancedHeader = ({ 
  isAuthenticated = true, 
  isAdmin = false,
  isPremium = false,
  onNavigate = (path) => console.log('Navigate to:', path),
  onLogout = () => console.log('Logout'),
  currentPath = '/dashboard'
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userInitials, setUserInitials] = useState('U');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
        // Generate initials from name
        const names = profile.full_name.trim().split(' ');
        const initials = names.length > 1 
          ? names[0][0] + names[names.length - 1][0]
          : names[0].slice(0, 2);
        setUserInitials(initials.toUpperCase());
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleNavigation = (path) => {
    setIsMenuOpen(false);
    onNavigate(path);
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  const publicNavItems = [
    { name: 'Home', path: '/', icon: null },
    { name: 'Why Us', path: '/why-us', icon: null },
  ];

  const navItems = isAuthenticated ? (
    isAdmin ? [
      { name: 'Dashboard', path: '/admin', icon: BarChart3 },
      { name: 'Analytics', path: '/admin/analytics', icon: Target },
      { name: 'Users', path: '/admin/users', icon: BookOpen },
      { name: 'Content', path: '/admin/content', icon: Brain },
    ] : [
      { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
      { name: 'Study Now', path: '/study-now', icon: BookOpen },
      ...(isPremium ? [{ name: 'AI Planner', path: '/ai-planner', icon: Brain }] : []),
      { name: 'Tests', path: '/tests', icon: Target },
    ]
  ) : publicNavItems;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JEEnius
              </span>
              <div className="text-xs text-gray-500">AI Learning Platform</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`transition-all duration-200 font-medium px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  currentPath === item.path
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 hover:border-blue-500 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                      {userInitials}
                    </div>
                    <span className="font-medium">{userName.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-xl">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">Manage your account</p>
                  </div>
                  
                  <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                    <div className="flex items-center space-x-3 w-full py-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{userInitials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Profile</p>
                        <p className="text-xs text-gray-500">View & edit profile</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                    <div className="flex items-center space-x-3 w-full py-1">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-lg">⚙️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Settings</p>
                        <p className="text-xs text-gray-500">Preferences & more</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => handleNavigation('/admin')}>
                      <div className="flex items-center space-x-3 w-full py-1">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-600">Admin Panel</p>
                          <p className="text-xs text-purple-400">Manage platform</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  <div className="border-t border-gray-100 mt-1">
                    <DropdownMenuItem 
                      onClick={handleLogoutClick}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <div className="flex items-center space-x-3 w-full py-1">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Logout</p>
                          <p className="text-xs text-red-400">Sign out of account</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-6 shadow-lg"
                onClick={() => handleNavigation('/login')}
              >
                Sign In / Get Started
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`text-left font-medium transition-all flex items-center space-x-3 p-3 rounded-lg ${
                    currentPath === item.path
                      ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg'
                      : 'text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.name}</span>
                </button>
              ))}
              
              {isAuthenticated && (
                <div className="pt-3 space-y-2 border-t mt-3">
                  <Button 
                    variant="outline"
                    className="w-full justify-start text-left h-12 flex items-center space-x-3 px-3 hover:bg-blue-50"
                    onClick={() => handleNavigation('/profile')}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                      {userInitials}
                    </div>
                    <div>
                      <p className="font-medium">{userName}</p>
                      <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-start text-left h-12 flex items-center space-x-3 px-3 hover:bg-gray-50"
                    onClick={() => handleNavigation('/settings')}
                  >
                    <span className="text-xl">⚙️</span>
                    <span>Settings</span>
                  </Button>
                  
                  {isAdmin && (
                    <Button 
                      variant="outline"
                      className="w-full justify-start text-left h-12 flex items-center space-x-3 px-3 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                      onClick={() => handleNavigation('/admin')}
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Admin Panel</span>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={handleLogoutClick}
                    className="w-full justify-start text-left h-12 flex items-center space-x-3 px-3 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default EnhancedHeader;
