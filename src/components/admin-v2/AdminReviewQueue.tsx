import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtractionReviewQueue } from '@/components/admin/ExtractionReviewQueue';

const AdminReviewQueue: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Review Questions</h1>
        <p className="text-slate-600 mt-2">Approve or edit extracted questions before publishing</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Extraction Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <ExtractionReviewQueue />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviewQueue;
