'use client';

import { useEffect, useState } from 'react';

export default function RoomNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('aula-room-notice')) setShow(true);
    } catch (e) {
      setShow(true);
    }
  }, []);

  const ok = () => {
    try {
      sessionStorage.setItem('aula-room-notice', '1');
    } catch (e) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="room-notice">
      <p>
        Ședințele pot fi transcrise (subtitrare) sau înregistrate de gazdă. Prin participare confirmi
        că ai fost informat. Poți opri camera/microfonul oricând.
      </p>
      <button onClick={ok}>Am înțeles</button>
    </div>
  );
}
