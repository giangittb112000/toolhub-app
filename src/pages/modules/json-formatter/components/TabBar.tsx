import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface JsonTab {
  id: string;
  name: string;
  content: string;
}

interface TabBarProps {
  tabs: JsonTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabCreate: () => void;
  onTabRename: (id: string, newName: string) => void;
  onTabClose: (id: string) => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabCreate,
  onTabRename,
  onTabClose,
}: TabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      onTabRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditingId(null);
  };

  return (
    <div className="flex items-center overflow-x-auto border-b border-white/10 bg-zinc-950/80 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: basic tab
          // biome-ignore lint/a11y/noStaticElementInteractions: basic tab element
          <div
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            onDoubleClick={() => startEditing(tab.id, tab.name)}
            className={cn(
              "group relative flex h-10 items-center min-w-[120px] max-w-[200px] border-r border-white/5 px-4 cursor-pointer select-none transition-colors",
              isActive
                ? "bg-zinc-900/80 text-white"
                : "text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300",
            )}
          >
            {/* Active Top Border Indicator */}
            {isActive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />}

            {editingId === tab.id ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none text-sm text-white"
              />
            ) : (
              <span className="truncate text-sm font-medium flex-1">{tab.name}</span>
            )}

            {!editingId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={cn(
                  "ml-2 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100",
                  tabs.length === 1 && "hidden", // Don't allow closing last tab
                )}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onTabCreate}
        className="flex h-10 w-10 items-center justify-center text-zinc-500 hover:bg-zinc-900/40 hover:text-white transition-colors border-r border-white/5"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
