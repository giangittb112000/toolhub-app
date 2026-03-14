import { darkStyles, JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface JsonOutputProps {
  data: unknown | null;
}

interface MatchMeta {
  element: Element;
  label: string;      // matched text
  context: string;    // surrounding text for preview
  isKey: boolean;     // is this a JSON key or value?
}

// Custom style override wrapper to support variable indents
const getTheme = (indent: number) => ({
  ...darkStyles,
  indentWidth: indent * 10,
});

/** Extract a short preview line from a mark element via parent content. */
function buildMatchMeta(mark: Element, index: number): MatchMeta {
  const parent = mark.parentElement;
  const labelClass = darkStyles.label?.split(" ")[0] ?? "";
  const isKey = !!parent?.className?.includes(labelClass);

  // Try to grab a key name from the nearest preceding sibling label
  let keyContext = "";
  let el: Element | null = mark.parentElement;
  for (let depth = 0; depth < 6 && el; depth++) {
    const prevSib = el.previousElementSibling;
    if (prevSib?.className?.includes(labelClass)) {
      keyContext = prevSib.textContent?.replace(/[":\s]/g, "").trim() ?? "";
      break;
    }
    el = el.parentElement;
  }

  const matchedText = mark.textContent ?? "";
  const parentText = parent?.textContent ?? matchedText;
  const trimmed = parentText.length > 48 ? `${parentText.substring(0, 45)}…` : parentText;

  const context = keyContext && !isKey ? `${keyContext}: ${trimmed}` : trimmed;

  return { element: mark, label: matchedText, context, isKey };
}

export function JsonOutput({ data }: JsonOutputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [indentSize, setIndentSize] = useState(2);
  const [matches, setMatches] = useState<Element[]>([]);
  const [matchMetas, setMatchMetas] = useState<MatchMeta[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Dropdown state
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownIdx, setDropdownIdx] = useState(-1); // keyboard cursor in dropdown

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const showDropdown = isFocused && searchTerm.trim().length > 0 && matchMetas.length > 0;

  // ── Highlight engine ────────────────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: DOM operations via ref
  useEffect(() => {
    if (!containerRef.current) return;

    // Remove all previous highlights
    const marks = containerRef.current.querySelectorAll("mark.search-highlight");
    marks.forEach((mark: Element) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });

    setMatches([]);
    setMatchMetas([]);
    setCurrentMatchIndex(-1);
    setDropdownIdx(-1);

    if (!searchTerm.trim()) return;

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    );

    const foundElements: Element[] = [];
    const lowerTerm = searchTerm.toLowerCase();
    const matchesList: { node: Text; index: number; matchText: string }[] = [];

    let node: Node | null = walker.nextNode();
    while (node) {
      if (
        node.nodeValue &&
        node.parentElement &&
        !node.parentElement.closest(".search-toolbar")
      ) {
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

    matchesList.forEach(({ node: textNode, index, matchText }, i) => {
      const parent = textNode.parentNode;
      if (!parent) return;

      const mark = document.createElement("mark");
      mark.className =
        i === 0 ? "search-highlight search-highlight-active" : "search-highlight";
      mark.textContent = textNode.nodeValue!.substring(index, index + matchText.length);

      parent.insertBefore(document.createTextNode(textNode.nodeValue!.substring(0, index)), textNode);
      parent.insertBefore(mark, textNode);
      parent.insertBefore(document.createTextNode(textNode.nodeValue!.substring(index + matchText.length)), textNode);
      parent.removeChild(textNode);

      foundElements.push(mark);
    });

    const metas = foundElements.map((el, i) => buildMatchMeta(el, i));

    setMatches(foundElements);
    setMatchMetas(metas);

    if (foundElements.length > 0) {
      setCurrentMatchIndex(0);
      foundElements[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data, searchTerm, isExpanded]);

  // ── Click outside → close dropdown ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const activateMatch = (nextEl: Element, prevEl?: Element) => {
    if (prevEl) prevEl.classList.remove("search-highlight-active");
    nextEl.classList.add("search-highlight-active");
    nextEl.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const jumpToIndex = (idx: number) => {
    if (idx < 0 || idx >= matches.length) return;
    const prevEl = currentMatchIndex >= 0 ? matches[currentMatchIndex] : undefined;
    setCurrentMatchIndex(idx);
    activateMatch(matches[idx], prevEl);
  };

  const handleNextMatch = () => jumpToIndex((currentMatchIndex + 1) % matches.length);
  const handlePrevMatch = () =>
    jumpToIndex((currentMatchIndex - 1 + matches.length) % matches.length);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIdx((i) => Math.min(i + 1, matchMetas.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsFocused(false);
        return;
      }
      if (e.key === "Enter" && dropdownIdx >= 0) {
        e.preventDefault();
        jumpToIndex(dropdownIdx);
        setIsFocused(false);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.shiftKey ? handlePrevMatch() : handleNextMatch();
    }
  };

  // ── Dropdown item click ────────────────────────────────────────────────────
  const handleDropdownSelect = (idx: number) => {
    jumpToIndex(idx);
    setIsFocused(false);
    inputRef.current?.focus();
  };

  // ── Scroll active dropdown item into view ──────────────────────────────────
  useEffect(() => {
    if (dropdownIdx < 0 || !dropdownRef.current) return;
    const item = dropdownRef.current.querySelector(`[data-dropdown-idx="${dropdownIdx}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [dropdownIdx]);

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
      <div className="search-toolbar flex-wrap flex gap-2 items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1e1e1e]">

        {/* Search input + dropdown */}
        <div ref={searchWrapRef} className="flex items-center gap-2 flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-2 z-10 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search keys or values… (↑↓ in list, Enter to jump)"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setDropdownIdx(-1); }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            className="bg-zinc-900 border border-white/10 rounded overflow-hidden text-xs w-full outline-none text-zinc-300 placeholder-zinc-600 py-1.5 pl-8 pr-3 focus:ring-1 focus:ring-blue-500/50"
          />

          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setSearchTerm(""); inputRef.current?.focus(); }}
              className="absolute right-2 text-zinc-600 hover:text-zinc-300 transition-colors"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Match counter + nav arrows */}
          {searchTerm && (
            <div className="flex items-center gap-1 ml-3 shrink-0">
              <span className="text-xs text-zinc-500">
                {matches.length > 0
                  ? `${currentMatchIndex + 1} / ${matches.length}`
                  : "0 matches"}
              </span>
              {matches.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    title="Previous match (Shift+Enter)"
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMatch}
                    title="Next match (Enter)"
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Suggestions dropdown ──────────────────────────────────────── */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-full max-h-64 overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-50"
            >
              {matchMetas.map((meta, i) => (
                <button
                  key={`match-${i}`}
                  type="button"
                  data-dropdown-idx={i}
                  onMouseDown={(e) => { e.preventDefault(); handleDropdownSelect(i); }}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors border-b border-white/5 last:border-0 ${
                    i === dropdownIdx
                      ? "bg-orange-500/20 text-zinc-100"
                      : i === currentMatchIndex
                        ? "bg-blue-500/10 text-zinc-200"
                        : "hover:bg-white/5 text-zinc-400"
                  }`}
                >
                  {/* Index badge */}
                  <span className="shrink-0 mt-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded min-w-[2rem] text-center">
                    #{i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Key / Value badge + matched text */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded ${
                          meta.isKey
                            ? "bg-teal-500/20 text-teal-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {meta.isKey ? "key" : "val"}
                      </span>
                      <span className="text-xs font-mono text-orange-300 truncate">
                        {meta.label}
                      </span>
                    </div>

                    {/* Context preview */}
                    <p className="text-[10px] text-zinc-600 truncate font-mono">
                      {meta.context}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex flex-wrap items-center gap-3">
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
           .search-highlight {
             background-color: rgba(234, 179, 8, 0.4);
             color: #fff;
             border-radius: 2px;
             padding: 0 2px;
             transition: background-color 0.15s;
           }
           .search-highlight-active {
             background-color: rgba(249, 115, 22, 0.75) !important;
             color: #fff !important;
             border-radius: 2px;
             outline: 2px solid rgba(249, 115, 22, 0.9);
             outline-offset: 1px;
           }

           .custom-indent-2 .${darkStyles.childFieldsContainer} { padding-left: 14px !important; border-left: 1px dotted rgba(255,255,255,0.1); margin-left: 2px; }
           .custom-indent-4 .${darkStyles.childFieldsContainer} { padding-left: 28px !important; border-left: 1px dotted rgba(255,255,255,0.1); margin-left: 2px; }
           .custom-indent-8 .${darkStyles.childFieldsContainer} { padding-left: 56px !important; border-left: 1px dotted rgba(255,255,255,0.1); margin-left: 2px; }

           .${darkStyles.label} { color: #81b5ac !important; font-weight: 600; }
           .${darkStyles.stringValue} { color: #a6e22e !important; }
           .${darkStyles.numberValue} { color: #fd971f !important; }
           .${darkStyles.booleanValue} { color: #ae81ff !important; font-style: italic; }
           .${darkStyles.nullValue} { color: #f92672 !important; font-weight: bold; }
           .${darkStyles.undefinedValue} { color: #f92672 !important; }
           .${darkStyles.punctuation} { color: #88846f !important; }
        `}</style>
        {Object.keys(data as object).length > 0 ? (
          <JsonView
            data={data}
            shouldExpandNode={() => isExpanded}
            style={getTheme(indentSize)}
          />
        ) : (
          <div className="text-zinc-500 italic mt-4 ml-4">Tree empty.</div>
        )}
      </div>
    </div>
  );
}
