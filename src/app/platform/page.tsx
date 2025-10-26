
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IdeLayout from '@/components/ide/ide-layout';
import QuizClient from '@/components/quiz/quiz-client';
import AnalysisClient from '@/components/analysis/analysis-client';
import AdminPage from '@/app/admin/page';
import { useRouter } from 'next/navigation';

function PlatformPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') || 'ide';

  const onTabChange = (value: string) => {
    router.push(`/platform?tab=${value}`);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ide">IDE</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="ide" className="h-[calc(100vh-12rem)]">
          <IdeLayout />
        </TabsContent>
        <TabsContent value="quiz" className="mt-8">
          <h1 className="text-4xl font-bold mb-8 text-center font-headline">
            Test Your Knowledge
          </h1>
          <QuizClient />
        </TabsContent>
        <TabsContent value="analysis">
          <AnalysisClient />
        </TabsContent>
        <TabsContent value="admin">
          <AdminPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PlatformPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PlatformPageContent />
        </Suspense>
    )
}
