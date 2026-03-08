import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
}

export function JsonEditor({ value, onChange, error }: JsonEditorProps) {
  const [lines, setLines] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines(value.split("\n").length);
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = `${value.substring(0, start)}  ${value.substring(end)}`;
      onChange(newValue);

      // Async reset cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 border-r border-white/5 relative group">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="w-12 py-4 flex-shrink-0 bg-zinc-900/50 border-r border-white/5 text-right pr-3 select-none overflow-hidden text-zinc-600 font-mono text-xs leading-6"
      >
        {Array.from({ length: Math.max(lines, 30) }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: line numbers are naturally indexed
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        spellCheck="false"
        className={cn(
          "flex-1 h-full bg-transparent text-zinc-300 font-mono text-xs leading-6 p-4 resize-none focus:outline-none placeholder-zinc-700 whitespace-pre",
          error && "ring-1 ring-inset ring-red-500/50 bg-red-500/5",
        )}
        placeholder="Paste your JSON here..."
      />

      {/* Error Overlay */}
      {error && (
        <div className="absolute bottom-4 left-16 right-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-lg p-3 flex items-start gap-3 shadow-lg max-h-32 overflow-y-auto z-10">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-red-400 font-mono text-xs leading-relaxed whitespace-pre-wrap flex-1">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
