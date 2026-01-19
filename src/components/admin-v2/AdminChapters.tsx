import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Chapter {
  id: string;
  name: string;
  subject: string;
  topic_count: number;
  question_count: number;
  created_at: string;
}

const AdminChapters: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadChapters();
  }, []);

  useEffect(() => {
    filterChapters();
  }, [chapters, searchTerm]);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chapters')
        .select('id, name, subject, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const chaptersWithCounts = await Promise.all(
        (data || []).map(async (chapter) => {
          const [topicRes, questionRes] = await Promise.all([
            supabase.from('topics').select('id', { count: 'exact', head: true }).eq('chapter_id', chapter.id),
            supabase.from('questions').select('id', { count: 'exact', head: true }).eq('chapter_id', chapter.id),
          ]);

          return {
            ...chapter,
            topic_count: topicRes.count || 0,
            question_count: questionRes.count || 0,
          };
        })
      );

      setChapters(chaptersWithCounts);
    } catch (error) {
      logger.error('Error loading chapters:', error);
      toast.error('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const filterChapters = () => {
    let filtered = chapters;
    if (searchTerm) {
      filtered = filtered.filter(
        chapter =>
          chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chapter.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredChapters(filtered);
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) throw error;
      toast.success('Chapter deleted successfully');
      loadChapters();
    } catch (error) {
      logger.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading chapters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chapter Management</h1>
          <p className="text-slate-600 mt-2">Organize and manage chapter content</p>
        </div>
        <Button 
          className="gap-2 text-white"
          style={{ backgroundColor: '#013062' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00233d';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013062';
          }}
        >
          <Plus className="w-4 h-4" />
          Add Chapter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Chapters</p>
            <p className="text-3xl font-bold text-slate-900">{chapters.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Topics</p>
            <p className="text-3xl font-bold text-slate-900">
              {chapters.reduce((sum, c) => sum + c.topic_count, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Questions</p>
            <p className="text-3xl font-bold text-slate-900">
              {chapters.reduce((sum, c) => sum + c.question_count, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search chapters..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-300 focus:border-[#013062] focus:ring-[#013062]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chapters Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Chapters ({filteredChapters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e9e9e9' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e9e9e9' }}>
                  <TableHead className="font-semibold text-slate-900">Chapter Name</TableHead>
                  <TableHead className="font-semibold text-slate-900">Subject</TableHead>
                  <TableHead className="font-semibold text-slate-900">Topics</TableHead>
                  <TableHead className="font-semibold text-slate-900">Questions</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChapters.length > 0 ? (
                  filteredChapters.map(chapter => (
                    <TableRow key={chapter.id} className="hover:bg-slate-50" style={{ borderBottom: '1px solid #e9e9e9' }}>
                      <TableCell className="font-medium text-slate-900">{chapter.name}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: '#013062', color: 'white', border: 'none' }}>
                          {chapter.subject}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">{chapter.topic_count}</TableCell>
                      <TableCell className="text-slate-700">{chapter.question_count}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          style={{ borderColor: '#e9e9e9', color: '#013062' }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          style={{ borderColor: '#e9e9e9', color: '#d32f2f' }}
                          onClick={() => handleDeleteChapter(chapter.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No chapters found
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

export default AdminChapters;
