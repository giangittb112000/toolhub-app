import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import type { JsonTab } from "../pages/modules/json-formatter/components/TabBar";

interface JsonFormatterState {
  tabs: JsonTab[];
  activeTabId: string;
  createTab: (initialContent?: string) => void;
  renameTab: (id: string, newName: string) => void;
  closeTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  setActiveTab: (id: string) => void;
}

export const useJsonFormatterStore = create<JsonFormatterState>((set) => ({
  tabs: [],
  activeTabId: "",

  createTab: (initialContent = '{\n  "hello": "world"\n}') =>
    set((state) => {
      const newTab: JsonTab = {
        id: uuidv4(),
        name: `Tab ${state.tabs.length + 1}`,
        content: initialContent,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),

  renameTab: (id, newName) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, name: newName } : t)),
    })),

  closeTab: (id) =>
    set((state) => {
      if (state.tabs.length <= 1) return state; // Never close the last tab

      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActiveId = state.activeTabId;

      if (state.activeTabId === id) {
        newActiveId = newTabs[newTabs.length - 1].id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveId,
      };
    }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, content } : t)),
    })),

  setActiveTab: (id) => set({ activeTabId: id }),
}));
