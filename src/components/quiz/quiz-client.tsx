
'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '../ui/progress';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { List, Trash2, CameraOff, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteDocumentAndSubcollection } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import CameraFeed from '../proctoring/camera-feed';


type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

type Quiz = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const defaultQuiz: Quiz = {
    id: 'default-js-basics',
    title: 'JavaScript Basics',
    description: 'A few questions to test your basic knowledge of JavaScript.',
    questions: [
        { id: 'q1', text: 'What does "typeof" operator do in JavaScript?', options: ['Returns a string indicating the type of the unevaluated operand', 'Returns the data type of a variable', 'Converts a variable to a string', 'Checks if a variable is defined'], correctAnswerIndex: 0 },
        { id: 'q2', text: 'Which of the following is NOT a primitive data type in JavaScript?', options: ['String', 'Number', 'Object', 'Boolean'], correctAnswerIndex: 2 },
        { id: 'q3', text: 'What is the result of `2 + "2"` in JavaScript?', options: ['"22"', '4', 'TypeError', '"4"'], correctAnswerIndex: 0 },
        { id: 'q4', text: 'How do you declare a constant variable in JavaScript?', options: ['var', 'let', 'const', 'constant'], correctAnswerIndex: 2 },
        { id: 'q5', text: 'What is a closure in JavaScript?', options: ['A function having access to the parent scope, even after the parent function has closed.', 'A way to lock variables', 'A type of loop', 'A specific class in JS'], correctAnswerIndex: 0 },
    ]
}

const QuizSelection = ({ quizzes, quizzesFromDb, onSelectQuiz, onDeleteQuiz, isLoading }: { quizzes: any[], quizzesFromDb: any[] | null, onSelectQuiz: (id: string) => void, onDeleteQuiz: (id: string, title: string) => void, isLoading: boolean }) => (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Available Quizzes</CardTitle>
            <CardDescription>Select a quiz to test your knowledge.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : quizzes.length <= 1 && (!quizzesFromDb || quizzesFromDb.length === 0) ? (
                 <Alert>
                    <List className="h-4 w-4" />
                    <AlertTitle>No New Quizzes Available</AlertTitle>
                    <AlertDescription>
                        Select the default quiz below, or an admin can create a new one in the Admin tab.
                    </AlertDescription>
                </Alert>
            ) : null }
             <div className="space-y-4 mt-4">
                {quizzes.map((quiz) => (
                    <div key={quiz.id} className="group flex items-center gap-2">
                        <button onClick={() => onSelectQuiz(quiz.id)} className="w-full text-left flex-1">
                            <Card className="hover:bg-muted/50 transition-colors">
                                <CardHeader>
                                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                                    <CardDescription>{quiz.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </button>
                        {quiz.id !== 'default-js-basics' && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => onDeleteQuiz(quiz.id, quiz.title)}
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
);

const QuizInProgress = ({ quiz, onRestart }: { quiz: Quiz, onRestart: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setScore(null);
  }, [quiz]);

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    let newScore = 0;
    quiz.questions.forEach((q, index) => {
      const selectedOption = selectedAnswers[index];
      const selectedIndex = q.options.indexOf(selectedOption);
      if (selectedIndex === q.correctAnswerIndex) {
        newScore++;
      }
    });
    setScore(newScore);
  };
  
  if (score !== null) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                 <CameraFeed isEnabled={false} />
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Quiz Results for {quiz.title}</CardTitle>
                        <CardDescription>
                            You scored {score} out of {quiz.questions.length}!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="text-center">
                        <p className="text-5xl font-bold">
                        {Math.round((score / quiz.questions.length) * 100)}%
                        </p>
                    </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button onClick={onRestart} className="w-full">
                            Back to Quizzes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
             <CameraFeed isEnabled={score === null} />
        </div>
         <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="sm" onClick={onRestart}>Back</Button>
                        <Progress value={progress} className="w-full" />
                    </div>
                    <CardTitle className="text-2xl font-headline">
                    {quiz.title}: Question {currentQuestion + 1}
                    </CardTitle>
                    <CardDescription className="text-lg pt-2">{question.text}</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                    value={selectedAnswers[currentQuestion] || ''}
                    onValueChange={handleAnswerSelect}
                    className="space-y-4"
                    >
                    {question.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3 rounded-md border p-4 has-[[data-state=checked]]:border-primary">
                        <RadioGroupItem value={option} id={`q${currentQuestion}-o${index}`} />
                        <Label htmlFor={`q${currentQuestion}-o${index}`} className="flex-1 cursor-pointer">{option}</Label>
                        </div>
                    ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-end">
                    {currentQuestion < quiz.questions.length - 1 ? (
                    <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestion]}>
                        Next
                    </Button>
                    ) : (
                    <Button onClick={handleSubmit} disabled={!selectedAnswers[currentQuestion]}>
                        Submit Quiz
                    </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    </div>
  );
};

export default function QuizClient() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<{id: string, title: string} | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const quizzesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'quizzes');
  }, [firestore]);

  const { data: quizzesFromDb, isLoading: isLoadingQuizzes } = useCollection(quizzesQuery);
  
  const allQuizzes = useMemo(() => {
      if (!quizzesFromDb) return [defaultQuiz];
      const dbQuizzes = quizzesFromDb || [];
      const defaultQuizExistsInDb = dbQuizzes.some(q => q.title === defaultQuiz.title);
      return defaultQuizExistsInDb ? dbQuizzes : [defaultQuiz, ...dbQuizzes];
  }, [quizzesFromDb]);

  const handleSelectQuiz = async (quizId: string) => {
    setIsLoadingQuiz(true);
    if (!firestore) return;
    
    if (quizId === 'default-js-basics') {
        setSelectedQuiz(defaultQuiz);
        setIsLoadingQuiz(false);
        return;
    }

    const selected = allQuizzes?.find(q => q.id === quizId);
    if (!selected) return;

    const questionsCollection = collection(firestore, 'quizzes', quizId, 'questions');
    const questionsSnapshot = await getDocs(questionsCollection);
    const fetchedQuestions = questionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    })) as Question[];

    setSelectedQuiz({ ...selected, questions: fetchedQuestions });
    setIsLoadingQuiz(false);
  };
  
  const handleRestart = () => {
    setSelectedQuiz(null);
  };

  const handleDeleteRequest = (id: string, title: string) => {
      setQuizToDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
      if (!firestore || !quizToDelete) return;
      
      const quizRef = doc(firestore, 'quizzes', quizToDelete.id);
      await deleteDocumentAndSubcollection(quizRef, 'questions');

      toast({
          title: 'Quiz Deleted',
          description: `The quiz "${quizToDelete.title}" has been successfully removed.`,
      });

      setQuizToDelete(null);
  };

  if (isLoadingQuiz) {
    return <Card className="max-w-2xl mx-auto"><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
  }

  if (selectedQuiz) {
    return <QuizInProgress quiz={selectedQuiz} onRestart={handleRestart} />;
  }

  return (
    <>
        <QuizSelection quizzes={allQuizzes || []} quizzesFromDb={quizzesFromDb} onSelectQuiz={handleSelectQuiz} onDeleteQuiz={handleDeleteRequest} isLoading={isLoadingQuizzes} />
        <AlertDialog open={!!quizToDelete} onOpenChange={() => setQuizToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        `&quot;{quizToDelete?.title}&quot;` quiz and all of its questions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
