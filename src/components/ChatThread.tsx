import { useState, type FormEvent } from 'react';
import type { ChatTurn } from '../../shared/api';
import { MathText } from './MathText';
import { Button, ErrorBox } from './ui';

const ROLE_LABEL: Record<ChatTurn['role'], string> = { user: 'You', coach: 'Coach', check: 'Code check' };

export function ChatThread({
  messages,
  onSend,
  busy,
  error,
  placeholder = 'Ask a question…',
  quickActions = [],
  testId,
}: {
  messages: ChatTurn[];
  onSend: (text: string) => void;
  busy?: boolean;
  error?: string;
  placeholder?: string;
  quickActions?: string[];
  testId?: string;
}) {
  const [draft, setDraft] = useState('');

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    onSend(text);
  };

  return (
    <div className="chat" data-testid={testId}>
      {messages.length > 0 && (
        <ol className="chat-messages">
          {messages.map((m, i) => (
            <li key={i} className={`chat-msg chat-${m.role}`}>
              <span className="chat-role">{ROLE_LABEL[m.role]}</span>
              <MathText text={m.text} block />
            </li>
          ))}
        </ol>
      )}
      {error && <ErrorBox message={error} />}
      {quickActions.length > 0 && (
        <div className="chat-quick">
          {quickActions.map((q) => (
            <Button key={q} variant="ghost" disabled={busy} onClick={() => onSend(q)}>
              {q}
            </Button>
          ))}
        </div>
      )}
      <form className="chat-input" onSubmit={submit}>
        <textarea
          value={draft}
          rows={2}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="submit" variant="primary" busy={busy} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
