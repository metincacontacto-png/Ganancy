import { LEGAL_PAGES } from './LegalContent';

// Página standalone con URL propia (/terminos, /privacidad, /reembolsos) para que
// Paddle pueda visitarla directamente durante la aprobación de dominio — el modal
// de LandingPageView no sirve para eso porque no tiene una URL navegable.
export default function LegalPageView({ page }) {
  const entry = LEGAL_PAGES[page];
  if (!entry) return null;
  const { title, Content } = entry;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--gy-ink, #0b1220)',
        color: 'var(--gy-text, #f8fafc)',
        fontFamily: "'Outfit', system-ui, sans-serif",
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <a
          href="/"
          style={{
            color: 'var(--gy-amber, #ff9500)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          ← Volver a Ganancy
        </a>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', margin: '20px 0 32px', lineHeight: 1.15 }}>
          {title}
        </h1>
        <div
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--gy-text-muted, #cbd5e1)',
          }}
        >
          <Content />
        </div>
      </div>
    </div>
  );
}
