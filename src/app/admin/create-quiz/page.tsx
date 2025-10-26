'use client';

import { useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required.'),
  options: z.array(z.string().min(1, 'Option text cannot be empty.')).min(2, 'At least two options are required.'),
  correctAnswerIndex: z.coerce.number().min(0, 'You must select a correct answer.'),
});

const quizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required.'),
  description: z.string().min(1, 'Quiz description is required.'),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

type QuizFormValues = z.infer<typeof quizSchema>;

export default function CreateQuizPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      questions: [{ text: '', options: ['', ''], correctAnswerIndex: -1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const onSubmit = async (data: QuizFormValues) => {
    setIsSubmitting(true);
    const quizData = {
        title: data.title,
        description: data.description,
    };
    const quizCollection = collection(firestore, 'quizzes');

    addDocumentNonBlocking(quizCollection, quizData)
        .then(quizRef => {
            if (!quizRef) return; // In case of early exit

            const questionsCollection = collection(firestore, 'quizzes', quizRef.id, 'questions');
            for (const question of data.questions) {
                const questionData = {
                    ...question,
                    quizId: quizRef.id,
                };
                addDocumentNonBlocking(questionsCollection, questionData);
            }

            toast({
                title: 'Quiz Created!',
                description: `The quiz "${data.title}" has been successfully saved.`,
            });
            form.reset();
        })
        // The .catch is handled inside addDocumentNonBlocking, which emits a global error.
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center font-headline">Create a New Quiz</h1>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>Provide a title and description for your new quiz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., JavaScript Fundamentals" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief summary of what this quiz covers." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Question {index + 1}</CardTitle>
                </div>
                {fields.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`questions.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="What is a closure?" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`questions.${index}.correctAnswerIndex`}
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel>Options</FormLabel>
                       <FormMessage className="mb-2"/>
                       <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
                        className="space-y-2"
                      >
                         <FormLabel>Options (select the correct answer)</FormLabel>
                          {form.watch(`questions.${index}.options`).map((_, optionIndex) => (
                              <FormField
                                key={`${field.name}-option-${optionIndex}`}
                                control={form.control}
                                name={`questions.${index}.options.${optionIndex}`}
                                render={({ field: optionField }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[[data-state=checked]]:border-primary">
                                    <FormControl>
                                    <RadioGroupItem value={optionIndex.toString()} />
                                    </FormControl>
                                    <Input {...optionField} placeholder={`Option ${optionIndex + 1}`} className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0" />
                                </FormItem>
                                )}
                            />
                          ))}
                      </RadioGroup>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const options = form.getValues(`questions.${index}.options`);
                            form.setValue(`questions.${index}.options`, [...options, '']);
                        }}
                    >
                       <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                     {form.watch(`questions.${index}.options`).length > 2 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                 const options = form.getValues(`questions.${index}.options`);
                                 options.pop();
                                form.setValue(`questions.${index}.options`, options);
                            }}
                        >
                           <Trash2 className="mr-2 h-4 w-4" /> Remove Last Option
                        </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => append({ text: '', options: ['', ''], correctAnswerIndex: -1 })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Question
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
