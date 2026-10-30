import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { StepStatusValue } from '../../shared/schemas';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  busy = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && <Spinner small />}
      {children}
    </button>
  );
}

export function Spinner({ small = false, label }: { small?: boolean; label?: string }) {
  return (
    <span className={`spinner-wrap ${small ? 'small' : ''}`} role="status">
      <span className="spinner" aria-hidden />
      {label && <span className="spinner-label">{label}</span>}
    </span>
  );
}

export function Card({
  title,
  aside,
  children,
  className = '',
  testId,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={`card ${className}`} data-testid={testId}>
      {(title || aside) && (
        <header className="card-header">
          {title && <h3>{title}</h3>}
          {aside && <div className="card-aside">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <span>{message}</span>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export const STATUS_LABEL: Record<StepStatusValue, string> = {
  valid: 'valid',
  gap: 'gap',
  error: 'error',
  unclear: 'unclear – check yourself',
};

const STATUS_SYMBOL: Record<StepStatusValue, string> = { valid: '✓', gap: '?', error: '✗', unclear: '~' };

/** A teacher's mark in the margin: ✓ valid, ? gap, ✗ error, ~ unclear. */
export function StatusBadge({ status }: { status: StepStatusValue }) {
  return (
    <span className={`mark mark-${status}`} data-status={status}>
      <span className="mark-symbol" aria-hidden>
        {STATUS_SYMBOL[status]}
      </span>
      <span className="mark-label">{STATUS_LABEL[status]}</span>
    </span>
  );
}

/** A photo taped into the notebook. */
export function Taped({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <figure className={`taped ${className}`}>{children}</figure>;
}

/** The score, written in red pen and circled like a grade. */
export function GradeMark({ value, testId }: { value: string; testId?: string }) {
  return (
    <span className="grade">
      <svg className="grade-ring" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden>
        <path d="M30 62 C 28 22, 160 8, 182 48 C 200 86, 120 114, 64 106 C 22 100, 6 66, 40 34 C 56 20, 90 14, 112 16" />
      </svg>
      <span className="grade-value" data-testid={testId}>
        {value}
      </span>
      <span className="grade-max">/7</span>
    </span>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' | 'good' | 'bad' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Details({ summary, children, testId }: { summary: ReactNode; children: ReactNode; testId?: string }) {
  return (
    <details className="details" data-testid={testId}>
      <summary>{summary}</summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
