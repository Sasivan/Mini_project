'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Lightbulb, Code2, ClipboardCopy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  analyzeCodeSubmission,
  CodeAnalysisOutput,
} from '@/ai/flows/analyze-code-submission';
import { QualityRatingChart } from './quality-rating-chart';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

export default function AnalysisClient() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const code = searchParams.get('code') || '';
  const language = searchParams.get('language') || 'javascript';

  const [analysis, setAnalysis] = useState<CodeAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCode = useMemo(() => `function helloWorld() {
  console.log("Hello, World!");
}`, []);

  const displayCode = code || defaultCode;

  useEffect(() => {
    if (!displayCode) return;

    const performAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await analyzeCodeSubmission({
          code: displayCode,
          language,
          testResults: '2/4 test cases passed.', // This is a placeholder
        });
        setAnalysis(result);
      } catch (err) {
        console.error('AI Analysis Error:', err);
        setError('Failed to get AI analysis. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    performAnalysis();
  }, [displayCode, language]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard!',
      description: 'The code has been copied successfully.',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">AI Code Analysis</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here is detailed feedback for your submission.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Code Quality Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Code Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full rounded-full mx-auto max-w-[200px]" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : analysis ? (
                <>
                  <QualityRatingChart rating={analysis.overallRating} />
                  <p className="text-center text-muted-foreground mt-4">{analysis.generalExplanation}</p>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Topics for Improvement Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Lightbulb /> Topics to Study
              </CardTitle>
              <CardDescription>Key concepts to focus on for improvement.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ) : analysis ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.improvementTopics.map((topic) => (
                    <Badge key={topic} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
          
          {/* Submitted Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Your Submission</CardTitle>
              <CardDescription>{language}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="font-code text-sm bg-gray-900 dark:bg-black text-white p-4 rounded-md overflow-x-auto">
                <code>{displayCode}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Corrected Code Card */}
          {loading ? (
            <Card>
                 <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                 </CardHeader>
                 <CardContent>
                    <Skeleton className="h-40 w-full" />
                 </CardContent>
            </Card>
          ) : analysis && analysis.correctedCode && (
             <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline flex items-center gap-2">
                      <Code2 /> Fully Corrected Code
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(analysis.correctedCode)}>
                      <ClipboardCopy />
                    </Button>
                  </div>
                  <CardDescription>
                    The complete code with all suggestions applied.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="font-code text-sm bg-gray-900 dark:bg-black text-white p-4 rounded-md overflow-x-auto">
                    <code>{analysis.correctedCode}</code>
                  </pre>
                </CardContent>
              </Card>
          )}

          {/* Detailed Feedback Section */}
          <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Detailed Feedback</h2>
            {loading ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : analysis && analysis.mistakes.length > 0 ? (
              <div className="space-y-6">
                {analysis.mistakes.map((mistake, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-xl">Issue on Line(s): {mistake.lines.join(', ')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{mistake.explanation}</p>
                      <div>
                        <h4 className="font-semibold mb-2">Suggested Fix:</h4>
                        <pre className="font-code text-sm bg-gray-900 dark:bg-black text-white p-4 rounded-md overflow-x-auto">
                          <code>{mistake.suggestion}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                         <p>No specific mistakes were found. Great job!</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
