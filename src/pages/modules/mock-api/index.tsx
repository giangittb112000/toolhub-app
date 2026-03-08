import type { CreateEndpointDto, HttpMethod, MockEndpoint, UpdateEndpointDto } from "@shared/index";
import { Activity, Copy, Edit2, Power, Save, Settings2, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { darkStyles, JsonView } from "react-json-view-lite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IPC_CHANNELS } from "@/constants/ipc-channels";
import "react-json-view-lite/dist/index.css";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function MockApi() {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [port, setPort] = useState(3001);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/example");
  const [statusCode, setStatusCode] = useState("200");
  const [delay, setDelay] = useState("0");
  const [description, setDescription] = useState("");
  const [responseBody, setResponseBody] = useState('{\n  "message": "Hello World"\n}');

  // Json Validation State
  const [parsedJson, setParsedJson] = useState<unknown | null>({
    message: "Hello World",
  });
  const [jsonError, setJsonError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout>(null);

  const loadEndpoints = useCallback(async () => {
    try {
      const data = (await window.electron.invoke(IPC_CHANNELS.MOCK_API.LIST)) as MockEndpoint[];
      setEndpoints(data);
      const portData = (await window.electron.invoke(IPC_CHANNELS.MOCK_API.GET_PORT)) as {
        port: number;
      };
      setPort(portData.port);
      const statusData = (await window.electron.invoke(IPC_CHANNELS.MOCK_API.STATUS)) as {
        isRunning: boolean;
      };
      setIsRunning(statusData.isRunning);
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to load Mock API endpoints. Is the Main module loaded?");
    }
  }, []);

  useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  // Debounced JSON validation and formatting
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (!responseBody.trim()) {
          setParsedJson(null);
          setJsonError(null);
          return;
        }
        const parsed = JSON.parse(responseBody);
        setParsedJson(parsed);
        setJsonError(null);
        // Auto-format only if valid
        setResponseBody(JSON.stringify(parsed, null, 2));
      } catch (err: unknown) {
        setParsedJson(null);
        setJsonError(err instanceof Error ? err.message : String(err));
      }
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [responseBody]);

  const handleSave = async () => {
    if (jsonError) return; // Disallow saving invalid JSON
    try {
      if (editingId) {
        // Update
        const payload: UpdateEndpointDto = {
          id: editingId,
          method,
          path,
          statusCode: parseInt(statusCode, 10),
          delay: parseInt(delay, 10),
          description,
          responseBody,
        };
        await window.electron.invoke(IPC_CHANNELS.MOCK_API.UPDATE, payload);
      } else {
        // Create
        const payload: CreateEndpointDto = {
          method,
          path,
          statusCode: parseInt(statusCode, 10),
          delay: parseInt(delay, 10),
          description,
          responseBody,
        };
        await window.electron.invoke(IPC_CHANNELS.MOCK_API.CREATE, payload);
      }

      resetForm();
      loadEndpoints();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await window.electron.invoke(IPC_CHANNELS.MOCK_API.DELETE, id);
      loadEndpoints();
      if (editingId === id) resetForm();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleEdit = (endpoint: MockEndpoint) => {
    setEditingId(endpoint.id);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setStatusCode(endpoint.statusCode.toString());
    setDelay(endpoint.delay.toString());
    setDescription(endpoint.description);
    setResponseBody(endpoint.responseBody);
  };

  const resetForm = () => {
    setEditingId(null);
    setMethod("GET");
    setPath("/example");
    setStatusCode("200");
    setDelay("0");
    setDescription("");
    setResponseBody('{\n  "message": "Hello World"\n}');
  };

  const copyUrl = (targetPath: string) => {
    navigator.clipboard.writeText(`http://localhost:${port}/mock${targetPath}`);
  };

  const getMethodColor = (m: HttpMethod) => {
    switch (m) {
      case "GET":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "POST":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "PUT":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "PATCH":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "DELETE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "";
    }
  };

  const toggleServer = async () => {
    setIsStarting(true);
    try {
      if (isRunning) {
        await window.electron.invoke(IPC_CHANNELS.MOCK_API.STOP);
        setIsRunning(false);
      } else {
        const success = await window.electron.invoke(IPC_CHANNELS.MOCK_API.START);
        setIsRunning(!!success);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePortChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPort = parseInt(e.target.value, 10);
    setPort(newPort); // Optimistic UI update
  };

  const handlePortBlur = async () => {
    try {
      await window.electron.invoke(IPC_CHANNELS.MOCK_API.SET_PORT, port);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Mock API Server
            <div
              className={`ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isRunning ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-red-500"}`}
              ></span>
              {isRunning ? "RUNNING" : "STOPPED"}
            </div>
          </h1>
          <p className="text-zinc-400 mt-2">
            Local interceptor currently bound to{" "}
            <span className="font-mono text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded text-sm">
              /mock/*
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-white/5 shadow-inner">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950/80 rounded-lg border border-white/5">
            <Settings2 className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-400 font-medium">Port</span>
            <input
              type="number"
              className="w-16 bg-transparent outline-none text-white font-mono text-sm"
              value={port}
              onChange={handlePortChange}
              onBlur={handlePortBlur}
            />
          </div>

          <Button
            onClick={toggleServer}
            disabled={isStarting}
            variant={isRunning ? "destructive" : "default"}
            className={`w-28 transition-all duration-300 shadow-lg ${isRunning ? "" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"}`}
          >
            <Power className="w-4 h-4 mr-2" />
            {isRunning ? "Stop" : "Start"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* TOP PANEL: LIST (Moved from bottom as requested) */}
        <div className="w-full">
          <Card className="border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Active Endpoints</CardTitle>
              <CardDescription>
                All mock endpoints currently mounted to the local server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {endpoints.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  No active endpoints. Create one below!
                </div>
              ) : (
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-400 bg-zinc-900/50 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-medium">Method</th>
                        <th className="px-4 py-3 font-medium">Path</th>
                        <th className="px-4 py-3 font-medium">Status / Delay</th>
                        <th className="px-4 py-3 font-medium">Reqs</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoints.map((ep) => (
                        <tr
                          key={ep.id}
                          className="border-b border-white/5 bg-transparent hover:bg-zinc-900/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Badge className={`font-mono text-[10px] ${getMethodColor(ep.method)}`}>
                              {ep.method}
                            </Badge>
                          </td>
                          <td
                            className="px-4 py-3 font-mono text-zinc-300 truncate max-w-[200px]"
                            title={`/mock${ep.path}`}
                          >
                            /mock{ep.path}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            <span
                              className={ep.statusCode >= 400 ? "text-red-400" : "text-emerald-400"}
                            >
                              {ep.statusCode}
                            </span>
                            {ep.delay > 0 && (
                              <span className="ml-2 text-zinc-500">({ep.delay}ms)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                ep.hits > 0
                                  ? "border-emerald-500/50 text-emerald-400"
                                  : "border-zinc-700 text-zinc-500"
                              }
                            >
                              {ep.hits}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyUrl(ep.path)}
                                title="Copy Local URL"
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(ep)}
                                title="Edit Endpoint"
                                className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(ep.id)}
                                title="Delete Endpoint"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* BOTTOM LEFT PANEL: FORM */}
          <div className="lg:col-span-4 h-full">
            <Card className="border border-white/5 bg-zinc-950/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Endpoint" : "New Endpoint"}</CardTitle>
                <CardDescription>
                  Configure the route mapping and behavior parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="space-y-2 w-1/3">
                    <Label>Method</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={method}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setMethod(e.target.value as HttpMethod)
                      }
                    >
                      {METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 w-2/3">
                    <Label>Path Prefix Tracker</Label>
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/10 bg-zinc-900 text-zinc-500 text-sm font-mono">
                        /mock
                      </span>
                      <Input
                        type="text"
                        value={path}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPath(e.target.value)
                        }
                        placeholder="/users/:id"
                        className="rounded-l-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 w-1/2">
                    <Label>Status Code</Label>
                    <Input
                      type="number"
                      value={statusCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setStatusCode(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 w-1/2">
                    <Label>Delay (ms)</Label>
                    <Input
                      type="number"
                      value={delay}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDelay(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDescription(e.target.value)
                    }
                    placeholder="e.g. Return mock user payload"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-white/5 pt-4">
                <Button variant="outline" onClick={resetForm} disabled={!editingId}>
                  Cancel Edit
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!!jsonError}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "Update Endpoint" : "Create Endpoint"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* RIGHT PANEL: JSON EDITOR + LIST */}
          <div className="lg:col-span-8 h-full">
            <Card className="border border-white/5 bg-zinc-950/50 backdrop-blur-xl flex flex-col h-full">
              <CardHeader className="py-3 border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">JSON Response Body</CardTitle>
                </div>
                <div>
                  {jsonError ? (
                    <Badge variant="destructive" className="font-mono text-xs">
                      ✗ Invalid JSON
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-xs">
                      ✓ Valid JSON
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <div className="flex-1 flex overflow-hidden min-h-[400px]">
                {/* Left side: Text Input */}
                <div className="w-1/2 border-r border-white/5 p-0 relative h-full">
                  <Textarea
                    className="h-full w-full rounded-none border-0 focus-visible:ring-0 resize-none font-mono text-xs bg-transparent p-4 text-zinc-300"
                    placeholder="Enter valid JSON..."
                    value={responseBody}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setResponseBody(e.target.value)
                    }
                  />
                  {jsonError && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs p-2 font-mono break-words">
                      {jsonError}
                    </div>
                  )}
                </div>
                {/* Right side: Tree Preview */}
                <div className="w-1/2 bg-zinc-900/30 p-4 overflow-y-auto h-full relative">
                  <style>{`
                  /* Prevent nested react-json-view-lite components from overflowing their generic containers */
                  .json-view-container {
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: break-all;
                  }
                `}</style>
                  {parsedJson ? (
                    <div className="text-xs json-view-container">
                      <JsonView
                        data={parsedJson}
                        shouldExpandNode={() => true}
                        style={darkStyles}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                      Waiting for valid JSON...
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
