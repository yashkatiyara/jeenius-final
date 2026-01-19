import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Search, Mail, Calendar, Crown, Filter, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_premium: boolean;
  subscription_end_date: string | null;
  target_exam?: string;
  grade?: string;
}

const AdminUsersV2: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [premiumFilter, setPremiumFilter] = useState<'all' | 'premium' | 'free'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, premiumFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, is_premium, subscription_end_date, target_exam, grade')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      logger.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        user =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (premiumFilter !== 'all') {
      filtered = filtered.filter(
        user =>
          (premiumFilter === 'premium' && user.is_premium) ||
          (premiumFilter === 'free' && !user.is_premium)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User status updated');
      loadUsers();
    } catch (error) {
      logger.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-2">Manage all user accounts and subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-slate-900">{users.length}</p>
              </div>
              <div className="p-3 rounded-lg text-white" style={{ backgroundColor: '#013062' }}>
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Premium Users</p>
                <p className="text-3xl font-bold text-slate-900">
                  {users.filter(u => u.is_premium).length}
                </p>
              </div>
              <div className="p-3 rounded-lg text-white" style={{ backgroundColor: '#013062' }}>
                <Crown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-900">
                  {((users.filter(u => u.is_premium).length / Math.max(users.length, 1)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-lg text-white" style={{ backgroundColor: '#013062' }}>
                <Filter className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-[#013062] focus:ring-[#013062]"
              />
            </div>
            <Select value={premiumFilter} onValueChange={e => setPremiumFilter(e as any)}>
              <SelectTrigger className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="premium">Premium Only</SelectItem>
                <SelectItem value="free">Free Only</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="w-full text-white"
              style={{ backgroundColor: '#013062' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00233d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013062';
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} total users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e9e9e9' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e9e9e9' }}>
                  <TableHead className="font-semibold text-slate-900">Email</TableHead>
                  <TableHead className="font-semibold text-slate-900">Name</TableHead>
                  <TableHead className="font-semibold text-slate-900">Joined</TableHead>
                  <TableHead className="font-semibold text-slate-900">Status</TableHead>
                  <TableHead className="font-semibold text-slate-900">Exam</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <TableRow key={user.id} className="hover:bg-slate-50" style={{ borderBottom: '1px solid #e9e9e9' }}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">{user.full_name || '-'}</TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_premium ? 'default' : 'secondary'}
                          style={
                            user.is_premium
                              ? { backgroundColor: '#013062', color: 'white', border: 'none' }
                              : { backgroundColor: '#e9e9e9', color: '#374151', border: 'none' }
                          }
                        >
                          {user.is_premium ? 'Premium' : 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">{user.target_exam || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              style={{ borderColor: '#e9e9e9', color: '#013062' }}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-slate-900">Email</label>
                                <p className="text-slate-600">{user.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-900">Name</label>
                                <p className="text-slate-600">{user.full_name || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-900">Target Exam</label>
                                <p className="text-slate-600">{user.target_exam || 'Not set'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-900">Grade</label>
                                <p className="text-slate-600">{user.grade || 'Not set'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-900">Subscription</label>
                                <p className="text-slate-600">
                                  {user.is_premium
                                    ? `Until ${formatDate(user.subscription_end_date || '')}`
                                    : 'Free Plan'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-slate-900">Joined</label>
                                <p className="text-slate-600">{formatDate(user.created_at)}</p>
                              </div>
                              <Button
                                className="w-full text-white"
                                style={{ backgroundColor: '#013062' }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00233d';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013062';
                                }}
                                onClick={() => {
                                  handleTogglePremium(user.id, user.is_premium);
                                }}
                              >
                                {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersV2;
