'use client';

import { createContext, useContext, useState } from 'react';

const ToolsCtx = createContext({
  activeTool: null,
  setActiveTool: () => {},
  toggleTool: () => {},
});

export function ToolsProvider({ children }) {
  const [activeTool, setActiveTool] = useState(null);
  const toggleTool = (t) => setActiveTool((cur) => (cur === t ? null : t));
  return (
    <ToolsCtx.Provider value={{ activeTool, setActiveTool, toggleTool }}>
      {children}
    </ToolsCtx.Provider>
  );
}

export const useTools = () => useContext(ToolsCtx);
