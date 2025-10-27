
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodeEditor from './code-editor';
import OutputPanel from './output-panel';
import TestCasesPanel, { type TestCase } from './test-cases-panel';
import { Play, Send, Bot, Loader2, ChevronsLeft, ChevronsRight, BookOpen, Trash2, List, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, collectionGroup, doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../ui/alert-dialog';
import { deleteDocumentAndSubcollection } from '@/firebase/non-blocking-updates';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import CameraFeed from '../proctoring/camera-feed';


const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
];

const defaultCode = {
  javascript: `// Select a challenge to begin\nfunction solve() {\n\n}`,
  python: `# Select a challenge to begin\ndef solve():\n    pass`,
  cpp: `// Select a challenge to begin\n#include <iostream>\n\nint main() {\n    return 0;\n}`,
  c: `// Select a challenge to begin\n#include <stdio.h>\n\nint main() {\n    return 0;\n}`
};

const defaultChallenges = [
    {
        id: 'default-two-sum',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        starterCode: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
};`,
        testCases: [
            { id: '1', name: 'Test Case 1 (Visible)', status: 'pending', isHidden: false, input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]' },
            { id: '2', name: 'Test Case 2 (Visible)', status: 'pending', isHidden: false, input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]' },
            { id: '3', name: 'Test Case 3 (Hidden)', status: 'pending', isHidden: true, input: 'nums = [3, 3], target = 6', expected: '[0, 1]' },
        ]
    },
    {
        id: 'default-fibonacci',
        title: 'Fibonacci Sequence',
        description: 'Write a function to return the nth number in the Fibonacci sequence.\n\nThe Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1.',
        starterCode: `function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    let temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}`,
        testCases: [
            { id: 'fib-1', name: 'Test Case 1 (Visible)', status: 'pending', isHidden: false, input: 'n = 2', expected: '1' },
            { id: 'fib-2', name: 'Test Case 2 (Visible)', status: 'pending', isHidden: false, input: 'n = 5', expected: '5' },
            { id: 'fib-3', name: 'Test Case 3 (Hidden)', status: 'pending', isHidden: true, input: 'n = 10', expected: '55' },
            { id: 'fib-4', name: 'Test Case 4 (Hidden)', status: 'pending', isHidden: true, input: 'n = 15', expected: '610' },
        ]
    }
];


export default function IdeLayout() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(defaultChallenges[0].starterCode);
  const [output, setOutput] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>(defaultChallenges[0].testCases);
  const [activeTab, setActiveTab] = useState('challenge-details');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(defaultChallenges[0].id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<{id: string, title: string} | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const challengesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'challenges');
  }, [firestore]);
  const { data: challengesFromDb, isLoading: isLoadingChallenges } = useCollection(challengesQuery);

  const allChallenges = useMemo(() => {
      const dbChallenges = challengesFromDb || [];
      const defaultTitles = new Set(defaultChallenges.map(d => d.title));
      const newDbChallenges = dbChallenges.filter(c => !defaultTitles.has(c.title));
      return [...defaultChallenges, ...newDbChallenges];
  }, [challengesFromDb]);

  
  const selectedChallenge = useMemo(() => {
    return allChallenges?.find(c => c.id === selectedChallengeId) || null;
  }, [allChallenges, selectedChallengeId]);


  useEffect(() => {
    if (selectedChallenge) {
      setCode(selectedChallenge.starterCode || defaultCode[language as keyof typeof defaultCode]);
      
      const fetchTestCases = async () => {
          const isDefault = defaultChallenges.some(d => d.id === selectedChallenge.id);
          if (isDefault) {
              const defaultChallengeData = defaultChallenges.find(d => d.id === selectedChallenge.id);
              if (defaultChallengeData) setTestCases(defaultChallengeData.testCases.map(tc => ({ ...tc, actual: undefined, status: 'pending' })));
              return;
          }

          if (!firestore || !selectedChallenge.id) return;
          
          const testCasesCollection = collection(firestore, 'challenges', selectedChallenge.id, 'testCases');
          const testCasesSnapshot = await getDocs(testCasesCollection);
          const fetchedTestCases = testCasesSnapshot.docs.map((doc, index) => ({
              id: doc.id,
              name: `Test Case ${index + 1} ${doc.data().isHidden ? '(Hidden)' : '(Visible)'}`,
              status: 'pending',
              isHidden: doc.data().isHidden,
              input: doc.data().input,
              expected: doc.data().expectedOutput,
              actual: undefined, // Reset actual output
          })) as TestCase[];
          setTestCases(fetchedTestCases);
      }
      fetchTestCases();

    } else {
      setCode(defaultCode[language as keyof typeof defaultCode]);
      setTestCases([]);
    }
  }, [selectedChallenge, language, firestore]);
  

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    if(selectedChallenge) {
        toast({ title: "Language Changed", description: "Starter code might need to be adapted."});
    } else {
        setCode(defaultCode[value as keyof typeof defaultCode]);
    }
    setOutput('');
  };

  const handleRun = () => {
    if (!selectedChallenge) {
        toast({ variant: 'destructive', title: "No Challenge Selected", description: "Please select a coding challenge to run."});
        return;
    }
    setIsRunning(true);
    setActiveTab('test-cases');
    setOutput('Running visible test cases...');

    const visibleTestCases = testCases.filter(tc => !tc.isHidden);
    setTestCases(prev => prev.map(tc => 
      !tc.isHidden ? { ...tc, status: 'running' } : tc
    ));

    setTimeout(() => {
      setTestCases(prev => prev.map(tc => {
        if (!tc.isHidden) {
          const passed = Math.random() > 0.2;
          return { 
            ...tc, 
            status: passed ? 'passed' : 'failed',
            actual: passed ? tc.expected : `Something else (${Math.random().toString(36).substring(7)})`
          };
        }
        return tc;
      }));
      setOutput('Finished running visible tests.');
      setIsRunning(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (!selectedChallenge) {
        toast({ variant: 'destructive', title: "No Challenge Selected", description: "Please select a coding challenge to submit."});
        return;
    }
    setIsSubmitting(true);
    setActiveTab('test-cases');
    setOutput('Running all test cases...');
    setTestCases(prev => prev.map(tc => ({ ...tc, status: 'running' })));

    setTimeout(() => {
        const allPassed = Math.random() > 0.1;
        setTestCases(prev => prev.map(tc => {
            const passed = allPassed || Math.random() > 0.3;
            return {
                ...tc,
                status: passed ? 'passed' : 'failed',
                actual: passed ? tc.expected : `Some other incorrect output`
            }
        }));
        setIsSubmitting(false);
        toast({
            title: allPassed ? 'Submission Successful!' : 'Submission Failed',
            description: allPassed ? 'All test cases passed.' : 'Some test cases failed. Check results.',
            variant: allPassed ? 'default' : 'destructive',
        });
    }, 2500);
  };
  
  const handleAnalyze = () => {
    router.push(`/platform?tab=analysis&code=${encodeURIComponent(code)}&language=${language}`);
  };

   const handleDeleteRequest = (id: string, title: string) => {
      const isDefault = defaultChallenges.some(d => d.id === id);
      if (isDefault) {
           toast({
            variant: 'destructive',
            title: 'Cannot Delete',
            description: 'The default challenges cannot be deleted.',
        });
        return;
      }
      setChallengeToDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!firestore || !challengeToDelete) return;
    
    const challengeRef = doc(firestore, 'challenges', challengeToDelete.id);
    await deleteDocumentAndSubcollection(challengeRef, 'testCases');

    toast({
        title: 'Challenge Deleted',
        description: `The challenge "${challengeToDelete.title}" has been removed.`,
    });
    
    if (selectedChallengeId === challengeToDelete.id) {
        setSelectedChallengeId(defaultChallenges[0].id); // Reset to default
    }
    setChallengeToDelete(null);
  };

  if (!selectedChallengeId) {
      return (
        <div className='w-full'>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Available Challenges</CardTitle>
                    <CardDescription>Select a challenge to start coding.</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoadingChallenges ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : allChallenges.length <= defaultChallenges.length ? (
                        <Alert>
                            <List className="h-4 w-4" />
                            <AlertTitle>No New Challenges Available</AlertTitle>
                            <AlertDescription>
                                Select a default challenge below, or an admin can create a new one in the Admin tab.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                    <div className="space-y-4 mt-4">
                        {allChallenges.map((challenge) => (
                            <div key={challenge.id} className="group flex items-center gap-2">
                            <button onClick={() => setSelectedChallengeId(challenge.id)} className="w-full text-left flex-1">
                                    <Card className="hover:bg-muted/50 transition-colors">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{challenge.title}</CardTitle>
                                            <CardDescription>{challenge.description?.substring(0, 100)}...</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </button>
                                 {!defaultChallenges.some(d => d.id === challenge.id) && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteRequest(challenge.id, challenge.title)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
             <AlertDialog open={!!challengeToDelete} onOpenChange={() => setChallengeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this challenge?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            "{challengeToDelete?.title}" challenge and all of its associated test cases.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      )
  }

  return (
    <div className="flex h-full w-full flex-row p-2 gap-2">
       <div className={cn(
        "relative flex flex-col gap-2 transition-all duration-300",
        isPanelVisible ? "w-[65%]" : "w-full"
      )}>
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
                <div className='flex items-center gap-2'>
                    <span className="text-sm font-medium">Language:</span>
                    <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px] h-9">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                 <div className='flex items-center gap-2'>
                    <Button variant="outline" onClick={() => setSelectedChallengeId(null)}>
                        <List className="mr-2 h-4 w-4" /> View All Challenges
                    </Button>
                </div>
            </div>
             <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPanelVisible(!isPanelVisible)}
              >
                {isPanelVisible ? <ChevronsRight className="mr-2"/> : <ChevronsLeft className="mr-2"/>}
                {isPanelVisible ? 'Hide Panel' : 'Show Panel'}
              </Button>
        </div>
        <div className="flex-1 overflow-hidden rounded-lg relative">
            <CodeEditor code={code} onCodeChange={setCode} />
        </div>
      </div>
       <div className={cn(
        "flex flex-col gap-4 transition-all duration-300",
        isPanelVisible ? "w-[35%]" : "w-0",
        !isPanelVisible && "hidden"
      )}>
        
        <CameraFeed isEnabled={!!selectedChallengeId} />

        <Card className="flex-1 flex flex-col overflow-hidden">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                <TabsList className="m-2 grid grid-cols-2">
                    <TabsTrigger value="challenge-details">Challenge</TabsTrigger>
                    <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="challenge-details" className="p-4 m-0">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold font-headline">{selectedChallenge?.title || "No Challenge Selected"}</h3>
                            <p className='text-sm text-muted-foreground'>
                                {selectedChallenge?.description || "Please select a challenge from the dropdown to see its description and start coding."}
                            </p>
                        </div>
                    </TabsContent>
                    <TabsContent value="test-cases" className="p-4 m-0">
                        <TestCasesPanel testCases={testCases} />
                    </TabsContent>
                </div>
                 <div className="border-t p-2 flex gap-2 justify-end flex-wrap">
                    <Button variant="outline" onClick={handleRun} disabled={isRunning || isSubmitting}>
                        {isRunning ? <Loader2 className="animate-spin" /> : <Play />}
                        Run
                    </Button>
                    <Button onClick={handleSubmit} disabled={isRunning || isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                        Submit
                    </Button>
                    <Button variant="secondary" onClick={handleAnalyze} disabled={isRunning || isSubmitting}>
                        <Bot />
                        Analyze
                    </Button>
                </div>
            </Tabs>
        </Card>
      </div>

     <AlertDialog open={!!challengeToDelete} onOpenChange={() => setChallengeToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this challenge?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    "{challengeToDelete?.title}" challenge and all of its associated test cases.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}

    