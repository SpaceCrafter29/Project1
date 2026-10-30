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

export function StatusBadge({ status }: { status: StepStatusValue }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
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
