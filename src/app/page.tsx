
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Code, TestTube, BarChart } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <Code className="h-8 w-8 text-primary" />,
    title: 'Interactive IDE',
    description: 'Solve coding challenges in our feature-rich IDE with instant feedback on your solutions.',
    href: '/platform?tab=ide',
    image: PlaceHolderImages.find(img => img.id === 'feature-ide'),
  },
  {
    icon: <TestTube className="h-8 w-8 text-primary" />,
    title: 'Knowledge Quizzes',
    description: 'Test your understanding of programming concepts with our interactive multiple-choice quizzes.',
    href: '/platform?tab=quiz',
    image: PlaceHolderImages.find(img => img.id === 'feature-quiz'),
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Analysis',
    description: 'Get detailed, AI-driven feedback on your code submissions to improve quality and learn best practices.',
    href: '/platform?tab=analysis',
    image: PlaceHolderImages.find(img => img.id === 'feature-analysis'),
  },
];

export default function HomePage() {
  const heroBg = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gray-900 text-white">
            {heroBg && (
                <Image
                    src={heroBg.imageUrl}
                    alt={heroBg.description}
                    data-ai-hint={heroBg.imageHint}
                    fill
                    className="absolute inset-0 object-cover opacity-20"
                />
            )}
          <div className="container mx-auto px-4 text-center relative">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 text-shadow-lg">
              Welcome to CodeAssist
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground text-white/80">
              An intelligent online platform designed to help you practice coding,
              test your knowledge, and get instant, AI-powered feedback to
              accelerate your learning journey.
            </p>
            <Button asChild size="lg" className="mt-8 font-bold">
              <Link href="/platform">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">
                Core Features
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                Everything you need to level up your coding skills.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col overflow-hidden transition-transform transform hover:-translate-y-2 hover:shadow-xl">
                  {feature.image && (
                      <div className="relative h-48 w-full">
                        <Image
                            src={feature.image.imageUrl}
                            alt={feature.image.description}
                            data-ai-hint={feature.image.imageHint}
                            fill
                            className="object-cover"
                        />
                      </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-4">
                        {feature.icon}
                        <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                  <div className="p-6 pt-0">
                     <Button asChild variant="outline" className="w-full">
                        <Link href={feature.href}>
                            Go to {feature.title} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
