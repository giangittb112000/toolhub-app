import { darkStyles, JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface JsonOutputProps {
  data: unknown | null;
}

// Custom style override wrapper to support variable indents
const getTheme = (indent: number) => ({
  ...darkStyles,
  indentWidth: indent * 10,
});

export function JsonOutput({ data }: JsonOutputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [indentSize, setIndentSize] = useState(2);
  const [matches, setMatches] = useState<Element[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger DOM search and highlight overlay whenever data or term changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: DOM operations via ref
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous marks
    const marks = containerRef.current.querySelectorAll("mark.search-highlight");
    // Using simple approach: unwrap marks
    marks.forEach((mark: Element) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });

    setMatches([]);
    setCurrentMatchIndex(-1);

    if (!searchTerm.trim()) return;

    // Use TreeWalker to find all text nodes in the JSON Viewer
    const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);

    const foundElements: Element[] = [];
    let node: Node | null;
    const lowerTerm = searchTerm.toLowerCase();

    // Collect matching text nodes first so we don't mutate DOM while walking
    const matchesList: { node: Text; index: number; matchText: string }[] = [];

    node = walker.nextNode();
    while (node) {
      if (node.nodeValue && node.parentElement && !node.parentElement.closest(".search-toolbar")) {
        const idx = node.nodeValue.toLowerCase().indexOf(lowerTerm);
        if (idx >= 0) {
          matchesList.push({
            node: node as Text,
            index: idx,
            matchText: node.nodeValue.substring(idx, idx + lowerTerm.length),
          });
        }
      }
      node = walker.nextNode();
    }

    // Apply highligts
    matchesList.forEach(({ node: textNode, index, matchText }) => {
      const parent = textNode.parentNode;
      if (!parent) return;

      const mark = document.createElement("mark");
      mark.className = "search-highlight bg-yellow-500/50 text-white rounded-sm px-0.5";
      mark.textContent = textNode.nodeValue!.substring(index, index + matchText.length);

      const prefix = textNode.nodeValue!.substring(0, index);
      const suffix = textNode.nodeValue!.substring(index + matchText.length);

      parent.insertBefore(document.createTextNode(prefix), textNode);
      parent.insertBefore(mark, textNode);
      parent.insertBefore(document.createTextNode(suffix), textNode);
      parent.removeChild(textNode);

      foundElements.push(mark);
    });

    setMatches(foundElements);
    if (foundElements.length > 0) {
      setCurrentMatchIndex(0);
      focusMatch(foundElements[0]);
    }
  }, [data, searchTerm, isExpanded]); // Re-run when expanded tree changes

  const focusMatch = (el: Element) => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Flash effect
    el.classList.add("ring-2", "ring-blue-500");
    setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 1000);
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    focusMatch(matches[nextIdx]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleNextMatch();
  };

  if (!data) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-600 text-sm bg-[#1e1e1e]">
        Waiting for valid JSON...
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="search-toolbar flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1e1e1e]">
        <div className="flex items-center gap-2 flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-2" />
          <input
            type="text"
            placeholder="Search keys or values (Enter to navigate)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-zinc-900 border border-white/10 rounded overflow-hidden text-xs w-80 outline-none text-zinc-300 placeholder-zinc-600 py-1.5 pl-8 pr-3 focus:ring-1 focus:ring-blue-500/50"
          />
          {searchTerm && (
            <span className="text-xs text-zinc-500 ml-3">
              {matches.length > 0
                ? `${currentMatchIndex + 1} / ${matches.length} Matches`
                : "0 Matches"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Indent:</span>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
              className="bg-zinc-900 border border-white/10 rounded py-1 px-2 text-zinc-300 text-xs outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
              <option value={8}>8 Spaces</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded transition-colors"
          >
            {isExpanded ? "Collapse All Nodes" : "Expand All Nodes"}
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto p-4 text-xs font-mono relative custom-indent-${indentSize}`}
      >
        <style>{`
           /* Fix json-view-lite custom variables to work with container height */
           .search-highlight {
              transition: box-shadow 0.2s;
           }

           /* Override react-json-view-lite nested paddings for dynamic Indent Sizes */
           .custom-indent-2 .${darkStyles.childFieldsContainer} { padding-left: 14px !important; border-left: 1px dotted rgba(255,255,255,0.1); margin-left: 2px; }
           .custom-indent-4 .${darkStyles.childFieldsContainer} { padding-left: 28px !important; border-left: 1px dotted rgba(255,255,255,0.1); margin-left: 2px; }
           .custom-indent-8 .${darkStyles.childFieldsContainer} { padding-left: 56px !important; border-left: 1px dotted rgba(255,255,255,0.1); margin-left: 2px; }

           /* High Contrast Theme Overrides */
           .${darkStyles.label} { color: #81b5ac !important; font-weight: 600; }
           .${darkStyles.stringValue} { color: #a6e22e !important; }
           .${darkStyles.numberValue} { color: #fd971f !important; }
           .${darkStyles.booleanValue} { color: #ae81ff !important; font-style: italic; }
           .${darkStyles.nullValue} { color: #f92672 !important; font-weight: bold; }
           .${darkStyles.undefinedValue} { color: #f92672 !important; }
           .${darkStyles.punctuation} { color: #88846f !important; }
        `}</style>
        {Object.keys(data).length > 0 ? (
          <JsonView data={data} shouldExpandNode={() => isExpanded} style={getTheme(indentSize)} />
        ) : (
          <div className="text-zinc-500 italic mt-4 ml-4">Tree empty.</div>
        )}
      </div>
    </div>
  );
}
