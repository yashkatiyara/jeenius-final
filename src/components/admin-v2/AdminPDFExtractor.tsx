import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PDFQuestionExtractor } from '@/components/admin/PDFQuestionExtractor';

const AdminPDFExtractor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">PDF Extractor</h1>
        <p className="text-slate-600 mt-2">Extract questions from PDF documents using AI</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>AI Question Extraction</CardTitle>
        </CardHeader>
        <CardContent>
          <PDFQuestionExtractor />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPDFExtractor;
