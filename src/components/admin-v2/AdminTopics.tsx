import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Plus, Edit, Trash2, Search } from 'lucide-react';
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

interface Topic {
  id: string;
  name: string;
  chapter_id: string;
  chapter_name: string;
  question_count: number;
  created_at: string;
}

const AdminTopics: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    filterTopics();
  }, [topics, searchTerm]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, chapter_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const topicsWithDetails = await Promise.all(
        (data || []).map(async (topic) => {
          const [chapterRes, questionRes] = await Promise.all([
            supabase.from('chapters').select('name').eq('id', topic.chapter_id).single(),
            supabase.from('questions').select('id', { count: 'exact', head: true }).eq('topic_id', topic.id),
          ]);

          return {
            ...topic,
            chapter_name: chapterRes.data?.name || 'Unknown',
            question_count: questionRes.count || 0,
          };
        })
      );

      setTopics(topicsWithDetails);
    } catch (error) {
      logger.error('Error loading topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = topics;
    if (searchTerm) {
      filtered = filtered.filter(
        topic =>
          topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.chapter_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTopics(filtered);
  };

  const handleDeleteTopic = async (id: string) => {
    try {
      const { error } = await supabase.from('topics').delete().eq('id', id);
      if (error) throw error;
      toast.success('Topic deleted successfully');
      loadTopics();
    } catch (error) {
      logger.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Topic Management</h1>
          <p className="text-slate-600 mt-2">Organize topics within chapters</p>
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
          Add Topic
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Topics</p>
            <p className="text-3xl font-bold text-slate-900">{topics.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Questions in Topics</p>
            <p className="text-3xl font-bold text-slate-900">
              {topics.reduce((sum, t) => sum + t.question_count, 0)}
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
              placeholder="Search topics..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-300 focus:border-[#013062] focus:ring-[#013062]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Topics Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Topics ({filteredTopics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e9e9e9' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e9e9e9' }}>
                  <TableHead className="font-semibold text-slate-900">Topic Name</TableHead>
                  <TableHead className="font-semibold text-slate-900">Chapter</TableHead>
                  <TableHead className="font-semibold text-slate-900">Questions</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.length > 0 ? (
                  filteredTopics.map(topic => (
                    <TableRow key={topic.id} className="hover:bg-slate-50" style={{ borderBottom: '1px solid #e9e9e9' }}>
                      <TableCell className="font-medium text-slate-900">{topic.name}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: '#013062', color: 'white', border: 'none' }}>
                          {topic.chapter_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">{topic.question_count}</TableCell>
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
                          onClick={() => handleDeleteTopic(topic.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                      No topics found
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

export default AdminTopics;
