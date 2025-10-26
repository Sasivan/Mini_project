interface OutputPanelProps {
  output: string;
}

export default function OutputPanel({ output }: OutputPanelProps) {
  return (
    <div className="h-full w-full">
      <h3 className="text-lg font-semibold mb-2 font-headline">Output</h3>
      <div className="bg-gray-900 dark:bg-black text-white p-4 rounded-md h-full overflow-y-auto">
        <pre className="font-code text-sm whitespace-pre-wrap">{output || "Run your code to see the output here."}</pre>
      </div>
    </div>
  );
}
