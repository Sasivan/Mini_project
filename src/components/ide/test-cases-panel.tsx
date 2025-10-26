import { CheckCircle2, XCircle, Loader2, CircleDot } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

export interface TestCase {
  id: string; // Changed to string to match firestore id
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  isHidden?: boolean;
  input?: string;
  expected?: string;
  actual?: string;
}

interface TestCasesPanelProps {
  testCases: TestCase[];
}

const statusIcons = {
  passed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
  running: <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />,
  pending: <CircleDot className="h-5 w-5 text-muted-foreground" />,
};

const statusText = {
    passed: 'Passed',
    failed: 'Failed',
    running: 'Running...',
    pending: 'Pending',
}

export default function TestCasesPanel({ testCases }: TestCasesPanelProps) {
  if (testCases.length === 0) {
    return (
         <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>No Test Cases</AlertTitle>
            <AlertDescription>
                Test cases will appear here once you select a challenge.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {testCases.map((tc) => (
        <Card key={tc.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
            <CardTitle className="text-base font-medium">{tc.name}</CardTitle>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{statusText[tc.status]}</span>
                {statusIcons[tc.status]}
            </div>
          </CardHeader>
          {!tc.isHidden && (
            <CardContent className="p-4 text-sm space-y-2">
              <div>
                <span className="font-semibold">Input:</span>
                <pre className="font-code text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md mt-1 whitespace-pre-wrap">{tc.input}</pre>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                <div>
                  <span className="font-semibold">Expected Output:</span>
                  <pre className="font-code text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md mt-1 whitespace-pre-wrap">{tc.expected}</pre>
                </div>
                {(tc.status === 'passed' || tc.status === 'failed') && (
                    <div>
                        <span className="font-semibold">Your Output:</span>
                        <pre className={`font-code text-xs p-2 rounded-md mt-1 whitespace-pre-wrap ${tc.status === 'passed' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>{tc.actual}</pre>
                    </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
