import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserReports } from '@/components/admin/UserReports';

const AdminReports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports & Exports</h1>
        <p className="text-slate-600 mt-2">View analytics and export real reports</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>User Reports & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <UserReports />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
