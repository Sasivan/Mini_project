'use client';
import { Textarea } from '@/components/ui/textarea';

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

export default function CodeEditor({ code, onCodeChange }: CodeEditorProps) {
  return (
    <div className="relative h-full w-full bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
      <Textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="font-code h-full w-full resize-none border-0 bg-transparent p-4 text-sm text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="Write your code here..."
        spellCheck="false"
      />
    </div>
  );
}
