'use client';

import { useEffect, useRef, useState } from 'react';

let pdfjsPromise = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const lib = await import('pdfjs-dist');
      lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`;
      return lib;
    })();
  }
  return pdfjsPromise;
}

const docCache = {};
async function loadDoc(url) {
  if (!docCache[url]) {
    const lib = await getPdfjs();
    docCache[url] = lib.getDocument(url).promise;
  }
  return docCache[url];
}

export default function PdfSlide({ url, page, onPages }) {
  const canvasRef = useRef(null);
  const taskRef = useRef(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await loadDoc(url);
        if (cancelled) return;
        if (onPages) onPages(doc.numPages);
        const pageNum = Math.min(Math.max(1, page), doc.numPages);
        const p = await doc.getPage(pageNum);
        if (cancelled) return;
        const viewport = p.getViewport({ scale: 2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (taskRef.current) {
          try { taskRef.current.cancel(); } catch (e) {}
        }
        taskRef.current = p.render({ canvasContext: ctx, viewport });
        await taskRef.current.promise;
      } catch (e) {
        if (!cancelled && e?.name !== 'RenderingCancelledException') {
          setErr('Nu am putut încărca PDF-ul.');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (taskRef.current) {
        try { taskRef.current.cancel(); } catch (e) {}
      }
    };
  }, [url, page, onPages]);

  if (err) return <div style={{ color: '#F5A742', padding: 20 }}>{err}</div>;
  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
    />
  );
}
