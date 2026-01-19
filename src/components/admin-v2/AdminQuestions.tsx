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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Search, Plus, Edit, Trash2, Filter, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: string;
  created_at: string;
}

const AdminQuestionsV2: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<Partial<Question>>({
    subject: 'Physics',
    difficulty: 'Medium',
  });
  const { toast } = useToast();

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedSubject, selectedDifficulty]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      logger.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = questions;

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    setFilteredQuestions(filtered);
  };

  const handleAddQuestion = async () => {
    try {
      if (!formData.question || !formData.option_a || !formData.option_b || !formData.option_c || !formData.option_d) {
        toast.error('Please fill all required fields');
        return;
      }

      const { error } = await supabase.from('questions').insert([
        {
          question: formData.question,
          option_a: formData.option_a,
          option_b: formData.option_b,
          option_c: formData.option_c,
          option_d: formData.option_d,
          correct_option: formData.correct_option || 'A',
          explanation: formData.explanation,
          subject: formData.subject,
          chapter: formData.chapter || '',
          topic: formData.topic || '',
          difficulty: formData.difficulty,
          exam: 'JEE',
        },
      ]);

      if (error) throw error;

      toast.success('Question added successfully');
      setIsAddDialogOpen(false);
      setFormData({ subject: 'Physics', difficulty: 'Medium' });
      loadQuestions();
    } catch (error) {
      logger.error('Error adding question:', error);
      toast.error('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted');
      loadQuestions();
    } catch (error) {
      logger.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#013062' }}></div>
          <p className="text-slate-600 mt-4">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Question Management</h1>
          <p className="text-slate-600 mt-2">Manage questions in your question bank</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject *</Label>
                  <Select
                    value={formData.subject || ''}
                    onValueChange={v => setFormData({ ...formData, subject: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty *</Label>
                  <Select
                    value={formData.difficulty || ''}
                    onValueChange={v => setFormData({ ...formData, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map(d => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Chapter</Label>
                <Input
                  value={formData.chapter || ''}
                  onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                  placeholder="e.g., Motion in One Dimension"
                />
              </div>

              <div>
                <Label>Topic</Label>
                <Input
                  value={formData.topic || ''}
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Kinematics"
                />
              </div>

              <div>
                <Label>Question Text *</Label>
                <Textarea
                  value={formData.question || ''}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter question..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Option A *</Label>
                  <Input
                    value={formData.option_a || ''}
                    onChange={e => setFormData({ ...formData, option_a: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Option B *</Label>
                  <Input
                    value={formData.option_b || ''}
                    onChange={e => setFormData({ ...formData, option_b: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Option C *</Label>
                  <Input
                    value={formData.option_c || ''}
                    onChange={e => setFormData({ ...formData, option_c: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Option D *</Label>
                  <Input
                    value={formData.option_d || ''}
                    onChange={e => setFormData({ ...formData, option_d: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Correct Option *</Label>
                <Select
                  value={formData.correct_option || ''}
                  onValueChange={v => setFormData({ ...formData, correct_option: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={formData.explanation || ''}
                  onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Enter explanation..."
                  rows={3}
                />
              </div>

              <Button onClick={handleAddQuestion} className="w-full">
                Add Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Total Questions</p>
            <p className="text-3xl font-bold text-slate-900">{questions.length}</p>
          </CardContent>
        </Card>
        {subjects.map(subject => (
          <Card key={subject} className="border-0 shadow-sm bg-white" style={{ borderLeft: '4px solid #013062' }}>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">{subject}</p>
              <p className="text-3xl font-bold text-slate-900">
                {questions.filter(q => q.subject === subject).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-[#013062] focus:ring-[#013062]"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {difficulties.map(d => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              className="text-white"
              style={{ backgroundColor: '#013062', borderColor: '#013062' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00233d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#013062';
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          <CardDescription>
            Showing {filteredQuestions.length} of {questions.length} total questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e9e9e9' }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e9e9e9' }}>
                  <TableHead className="font-semibold text-slate-900">Question</TableHead>
                  <TableHead className="font-semibold text-slate-900">Subject</TableHead>
                  <TableHead className="font-semibold text-slate-900">Chapter</TableHead>
                  <TableHead className="font-semibold text-slate-900">Difficulty</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map(q => (
                    <TableRow key={q.id} className="hover:bg-slate-50" style={{ borderBottom: '1px solid #e9e9e9' }}>
                      <TableCell className="max-w-xs">
                        <p className="text-sm font-medium text-slate-900 truncate">{q.question}</p>
                      </TableCell>
                      <TableCell className="text-slate-700">{q.subject}</TableCell>
                      <TableCell className="text-slate-700 text-sm">{q.chapter || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getDifficultyColor(q.difficulty)}>
                          {q.difficulty}
                        </Badge>
                      </TableCell>
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
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      No questions found
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

export default AdminQuestionsV2;
