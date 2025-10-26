import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilePlus, Code, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center font-headline">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <FilePlus className="h-6 w-6 text-primary" />
              Manage Quizzes
            </CardTitle>
            <CardDescription>
              Create new quizzes and add multiple-choice questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/create-quiz">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Code className="h-6 w-6 text-primary" />
              Manage Coding Challenges
            </CardTitle>
            <CardDescription>
              Create new coding challenges and define their test cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/create-challenge">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Challenge
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
