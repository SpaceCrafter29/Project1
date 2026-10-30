import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { fileToDataUrl } from '../lib/image';
import { Button } from './ui';

/** Mounted inputs; a pasted image goes to the most recently opened one. */
const pasteTargets: symbol[] = [];

/** Photo/screenshot input: camera, file picker, paste (Ctrl+V) and drag & drop. */
export function ImageInput({
  images,
  onChange,
  max = 6,
  hint,
  samples = [],
  testId,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  hint?: string;
  /** Optional sample images (for demo mode). */
  samples?: { label: string; url: string }[];
  testId?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const addBlobs = useCallback(
    async (blobs: Blob[]) => {
      const usable = blobs.filter((b) => b.type.startsWith('image/'));
      if (usable.length === 0) {
        setError('Please choose an image (photo or screenshot).');
        return;
      }
      setBusy(true);
      setError('');
      try {
        const urls = await Promise.all(usable.map((b) => fileToDataUrl(b)));
        onChange([...imagesRef.current, ...urls].slice(0, max));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [max, onChange],
  );

  useEffect(() => {
    const me = Symbol('image-input');
    pasteTargets.push(me);
    const onPaste = (event: ClipboardEvent) => {
      if (pasteTargets[pasteTargets.length - 1] !== me) return;
      const files = [...(event.clipboardData?.items ?? [])]
        .filter((i) => i.kind === 'file')
        .map((i) => i.getAsFile())
        .filter((f): f is File => !!f);
      if (files.length > 0) {
        event.preventDefault();
        void addBlobs(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
      pasteTargets.splice(pasteTargets.indexOf(me), 1);
    };
  }, [addBlobs]);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void addBlobs([...event.dataTransfer.files]);
  };

  const loadSample = async (url: string) => {
    setBusy(true);
    try {
      const blob = await (await fetch(url)).blob();
      await addBlobs([blob]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`image-input ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      data-testid={testId}
    >
      {images.length > 0 && (
        <div className="thumbs">
          {images.map((src, i) => (
            <figure key={i} className="thumb">
              <img src={src} alt={`Page ${i + 1}`} />
              <figcaption>
                Page {i + 1}
                <button
                  type="button"
                  className="link"
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  aria-label={`Remove page ${i + 1}`}
                >
                  remove
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {images.length < max && (
        <div className="image-input-actions">
          <Button variant="primary" onClick={() => cameraRef.current?.click()} busy={busy}>
            Take photo
          </Button>
          <Button onClick={() => fileRef.current?.click()}>Upload image{max > 1 ? 's' : ''}</Button>
          {samples.map((s) => (
            <Button key={s.url} variant="ghost" onClick={() => void loadSample(s.url)}>
              {s.label}
            </Button>
          ))}
          <span className="muted small">{hint ?? 'or paste a screenshot (Ctrl+V) / drop a file here'}</span>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void addBlobs([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        hidden
        data-testid={testId ? `${testId}-file` : undefined}
        onChange={(e) => {
          void addBlobs([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
