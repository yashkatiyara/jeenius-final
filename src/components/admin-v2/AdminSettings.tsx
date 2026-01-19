import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

type LimitsKey = 'questionsPerDay' | 'questionsPerMonth' | 'mockTestsPerMonth';

const AdminSettings: React.FC = () => {
  const [limits, setLimits] = useState<Record<LimitsKey, number>>({
    questionsPerDay: 20,
    questionsPerMonth: 300,
    mockTestsPerMonth: 2,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('free_content_limits').select('*');
      if (error) throw error;
      const next: Record<LimitsKey, number> = { ...limits };
      (data || []).forEach((row) => {
        if (['questionsPerDay', 'questionsPerMonth', 'mockTestsPerMonth'].includes(row.limit_type)) {
          next[row.limit_type as LimitsKey] = row.limit_value;
        }
      });
      setLimits(next);
    } catch (error) {
      logger.error('Failed to load limits', error);
      toast.error('Failed to load limits');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Upsert each limit
      for (const key of Object.keys(limits) as LimitsKey[]) {
        const { error } = await supabase.from('free_content_limits').upsert(
          { limit_type: key, limit_value: limits[key] },
          { onConflict: 'limit_type' }
        );
        if (error) throw error;
      }
      toast.success('Limits saved');
    } catch (error) {
      logger.error('Failed to save limits', error);
      toast.error('Failed to save limits');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-slate-600 mt-2">Configure free plan limits (live data)</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Free Plan Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Questions Per Day</label>
              <Input
                type="number"
                value={limits.questionsPerDay}
                onChange={(e) => setLimits({ ...limits, questionsPerDay: parseInt(e.target.value || '0', 10) })}
                className="border-slate-300 focus:border-[#013062]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Questions Per Month</label>
              <Input
                type="number"
                value={limits.questionsPerMonth}
                onChange={(e) => setLimits({ ...limits, questionsPerMonth: parseInt(e.target.value || '0', 10) })}
                className="border-slate-300 focus:border-[#013062]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Mock Tests Per Month</label>
              <Input
                type="number"
                value={limits.mockTestsPerMonth}
                onChange={(e) => setLimits({ ...limits, mockTestsPerMonth: parseInt(e.target.value || '0', 10) })}
                className="border-slate-300 focus:border-[#013062]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="gap-2 text-white"
              style={{ backgroundColor: '#013062' }}
              onClick={handleSave}
              disabled={saving}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00233d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013062';
              }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Limits'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
