import { useEffect, useState } from 'react';
import { href, navigate } from '../lib/router';
import { getStore } from '../lib/storage';

/** Everything worth trying, in the order the app is used. Shown in the single-file demo (or with ?guide). */
const SECTIONS: { title: string; items: { id: string; text: string }[] }[] = [
  {
    title: 'Start',
    items: [
      { id: 'home-new', text: 'Home: click “New problem”. Later, the home page lists your problems; “Delete” asks first.' },
      { id: 'mobile', text: 'Make the window narrow (or open on a phone): the layout stacks, the step tabs scroll sideways.' },
    ],
  },
  {
    title: '1 · Problem',
    items: [
      { id: 'upload', text: 'Load “Sample: number theory” – or take a photo, upload a file, paste a screenshot (Ctrl+V), drop an image.' },
      { id: 'confirm-text', text: '“Read the problem”, then edit the text: the math preview updates live. Confirm with “Yes, that’s right”.' },
      { id: 'geo-figure-text', text: 'Start another problem with “Sample: geometry”: the figure is described in words and can be edited too.' },
    ],
  },
  {
    title: '2 · Work on it (tip loop)',
    items: [
      { id: 'first-tip', text: 'The first tip appears by itself – with a small-case table computed by code (show the code below it).' },
      { id: 'parts', text: 'Parts (a) and (b) have their own tabs; the current part is shown above the tips.' },
      { id: 'progress', text: '“Use sample progress” → “Read my progress” → edit or delete read lines → “Looks right – give me the next tip”.' },
      { id: 'personal', text: 'The new tip names what you already did, points at your conjecture and shows a code check of it.' },
      { id: 'escalate', text: 'Write a note (“still stuck”) and press “Tip without a new photo”: the tip gets more concrete.' },
      { id: 'part-b', text: '“Part (a) done – on to (b)”: the first tip for (b) asks how to apply what you found in (a).' },
      { id: 'geo-drag', text: 'Geometry problem: drag the yellow points of the figure; the numbers update, area MNPQ stays half of ABCD. Try the arrow keys and “reset figure”.' },
    ],
  },
  {
    title: '3 · Final solution',
    items: [
      { id: 'solution', text: '“I’m done – check my full solution” → “Use sample solution” → “Read my solution”.' },
      { id: 'edit-steps', text: 'Fix the reading: edit a step, move it ↑↓, “+ step below”, delete – then “Yes, that’s what I wrote”.' },
    ],
  },
  {
    title: '4 · Feedback',
    items: [
      { id: 'grade', text: 'The circled grade (3–4 /7), the marks ✓ ? ✗ ~ in the margin and the headings Part (a) / Part (b).' },
      { id: 'stamps', text: 'Code-check stamps (a counterexample on step 5) and “Check details” on any step.' },
      { id: 'concede', text: 'Step 3: “I think my step is right”, explain → the coach agrees and the grade becomes 4.' },
      { id: 'counter', text: 'Step 5: disagree → the coach runs a code test in the chat and explains the counterexample.' },
    ],
  },
  {
    title: '5 · Ask with pen',
    items: [
      { id: 'lens', text: 'Circle a spot freehand: it becomes a rounded crop frame. Drag its corners, move it; the outside is dimmed.' },
      { id: 'lens-chat', text: '“Explain this” or a question per marking; tap another box to select it; “Delete”; “Pen on/off”.' },
    ],
  },
  {
    title: '6 · Fix your approach',
    items: [
      { id: 'fix', text: '“Analyze my approach”: does it carry, where it breaks, and the repair as direction → detail.' },
    ],
  },
  {
    title: '7 · Other approaches',
    items: [
      { id: 'alts', text: '“Show other approaches”: open all three – one verified, one “only logically checked”, one hidden by a failed code check.' },
      { id: 'alt-ask', text: '“Mark with pen” and circle steps, or “Ask” on a step; “That’s not right?” re-checks a step.' },
      { id: 'own', text: '“Write my own version with this idea” → sample → feedback with “Did you use the idea?”.' },
      { id: 'geo-alt', text: 'Geometry problem: the vector solution comes with its own draggable figure.' },
    ],
  },
  {
    title: 'Everywhere',
    items: [
      { id: 'disclaimer', text: 'Footer: “The AI can make mistakes …” and the model-call counter.' },
      { id: 'keys', text: 'Chat: Enter sends, Shift+Enter makes a new line.' },
    ],
  },
];

const KEY = 'olympiad-coach-test-guide';

function load(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function TestGuide() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>(load);
  const total = SECTIONS.reduce((n, s) => n + s.items.length, 0);
  const count = Object.values(done).filter(Boolean).length;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      // storage unavailable: the checklist just is not remembered
    }
  }, [done]);

  const reset = async () => {
    if (!window.confirm('Delete all problems in this demo and start over?')) return;
    const store = await getStore();
    for (const s of await store.list()) await store.remove(s.id);
    setDone({});
    navigate({ name: 'home' });
    window.location.reload();
  };

  return (
    <aside className={`test-guide ${open ? 'open' : ''}`} data-testid="test-guide">
      <button type="button" className="test-guide-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ✓ Test checklist {count}/{total}
      </button>
      {open && (
        <div className="test-guide-body">
          <p className="small muted">
            Everything runs in this file – the coach answers with scripted demo examples. Tick what you tried.
          </p>
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h4>{section.title}</h4>
              <ul>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!done[item.id]}
                        onChange={(e) => setDone((d) => ({ ...d, [item.id]: e.target.checked }))}
                      />
                      <span>{item.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="actions">
            <a href={href({ name: 'home' })} className="btn btn-secondary">
              Home
            </a>
            <button type="button" className="btn btn-ghost" onClick={() => void reset()}>
              Reset demo data
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
