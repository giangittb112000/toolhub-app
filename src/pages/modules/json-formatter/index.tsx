import { FileCode2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useJsonFormatterStore } from "@/store/json-formatter";
import { JsonEditor } from "./components/JsonEditor";
import { JsonOutput } from "./components/JsonOutput";
import { TabBar } from "./components/TabBar";

export default function JsonFormatter() {
  const { tabs, activeTabId, createTab, renameTab, closeTab, updateTabContent, setActiveTab } =
    useJsonFormatterStore();

  // Validation state per tab (kept local as it derives purely from content rapidly)
  const [parsedJsons, setParsedJsons] = useState<Record<string, unknown>>({});
  const [jsonErrors, setJsonErrors] = useState<Record<string, string | null>>({});

  const timerRef = useRef<NodeJS.Timeout>(null);

  // Initialize first tab safely
  // biome-ignore lint/correctness/useExhaustiveDependencies: Initialize once
  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, []);

  // Cleanup local validation state when tabs close
  useEffect(() => {
    const activeTabIds = new Set(tabs.map((t) => t.id));
    setParsedJsons((prev) => {
      const next = { ...prev };
      for (const id in next) {
        if (!activeTabIds.has(id)) delete next[id];
      }
      return next;
    });
    setJsonErrors((prev) => {
      const next = { ...prev };
      for (const id in next) {
        if (!activeTabIds.has(id)) delete next[id];
      }
      return next;
    });
  }, [tabs]);

  // Debounced Validation for active tab
  const activeContent = tabs.find((t) => t.id === activeTabId)?.content || "";

  useEffect(() => {
    if (!activeTabId) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (!activeContent.trim()) {
          setParsedJsons((prev) => ({ ...prev, [activeTabId]: null }));
          setJsonErrors((prev) => ({ ...prev, [activeTabId]: null }));
          return;
        }

        const parsed = JSON.parse(activeContent);
        setParsedJsons((prev) => ({ ...prev, [activeTabId]: parsed }));
        setJsonErrors((prev) => ({ ...prev, [activeTabId]: null }));

        // Auto-Format: Update tab content with stringified version
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== activeContent) {
          updateTabContent(activeTabId, formatted);
        }
      } catch (err: unknown) {
        setParsedJsons((prev) => ({ ...prev, [activeTabId]: null }));
        setJsonErrors((prev) => ({
          ...prev,
          [activeTabId]: err instanceof Error ? err.message : String(err),
        }));
      }
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeContent, activeTabId, updateTabContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] max-w-[1600px] mx-auto overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3 bg-zinc-900/50 border-b border-white/5">
        <FileCode2 className="w-6 h-6 text-purple-400" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white leading-none">
            JSON Formatter
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Validate, format, and explore deep JSON tree structures.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTab}
        onTabCreate={() => createTab("")}
        onTabRename={renameTab}
        onTabClose={closeTab}
      />

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            defaultSize={50}
            minSize={20}
            className="flex flex-col h-full bg-[#1e1e1e] relative z-10"
          >
            <JsonEditor
              value={activeContent}
              onChange={(val) => updateTabContent(activeTabId, val)}
              error={jsonErrors[activeTabId] || null}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={50}
            minSize={20}
            className="flex flex-col h-full bg-zinc-950/80 overflow-hidden"
          >
            <JsonOutput data={parsedJsons[activeTabId] || null} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
