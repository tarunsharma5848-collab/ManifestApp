import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

// NOTE: the rendered card below intentionally avoids Tailwind's opacity-modifier
// classes (e.g. "text-white/70") and gradient utilities. Tailwind v4 compiles
// those to `color-mix(in oklab, ...)`, which html2canvas cannot parse yet and
// fails on silently. Everything inside the card uses plain hex/rgba via
// inline styles instead, so the capture always works regardless of the
// user's active theme.
export default function ShareCardModal({ item, affirmationText, onClose }) {
  const cardRef = useRef(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setRendering(true);
    setError('');
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#060815',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'manifest-card.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Card render failed', err);
      setError('Could not render the image. Try again in a moment.');
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="max-w-sm w-full">
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '4 / 5',
            backgroundColor: '#060815',
          }}
        >
          <img
            src={item.image_url}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(to top, rgba(6,8,21,0.95) 0%, rgba(6,8,21,0.55) 45%, rgba(6,8,21,0) 75%)',
            }}
          />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '24px' }}>
            {affirmationText && (
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '24px',
                  fontStyle: 'italic',
                  color: '#f5f0e6',
                  marginBottom: '12px',
                  lineHeight: 1.3,
                }}
              >
                "{affirmationText}"
              </p>
            )}
            <p
              style={{
                color: '#d4af6a',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Manifest
            </p>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownload}
            disabled={rendering}
            className="flex-1 rounded-lg bg-cosmic-gold text-cosmic-navy-deep font-medium py-3 hover:bg-cosmic-gold-light transition disabled:opacity-50"
          >
            {rendering ? 'Rendering...' : 'Download Image'}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-cosmic-lavender/40 text-cosmic-star px-5 py-3 hover:bg-cosmic-navy-light transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
