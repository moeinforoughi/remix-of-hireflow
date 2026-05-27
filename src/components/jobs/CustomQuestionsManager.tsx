import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { Card, CardContent, Cardتوضیحات, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { تأییدDialog } from '@/components/shared/تأییدDialog';

interface سؤال {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  order_idx: number;
}

interface CustomسؤالsManagerProps {
  jobId: string;
}

export const CustomسؤالsManager = ({ jobId }: CustomسؤالsManagerProps) => {
  const [questions, setسؤالs] = useState<سؤال[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [showافزودنForm, setنمایشافزودنForm] = useState(false);
  const [deleteتأیید, setحذفتأیید] = useState<string | null>(null);
  const [newسؤال, setNewسؤال] = useState({
    question_text: '',
    question_type: 'text',
    options: [''],
    is_required: false,
  });

  useEffect(() => {
    fetchسؤالs();
  }, [jobId]);

  const fetchسؤالs = async () => {
    try {
      const { data, error } = await supabase
        .from('application_questions')
        .select('*')
        .eq('job_id', jobId)
        .order('order_idx');

      if (error) throw error;
      setسؤالs(data || []);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  const handleافزودنسؤال = async () => {
    try {
      const { error } = await supabase
        .from('application_questions')
        .insert({
          job_id: jobId,
          question_text: newسؤال.question_text,
          question_type: newسؤال.question_type,
          options: newسؤال.question_type === 'multiple_choice' 
            ? newسؤال.options.filter(o => o.trim()) 
            : null,
          is_required: newسؤال.is_required,
          order_idx: questions.length,
        });

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'سؤال added successfully',
      });

      setNewسؤال({
        question_text: '',
        question_type: 'text',
        options: [''],
        is_required: false,
      });
      setنمایشافزودنForm(false);
      fetchسؤالs();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleحذفسؤال = async (id: string) => {
    try {
      const { error } = await supabase
        .from('application_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'سؤال deleted successfully',
      });

      fetchسؤالs();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
    setحذفتأیید(null);
  };

  const addOption = () => {
    setNewسؤال({
      ...newسؤال,
      options: [...newسؤال.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newسؤال.options];
    newOptions[index] = value;
    setNewسؤال({ ...newسؤال, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (newسؤال.options.length > 1) {
      const newOptions = newسؤال.options.filter((_, i) => i !== index);
      setNewسؤال({ ...newسؤال, options: newOptions });
    }
  };

  if (loading) {
    return <div className="text-center py-8">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg">Custom Application سؤالs</h3>
          <p className="text-sm text-muted-foreground">
            افزودن custom questions to your application form
          </p>
        </div>
        <Button onClick={() => setنمایشافزودنForm(!showافزودنForm)}>
          <Plus className="h-4 w-4 mr-2" />
          افزودن سؤال
        </Button>
      </div>

      {showافزودنForm && (
        <Card>
          <CardHeader>
            <Cardعنوان>New سؤال</Cardعنوان>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>سؤال Text *</Label>
              <Textarea
                value={newسؤال.question_text}
                onChange={(e) => setNewسؤال({ ...newسؤال, question_text: e.target.value })}
                placeholder="Enter your question..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>سؤال Type *</Label>
              <انتخاب
                value={newسؤال.question_type}
                onValueChange={(value: any) => setNewسؤال({ ...newسؤال, question_type: value })}
              >
                <انتخابTrigger>
                  <انتخابValue />
                </انتخابTrigger>
                <انتخابContent>
                  <انتخابItem value="text">Short Text</انتخابItem>
                  <انتخابItem value="textarea">Long Text</انتخابItem>
                  <انتخابItem value="yes_no">بله/خیر</انتخابItem>
                  <انتخابItem value="multiple_choice">Multiple Choice</انتخابItem>
                </انتخابContent>
              </انتخاب>
            </div>

            {newسؤال.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Options</Label>
                {newسؤال.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={newسؤال.options.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption} className="w-full">
                  افزودن Option
                </Button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={newسؤال.is_required}
                onCheckedChange={(checked) => 
                  setNewسؤال({ ...newسؤال, is_required: checked as boolean })
                }
              />
              <Label htmlFor="required" className="cursor-pointer">
                اجباری field
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleافزودنسؤال} disabled={!newسؤال.question_text}>
                افزودن سؤال
              </Button>
              <Button variant="outline" onClick={() => setنمایشافزودنForm(false)}>
                انصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">خیر custom questions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              افزودن questions to collect additional information from applicants
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {index + 1}. {question.question_text}
                          {question.is_required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Type: {question.question_type.replace('_', ' ')}
                        </p>
                        {question.question_type === 'multiple_choice' && question.options && (
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">Options:</p>
                            <ul className="list-disc list-inside ml-2">
                              {question.options.map((option, i) => (
                                <li key={i}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setحذفتأیید(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <تأییدDialog
        open={deleteتأیید !== null}
        onبازChange={(open) => !open && setحذفتأیید(null)}
        onتأیید={() => deleteتأیید && handleحذفسؤال(deleteتأیید)}
        title="حذف سؤال"
        description="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="حذف"
        variant="destructive"
      />
    </div>
  );
};
