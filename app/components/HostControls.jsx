'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRoomContext, useLocalParticipant, useParticipants } from '@livekit/components-react';
import { useTools } from './ToolsProvider';
import { useT } from './LangProvider';

export default function HostControls() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const { activeTool, setActiveTool } = useTools();
  const { t } = useT();
  const open = activeTool === 'gazda';

  const roomName = room?.name || '';
  const myId = localParticipant?.identity || '';
  const myName = localParticipant?.name || 'Gazdă';

  const [amHost, setAmHost] = useState(false);
  const [amCohost, setAmCohost] = useState(false);
  const [cohosts, setCohosts] = useState([]);
  const [lobby, setLobby] = useState(false);
  const [webinar, setWebinar] = useState(false);
  const [waitingList, setWaitingList] = useState([]);
  const [busy, setBusy] = useState('');

  const post = useCallback(async (action, extra = {}) => {
    try {
      const res = await fetch('/api/host', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomName, identity: myId, name: myName, action, ...extra }) });
      return await res.json();
    } catch (e) { return { error: 'Eroare de rețea.' }; }
  }, [roomName, myId, myName]);

  const refreshStatus = useCallback(async () => {
    const d = await post('status');
    setAmHost(!!d.amHost);
    setAmCohost(!!d.amCohost);
    setCohosts(d.cohosts || []);
    setLobby(!!d.lobby);
    setWebinar(!!d.webinar);
  }, [post]);

  useEffect(() => { if (roomName && myId) refreshStatus(); }, [roomName, myId, refreshStatus]);

  const canManage = amHost || amCohost;

  useEffect(() => {
    if (!canManage || !lobby) return;
    let t;
    const load = async () => { const d = await post('lobbyList'); setWaitingList(d.waiting || []); };
    load();
    t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [canManage, lobby, post]);

  if (!open) return null;

  const others = participants.filter((p) => p.identity !== myId);

  const setMode = async (nextLobby, nextWebinar) => { setLobby(nextLobby); setWebinar(nextWebinar); await post('setMode', { lobby: nextLobby, webinar: nextWebinar }); };
  const admit = async (target) => { setBusy(target); await post('admit', { target }); setWaitingList((w) => w.filter((x) => x.identity !== target)); setBusy(''); };
  const muteAll = async () => { setBusy('all'); await post('muteAll'); setBusy(''); };
  const muteOne = async (target) => { setBusy(target); await post('mute', { target }); setBusy(''); };
  const removeOne = async (target) => { if (!confirm(t('hcRemoveConfirm'))) return; setBusy(target); await post('remove', { target }); setBusy(''); };
  const promote = async (target) => { setBusy(target); const d = await post('promote', { target }); if (d.cohosts) setCohosts(d.cohosts); setBusy(''); };
  const demote = async (target) => { setBusy(target); const d = await post('demote', { target }); if (d.cohosts) setCohosts(d.cohosts); setBusy(''); };

  return (
    <div className="panel-float panel-left">
      <div className="panel-head">
        {t('hcTitle')}
        <button className="panel-x" onClick={() => setActiveTool(null)}>✕</button>
      </div>

      {!canManage ? (
        <p className="hc-muted">{t('hcNotHost')}</p>
      ) : (
        <>
          {amCohost && !amHost && <p className="hc-muted" style={{ color: 'var(--mint)' }}>{t('hcAmCo')}</p>}

          {amHost && (
            <button className="hc-invite" onClick={() => {
              const link = `${window.location.origin}/room/${encodeURIComponent(roomName)}`;
              try { navigator.clipboard.writeText(link); alert(t('hcInviteCopied') + '\n' + link); } catch (e) { prompt('Copiază linkul pentru invitați:', link); }
            }}>🔗 {t('hcInvite')}</button>
          )}

          {amHost && (
            <div className="hc-modes">
              <label className="hc-toggle">
                <input type="checkbox" checked={lobby} onChange={(e) => setMode(e.target.checked, webinar)} />
                <span><b>{t('hcLobby')}</b><br /><small>{t('hcLobbyHint')}</small></span>
              </label>
              <label className="hc-toggle">
                <input type="checkbox" checked={webinar} onChange={(e) => setMode(lobby, e.target.checked)} />
                <span><b>{t('hcWebinar')}</b><br /><small>{t('hcWebinarHint')}</small></span>
              </label>
            </div>
          )}

          {lobby && (
            <div className="hc-wait">
              <div className="hc-sub">{t('hcWaiting')} ({waitingList.length})</div>
              {waitingList.length === 0 && <p className="hc-muted">{t('hcNobody')}</p>}
              {waitingList.map((w) => (
                <div key={w.identity} className="hc-row">
                  <span className="hc-name">{w.name}</span>
                  <button className="hc-admit" onClick={() => admit(w.identity)} disabled={busy === w.identity}>{t('hcAdmit')}</button>
                </div>
              ))}
            </div>
          )}

          <button className="hc-muteall" onClick={muteAll} disabled={busy === 'all'}>🔇 {busy === 'all' ? t('hcMuting') : t('hcMuteAll')}</button>
          <p className="hc-muted" style={{ fontSize: 11.5, marginTop: -4 }}>{t('hcMuteNote')}</p>

          <div className="hc-list">
            <div className="hc-sub">{t('hcParticipants')}</div>
            {others.length === 0 && <p className="hc-muted">{t('hcNoOthers')}</p>}
            {amHost && others.length === 0 && <p className="hc-muted" style={{ fontSize: 11.5 }}>{t('hcCoHint')}</p>}
            {others.map((p) => {
              const isCo = cohosts.includes(p.identity);
              return (
                <div key={p.identity} className="hc-row">
                  <span className="hc-name">{p.name || p.identity}{isCo && <span className="hc-badge">{t('hcCoBadge')}</span>}</span>
                  <button onClick={() => muteOne(p.identity)} disabled={busy === p.identity}>{t('hcMute')}</button>
                  {amHost && (isCo
                    ? <button className="hc-demote" onClick={() => demote(p.identity)} disabled={busy === p.identity}>{t('hcDemote')}</button>
                    : <button className="hc-promote" onClick={() => promote(p.identity)} disabled={busy === p.identity}>{t('hcPromote')}</button>
                  )}
                  {amHost && <button className="hc-remove" onClick={() => removeOne(p.identity)} disabled={busy === p.identity}>{t('hcRemove')}</button>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
