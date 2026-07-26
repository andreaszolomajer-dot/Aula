'use client';

import { useState } from 'react';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

const TOOLS = [
  { id: 'fundal', key: 'tBackground', icon: '🖼' },
  { id: 'tabla', key: 'tBoard', icon: '🖊' },
  { id: 'prezinta', key: 'tPresent', icon: '📽' },
  { id: 'video', key: 'tVideo', icon: '▶️' },
  { id: 'camere', key: 'tRooms', icon: '🚪' },
  { id: 'sondaj', key: 'tPoll', icon: '📊' },
  { id: 'qa', key: 'tQA', icon: '❓' },
  { id: 'fisiere', key: 'tFiles', icon: '📎' },
  { id: 'reactii', key: 'tReactions', icon: '😊' },
  { id: 'inregistrare', key: 'tRecord', icon: '⏺' },
  { id: 'subtitrare', key: 'tCaptions', icon: 'CC' },
  { id: 'gazda', key: 'tHost', icon: '🛡' },
];

export default function Dock() {
  const [open, setOpen] = useState(false);
  const { activeTool, toggleTool } = useTools();
  const { t } = useT();

  return (
    <>
      <button className={`dock-btn ${open ? 'active' : ''}`} onClick={() => setOpen((v) => !v)}>
        {open ? '✕' : '☰'} {t('tools')}
      </button>

      {open && (
        <div className="dock-strip">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`dock-item ${activeTool === tool.id ? 'on' : ''}`}
              onClick={() => toggleTool(tool.id)}
            >
              <span className="dock-ic">{tool.icon}</span>
              <span className="dock-lbl">{t(tool.key)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
