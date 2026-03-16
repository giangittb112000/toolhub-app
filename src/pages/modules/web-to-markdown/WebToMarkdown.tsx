import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  FileText,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Code2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IPC_CHANNELS } from "@/constants/ipc-channels";

import Defuddle from "defuddle";
import TurndownService from "turndown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function WebToMarkdown() {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"raw" | "visual">("visual");

  const validateUrl = (value: string) => {
    try {
      new URL(value);
      setIsValidUrl(true);
      return true;
    } catch {
      setIsValidUrl(false);
      return false;
    }
  };

  const normalizeDoc = (doc: Document, baseUrl: string) => {
    // 1. Handle Images
    const images = doc.querySelectorAll("img");
    images.forEach((img) => {
      // Swap common lazy-loading attributes
      const lazyAttrs = [
        "data-src",
        "lazy-src",
        "data-original",
        "data-lazy",
        "data-actual-src",
      ];
      for (const attr of lazyAttrs) {
        const val = img.getAttribute(attr);
        if (val) {
          img.setAttribute("src", val);
          break;
        }
      }

      const currentSrc = img.getAttribute("src");
      if (currentSrc) {
        try {
          img.setAttribute("src", new URL(currentSrc, baseUrl).href);
        } catch (e) {}
      }
    });

    // 2. Handle Links
    const links = doc.querySelectorAll("a");
    links.forEach((a) => {
      const currentHref = a.getAttribute("href");
      if (currentHref && !currentHref.startsWith("#")) {
        try {
          a.setAttribute("href", new URL(currentHref, baseUrl).href);
        } catch (e) {}
      }
    });

    // 3. Remove known junk (Be less aggressive, let Defuddle handle core semantics)
    const junkSelectors = [
      ".ads", ".advertisement",
      "script", "style", "noscript", "iframe", "button", ".social-share",
      ".related-posts", "#comments"
    ];
    junkSelectors.forEach(sel => {
      doc.querySelectorAll(sel).forEach(el => el.remove());
    });
  };

  const generateFrontmatter = (data: {
    title: string;
    author: string | null;
    date?: string;
    domain: string;
    url: string;
  }) => {
    const lines = ["---"];
    lines.push(`title: "${data.title.replace(/"/g, '\\"')}"`);
    if (data.author) lines.push(`author: "${data.author.replace(/"/g, '\\"')}"`);
    if (data.date) lines.push(`published: ${data.date}`);
    lines.push(`domain: ${data.domain}`);
    lines.push(`source: ${data.url}`);
    lines.push("---");
    return lines.join("\n");
  };

  const handleConvert = async () => {
    if (!validateUrl(url)) return;

    setIsLoading(true);
    setError(null);
    setMarkdown("");
    setAuthor(null);

    try {
      // 1. Fetch HTML via backend renderer
      console.time("[WebToMd] IPC Backend Request");
      const proxyResult = (await window.electron.invoke(
        IPC_CHANNELS.WEB_TO_MD.CONVERT,
        { url },
      )) as {
        success: boolean;
        html?: string;
        error?: string;
      };
      console.timeEnd("[WebToMd] IPC Backend Request");

      if (!proxyResult.success) {
        throw new Error(
          proxyResult.error || "Failed to render webpage content.",
        );
      }

      const html = proxyResult.html || "";

      // 2. Parse and Normalize HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      normalizeDoc(doc, url);

      // 3. Extract content with Defuddle
      // We set removeLowScoring to false to be more inclusive of sections like testimonials 
      // that might otherwise be filtered out as "widgets"
      const defuddle = new Defuddle(doc, { 
        url,
        removeLowScoring: false 
      });
      const result = await defuddle.parseAsync();

      // 4. Advanced Metadata Extraction
      const domain = new URL(url).hostname;
      const metaDate = doc.querySelector('meta[property="article:published_time"]') || 
                       doc.querySelector('meta[name="publish-date"]') ||
                       doc.querySelector('meta[name="date"]');
      const publishedDate = metaDate?.getAttribute("content")?.split("T")[0] || result.published;

      // 5. Convert to Markdown with Turndown
      const turndown = new TurndownService({
        headingStyle: "atx",
        hr: "---",
        bulletListMarker: "-",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
        strongDelimiter: "**",
      });

      // GFM-like configuration
      turndown.addRule("fencedCodeBlock", {
        filter: ["pre"],
        replacement: function (content, node) {
          const code = node.querySelector("code");
          const language = code?.className?.match(/language-(\w+)/)?.[1] || "";
          return "\n\n```" + language + "\n" + content.trim() + "\n```\n\n";
        },
      });

      const rawMd = turndown.turndown(result.content || "");
      
      // 6. Final Assembly with Frontmatter
      const frontmatter = generateFrontmatter({
        title: result.title || doc.title || "Untitled Page",
        author: result.author || null,
        date: publishedDate || undefined,
        domain: domain,
        url: url
      });

      const finalMd = `${frontmatter}\n\n${rawMd}`;

      setMarkdown(finalMd);
      setTitle(result.title || doc.title || "Untitled Page");
      setAuthor(result.author || null);
    } catch (err: any) {
      setError(err.message || "An error occurred during conversion.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-zinc-900 border-white/5 hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 leading-none">
              <Globe className="w-6 h-6 text-orange-500" />
              Web to Markdown
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Convert any webpage into clean, AI-ready Markdown content.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Input */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-auto custom-scrollbar pr-2">
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">
                Website URL
              </label>
              <div className="relative">
                <Globe
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${!isValidUrl ? "text-red-500" : "text-zinc-500"}`}
                />
                <Input
                  placeholder="https://example.com/article"
                  className={`pl-12 h-14 bg-zinc-950/50 border-white/10 rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/30 transition-all ${!isValidUrl ? "border-red-500/50" : ""}`}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (!isValidUrl) validateUrl(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConvert()}
                />
              </div>
              {!isValidUrl && (
                <p className="text-xs text-red-500 font-medium px-4 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please enter a valid URL including http:// or https://
                </p>
              )}
            </div>

            <Button
              className="w-full h-12 rounded-2xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.2)] disabled:opacity-50"
              onClick={handleConvert}
              disabled={isLoading || !url}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to Markdown"
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">
              Tips
            </h3>
            <ul className="space-y-3 text-xs text-zinc-500">
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5" />
                <span>
                  Works best with articles, blog posts, and documentation.
                </span>
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5" />
                <span>
                  Generated Markdown is perfect for ChatGPT, Claude, and Gemini
                  context.
                </span>
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5" />
                <span>Large pages might take a few seconds to process.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-8 h-full overflow-hidden">
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl h-full min-h-[500px] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
              <div className="flex items-center gap-4">
                <div className="flex bg-zinc-950/80 rounded-lg p-0.5 border border-white/5 shadow-inner">
                  <button
                    onClick={() => setPreviewMode("visual")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      previewMode === "visual"
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visual
                  </button>
                  <button
                    onClick={() => setPreviewMode("raw")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      previewMode === "raw"
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Raw MD
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-zinc-200">
                    {isLoading
                      ? "Processing..."
                      : markdown
                        ? previewMode === "visual"
                          ? "Visual Preview"
                          : "Markdown Source"
                        : "Output Area"}
                  </span>
                </div>
              </div>
              {markdown && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg bg-zinc-950/50 border-white/10 hover:bg-zinc-800 gap-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Copy Content"}
                </Button>
              )}
            </div>

            <div className="flex-1 relative p-6 overflow-auto custom-scrollbar group">
              {markdown ? (
                <div className="space-y-4 animate-in fade-in duration-700">
                  {title && (
                    <div className="pb-4 border-b border-white/5 mb-4 group-hover:border-orange-500/20 transition-colors">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">
                        Extracted Title
                      </span>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {title}
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-600 hover:text-orange-500 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </h2>
                      {author && (
                        <p className="text-xs text-orange-500/80 font-medium mt-1">
                          By {author}
                        </p>
                      )}
                    </div>
                  )}

                  {previewMode === "raw" ? (
                    <pre className="whitespace-pre-wrap text-zinc-300 font-mono text-sm leading-relaxed selection:bg-orange-500/30">
                      {markdown}
                    </pre>
                  ) : (
                    <div
                      className="prose prose-invert prose-zinc max-w-none 
                        prose-headings:font-bold prose-headings:text-zinc-100 prose-headings:tracking-tight
                        prose-h1:text-3xl prose-h1:mb-8 prose-h1:border-b prose-h1:border-zinc-800 prose-h1:pb-4
                        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-zinc-800/50 prose-h2:pb-2
                        prose-p:text-zinc-400 prose-p:leading-7 prose-p:mb-6
                        prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:border prose-img:border-zinc-800 prose-img:shadow-2xl prose-img:my-8 prose-img:mx-auto prose-img:max-h-[600px] prose-img:object-contain bg-zinc-950/20
                        prose-code:text-orange-300 prose-code:bg-zinc-950/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:border prose-code:border-white/5
                        prose-pre:bg-zinc-950/80 prose-pre:border prose-pre:border-white/5 prose-pre:p-4 prose-pre:rounded-xl
                        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6
                        prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6
                        prose-li:text-zinc-400 prose-li:mb-2
                        prose-blockquote:border-l-4 prose-blockquote:border-orange-500/50 prose-blockquote:bg-orange-500/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-zinc-300
                      "
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              onClick={(e) => e.preventDefault()}
                              className="text-orange-500 hover:text-orange-400 no-underline cursor-default"
                            />
                          ),
                          img: ({ node, ...props }) => (
                            <img
                              {...props}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="rounded-xl border border-zinc-800 shadow-2xl my-8 mx-auto max-h-[600px] object-contain bg-zinc-950/20"
                            />
                          ),
                        }}
                      >
                        {markdown}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-orange-500/20" />
                  <p className="text-sm font-bold animate-pulse text-zinc-400">
                    Rendering & extracting content...
                  </p>
                  <p className="text-[10px] text-zinc-600 max-w-[200px] text-center">
                    We're executing JavaScript to ensure all SPA content is
                    fully loaded.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                  <div className="p-6 bg-zinc-950/30 rounded-full">
                    <FileText className="w-12 h-12" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-wider">
                      No content to show
                    </p>
                    <p className="text-xs max-w-[200px] mt-1">
                      Enter a URL on the left and click convert to see the
                      magic.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
