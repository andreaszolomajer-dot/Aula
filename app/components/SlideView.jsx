'use client';

export const THEMES = [
  { name: 'Ink', bg: '#0E1420', text: '#E7ECF3', accent: '#6D74F0', sub: '#8A97AB' },
  { name: 'Mint', bg: '#0C1A17', text: '#EAF6F2', accent: '#4AD6B5', sub: '#8FB3AA' },
  { name: 'Coral', bg: '#1A1012', text: '#F6EDEA', accent: '#F2555A', sub: '#B39A97' },
  { name: 'Zăpadă', bg: '#F4F6FB', text: '#161B26', accent: '#6D74F0', sub: '#5D6B82' },
  { name: 'Amurg', bg: '#14101F', text: '#EEE9F6', accent: '#B57BFF', sub: '#9A8FB3' },
];

export function SlideView({ slide, theme }) {
  const bullets = (slide.content || '').split('\n').filter(Boolean);
  const bullets2 = (slide.content2 || '').split('\n').filter(Boolean);

  if (slide.layout === 'title') {
    return (
      <div className="sv center">
        <h1 style={{ color: theme.text }}>{slide.title}</h1>
        <p style={{ color: theme.sub }}>{slide.content}</p>
      </div>
    );
  }
  if (slide.layout === 'section') {
    return (
      <div className="sv center" style={{ background: theme.accent }}>
        <h1 style={{ color: '#fff' }}>{slide.title}</h1>
      </div>
    );
  }
  if (slide.layout === 'two-col') {
    return (
      <div className="sv">
        <h2 style={{ color: theme.accent }}>{slide.title}</h2>
        <div className="sv-cols">
          <ul>{bullets.map((b, i) => <li key={i} style={{ color: theme.text }}>{b}</li>)}</ul>
          <ul>{bullets2.map((b, i) => <li key={i} style={{ color: theme.text }}>{b}</li>)}</ul>
        </div>
      </div>
    );
  }
  if (slide.layout === 'blank') {
    return (
      <div className="sv">
        <div style={{ whiteSpace: 'pre-wrap', color: theme.text }}>{slide.content}</div>
      </div>
    );
  }
  return (
    <div className="sv">
      <h2 style={{ color: theme.accent }}>{slide.title}</h2>
      <ul>{bullets.map((b, i) => <li key={i} style={{ color: theme.text }}>{b}</li>)}</ul>
    </div>
  );
}
