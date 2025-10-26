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
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const testCaseSchema = z.object({
  input: z.string().min(1, 'Input is required.'),
  expectedOutput: z.string().min(1, 'Expected output is required.'),
  isHidden: z.boolean().default(false),
});

const challengeSchema = z.object({
  title: z.string().min(1, 'Challenge title is required.'),
  description: z.string().min(1, 'Challenge description is required.'),
  starterCode: z.string().min(1, 'Starter code is required.'),
  testCases: z.array(testCaseSchema).min(1, 'At least one test case is required.'),
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;

export default function CreateChallengePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      starterCode: '',
      testCases: [{ input: '', expectedOutput: '', isHidden: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'testCases',
  });

  const onSubmit = async (data: ChallengeFormValues) => {
    setIsSubmitting(true);
    
    const challengeData = {
        title: data.title,
        description: data.description,
        starterCode: data.starterCode,
    };
    const challengeCollection = collection(firestore, 'challenges');
    
    addDocumentNonBlocking(challengeCollection, challengeData)
        .then(challengeRef => {
            if (!challengeRef) return; // In case of early exit from non-blocking function

            const testCasesCollection = collection(firestore, 'challenges', challengeRef.id, 'testCases');
            for (const testCase of data.testCases) {
                const testCaseData = {
                    ...testCase,
                    challengeId: challengeRef.id,
                };
                addDocumentNonBlocking(testCasesCollection, testCaseData);
            }
            
            toast({
                title: 'Challenge Created!',
                description: `The challenge "${data.title}" has been successfully saved.`,
            });
            form.reset();
        })
        // The .catch is handled inside addDocumentNonBlocking, which emits a global error.
        // We only need to handle the UI state update here.
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center font-headline">Create a New Coding Challenge</h1>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
              <CardDescription>Define the title, description, and starter code for your challenge.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Two Sum Problem" {...field} />
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
                    <FormLabel>Challenge Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain the problem to be solved." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="starterCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starter Code</FormLabel>
                    <FormControl>
                      <Textarea placeholder="function solve(args) {\n  // your code here\n}" {...field} rows={10} className="font-code" />
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
                <CardTitle>Test Case {index + 1}</CardTitle>
                {fields.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`testCases.${index}.input`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., [2, 7, 11, 15], 9" {...field} className="font-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`testCases.${index}.expectedOutput`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Output</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., [0, 1]" {...field} className="font-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`testCases.${index}.isHidden`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Hidden Test Case</FormLabel>
                        <CardDescription>
                          If enabled, the input and output will be hidden from the user.
                        </CardDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ input: '', expectedOutput: '', isHidden: false })}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Test Case
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Challenge...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
