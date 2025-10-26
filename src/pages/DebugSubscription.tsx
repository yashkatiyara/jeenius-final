import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function SubscriptionDebug() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setData({ error: 'No user logged in' });
        return;
      }

      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Check payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Check subscriptions (if table exists)
      let subscriptions = null;
      try {
        const { data: subs } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id);
        subscriptions = subs;
      } catch (e) {
        subscriptions = 'Table does not exist';
      }

      setData({
        userId: user.id,
        email: user.email,
        profile,
        payments,
        subscriptions,
        now: new Date().toISOString()
      });
    } catch (error: any) {
      setData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const forceActivatePremium = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          subscription_plan: 'yearly',
          subscription_end_date: endDate.toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      alert('✅ Premium activated manually!');
      checkStatus();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🔍 Subscription Debug Panel</span>
              <div className="flex gap-2">
                <Button onClick={checkStatus} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={forceActivatePremium} variant="outline">
                  Force Activate Premium
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div>Loading...</div>
            ) : data.error ? (
              <div className="text-red-600">Error: {data.error}</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold mb-2">User Info</h3>
                  <div className="bg-gray-100 p-4 rounded">
                    <div>ID: {data.userId}</div>
                    <div>Email: {data.email}</div>
                    <div>Current Time: {data.now}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    Profile Status
                    {data.profile?.is_premium ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Premium Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="w-4 h-4 mr-1" />
                        Free User
                      </Badge>
                    )}
                  </h3>
                  <div className="bg-gray-100 p-4 rounded">
                    <div>is_premium: {data.profile?.is_premium ? '✅ true' : '❌ false'}</div>
                    <div>subscription_plan: {data.profile?.subscription_plan || 'N/A'}</div>
                    <div>subscription_end_date: {data.profile?.subscription_end_date || 'N/A'}</div>
                    {data.profile?.subscription_end_date && (
                      <div className="mt-2">
                        <Badge className={
                          new Date(data.profile.subscription_end_date) > new Date()
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }>
                          {new Date(data.profile.subscription_end_date) > new Date()
                            ? '✅ Not Expired'
                            : '❌ Expired'
                          }
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Recent Payments</h3>
                  <div className="bg-gray-100 p-4 rounded space-y-2">
                    {data.payments && data.payments.length > 0 ? (
                      data.payments.map((payment: any) => (
                        <div key={payment.id} className="border-b pb-2">
                          <Badge className={
                            payment.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                          }>
                            {payment.status}
                          </Badge>
                          <div className="text-sm mt-1">
                            <div>Amount: ₹{payment.amount / 100}</div>
                            <div>Plan: {payment.plan_id}</div>
                            <div>Date: {new Date(payment.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div>No payments found</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Subscriptions Table</h3>
                  <div className="bg-gray-100 p-4 rounded">
                    {typeof data.subscriptions === 'string' ? (
                      <div className="text-yellow-600">{data.subscriptions}</div>
                    ) : data.subscriptions && data.subscriptions.length > 0 ? (
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(data.subscriptions, null, 2)}
                      </pre>
                    ) : (
                      <div>No subscriptions found</div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded border-2 border-blue-200">
                  <h3 className="font-bold mb-2">💡 Quick Fix Steps</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>If payment was successful but Premium not showing, click "Force Activate Premium" button above</li>
                    <li>Refresh the page after activation</li>
                    <li>Check that subscription_end_date is in the future</li>
                    <li>Verify is_premium is true in profile</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
