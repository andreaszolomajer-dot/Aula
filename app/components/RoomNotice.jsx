'use client';

import { useEffect, useState } from 'react';
import { useT } from './LangProvider';

export default function RoomNotice() {
  const { t } = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (!sessionStorage.getItem('aula-room-notice')) setShow(true); } catch (e) { setShow(true); }
  }, []);

  const ok = () => {
    try { sessionStorage.setItem('aula-room-notice', '1'); } catch (e) {}
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="room-notice">
      <p>{t('noticeRec')}</p>
      <button onClick={ok}>{t('understood')}</button>
    </div>
  );
}
