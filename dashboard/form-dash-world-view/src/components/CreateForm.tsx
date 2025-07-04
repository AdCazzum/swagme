
import React, { useState } from 'react';
import { useSwagForm } from '@/hooks/useSwagForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  text: string;
  required: boolean;
}

interface CreateFormProps {
  onBack: () => void;
  onFormCreated: () => void;
}

const CreateForm = ({ onBack, onFormCreated }: CreateFormProps) => {
  const { createForm, loading } = useSwagForm();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', required: false }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', required: false }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | boolean) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Form title is required",
        variant: "destructive"
      });
      return;
    }

    const validQuestions = questions.filter(q => q.text.trim());
    if (validQuestions.length === 0) {
      toast({
        title: "Error",
        description: "At least one question is required",
        variant: "destructive"
      });
      return;
    }

    try {
      await createForm(title, description, validQuestions);
      
      toast({
        title: "Success",
        description: "Form created successfully!",
      });
      
      onFormCreated();
    } catch (error: any) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create form",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Form</h1>
          <p className="text-gray-600">Design your Web3 form with custom questions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Details */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Form Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Form Title *
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter form title..."
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your form..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Questions
              </CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {questions.filter(q => q.text.trim()).length} questions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Question {index + 1}
                  </Label>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={question.required}
                        onCheckedChange={(checked) => updateQuestion(index, 'required', checked)}
                      />
                      <Label className="text-xs text-gray-600">Required</Label>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full"
                />
                
                {question.required && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    Required
                  </Badge>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="w-full border-dashed border-2 py-6 text-gray-600 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={loading || !title.trim() || questions.filter(q => q.text.trim()).length === 0}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Create Form</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateForm;
