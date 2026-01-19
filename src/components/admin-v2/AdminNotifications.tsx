import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Database } from '@/integrations/supabase/types';

type AdminNotificationRow = Database['public']['Tables']['admin_notifications']['Row'];

interface UINotification extends Pick<AdminNotificationRow, 'id' | 'title' | 'message' | 'created_at' | 'target_audience' | 'status'> {
  sent_to: number;
}

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const withCounts: UINotification[] = await Promise.all(
        (data || []).map(async (n) => {
          const { count } = await supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('notification_id', n.id);
          return {
            id: n.id,
            title: n.title,
            message: n.message,
            created_at: n.created_at || new Date().toISOString(),
            target_audience: n.target_audience,
            status: n.status,
            sent_to: count || 0,
          };
        })
      );

      setNotifications(withCounts);
    } catch (error) {
      logger.error('Failed to load notifications', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const { error } = await supabase.from('admin_notifications').insert({
        title,
        message,
        target_audience: 'all',
        status: 'sent',
      });
      if (error) throw error;
      toast.success('Notification saved');
      setTitle('');
      setMessage('');
      loadNotifications();
    } catch (error) {
      logger.error('Failed to send notification', error);
      toast.error('Failed to send notification');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete user_notification links first
      await supabase.from('user_notifications').delete().eq('notification_id', id);
      // Then delete the admin notification
      const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Notification deleted');
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      logger.error('Failed to delete notification', error);
      toast.error('Failed to delete notification');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-2">Send alerts and announcements to users</p>
        </div>
      </div>

      {/* Send Notification */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Send New Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Title</label>
              <Input
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-slate-300 focus:border-[#013062]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Message</label>
              <textarea
                placeholder="Notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border rounded-lg border-slate-300 focus:border-[#013062] focus:ring-[#013062]"
                rows={4}
              />
            </div>
            <Button 
              className="gap-2 text-white"
              style={{ backgroundColor: '#013062' }}
              onClick={handleSendNotification}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00233d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013062';
              }}
            >
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Notification History ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: '#e9e9e9' }}>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" style={{ color: '#013062' }} />
                  <div>
                    <p className="font-medium text-slate-900">{notif.title}</p>
                    <p className="text-sm text-slate-500">{notif.message} • Audience: {notif.target_audience} • Sent to {notif.sent_to}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" style={{ borderColor: '#e9e9e9', color: '#d32f2f' }} onClick={() => handleDelete(notif.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
