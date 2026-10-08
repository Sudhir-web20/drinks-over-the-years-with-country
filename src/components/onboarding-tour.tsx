import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SEEN_KEY = 'sip.tour.seen.v1';
const PANEL_MIN_SPACE = 250;

type Rect = { top: number; left: number; width: number; height: number };

type TourStep = {
  target: string;
  title: string;
  body: string;
  primary?: string;
  tryIt?: boolean;
};

const steps: TourStep[] = [
  {
    target: '[data-tour="views"]',
    title: 'Two ways to browse',
    body: 'Collection shows the mosaic of bottles. Timeline lays all 25 out in a line by year. Switch whenever you like.',
  },
  {
    target: '[data-tour="filters"]',
    title: 'Filter by type',
    body: 'Tap beer, water, juice, energy & sports or cultured to see only those drinks. "All drinks" brings everything back.',
  },
  {
    target: '[data-tour="search"]',
    title: 'Find a drink',
    body: 'Type any name, country or year — "coca", "France", "1929" — and the archive narrows as you type.',
  },
  {
    target: '[data-tour="sort"]',
    title: 'Flip the years',
    body: 'This arrow switches between oldest-first and newest-first, so you can walk the collection in either direction.',
  },
  {
    target: '[data-tour="layout"]',
    title: 'Change the layout',
    body: 'The same two views live here too, right above the grid — mosaic or timeline, one tap apart.',
  },
  {
    target: '[data-tour="card"]',
    title: 'Open a drink',
    body: 'Click any card and a detail card slides open: where it comes from, what it tastes like, a little-known detail, and a story written just now by AI.',
    primary: 'Try it with Guinness',
    tryIt: true,
  },
];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function OnboardingTour({ onPrepare, onOpenFeatured }: { onPrepare: () => void; onOpenFeatured: () => void }) {
  const [phase, setPhase] = useState<'hidden' | 'welcome' | 'tour'>('hidden');
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [narrow, setNarrow] = useState(false);
  const step = steps[index];
  const prepareRef = useRef(onPrepare);
  const openRef = useRef(onOpenFeatured);
  prepareRef.current = onPrepare;
  openRef.current = onOpenFeatured;

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { seen = false; }
    if (seen) return;
    const timer = window.setTimeout(() => setPhase('welcome'), 800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const start = useCallback(() => {
    prepareRef.current();
    setIndex(0);
    setPhase('tour');
  }, []);

  const replaySignalRef = useRef(0);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (replaySignalRef.current === replay) return;
    replaySignalRef.current = replay;
    if (replay > 0) start();
  }, [replay, start]);

  const measure = useCallback(() => {
    const el = step?.target ? document.querySelector<HTMLElement>(step.target) : null;
    if (!el) { setRect(null); return; }
    const box = el.getBoundingClientRect();
    setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
  }, [step?.target]);

  useLayoutEffect(() => {
    if (phase !== 'tour' || !step?.target) { setRect(null); return; }
    const el = document.querySelector<HTMLElement>(step.target);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    measure();
    let frame = 0;
    let frames = 0;
    const track = () => { measure(); frames += 1; if (frames < 100) frame = requestAnimationFrame(track); };
    frame = requestAnimationFrame(track);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [phase, step?.target, measure]);

  const finish = useCallback((openFeatured = false) => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage unavailable */ }
    setPhase('hidden');
    setRect(null);
    if (openFeatured) window.setTimeout(() => openRef.current(), 140);
  }, []);

  const next = useCallback(() => setIndex(i => Math.min(i + 1, steps.length - 1)), []);
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (phase === 'hidden') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { finish(); return; }
      if (phase !== 'tour') return;
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, finish, next, prev]);

  const focusPanel = useCallback((node: HTMLDivElement | null) => { node?.focus({ preventScroll: true }); }, []);

  const panelStyle = (): CSSProperties => {
    if (!rect || narrow) return { left: 14, right: 14, bottom: 14 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(372, vw - 32);
    const left = Math.max(16, Math.min(rect.left, vw - width - 16));
    return vh - (rect.top + rect.height) > PANEL_MIN_SPACE
      ? { top: rect.top + rect.height + 16, left, width }
      : { bottom: vh - rect.top + 16, left, width };
  };

  const isLast = index === steps.length - 1;

  return <AnimatePresence>
    {phase === 'welcome' && <motion.div key="welcome" className="tour-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      <motion.div
        className="tour-welcome"
        initial={{ opacity: 0, y: 14, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: .99 }}
        transition={{ duration: .3 }}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Sip"
      >
        <div className="tour-welcome-mark"><Sparkles size={17} /></div>
        <span className="tour-kicker">FIRST TIME HERE?</span>
        <h2>Let me show you<br />around in 20 seconds</h2>
        <p>Twenty-five iconic drinks, 1759 to 2002. Here is what every button does — then it is all yours.</p>
        <ul className="tour-welcome-list">
          <li><strong>Browse</strong> the mosaic or the timeline</li>
          <li><strong>Filter</strong> by type, or search by name, country or year</li>
          <li><strong>Click</strong> any drink for its full story</li>
        </ul>
        <div className="tour-actions">
          <Button variant="ghost" className="tour-primary" onClick={start}>Show me around <ArrowRight size={15} /></Button>
          <Button variant="ghost" className="tour-quiet" onClick={() => finish()}>I&rsquo;ll explore on my own</Button>
        </div>
      </motion.div>
    </motion.div>}

    {phase === 'tour' && <>
      <motion.div
        key="spotlight"
        className="tour-spotlight"
        aria-hidden="true"
        initial={false}
        animate={rect
          ? { opacity: 1, top: rect.top - 10, left: rect.left - 10, width: rect.width + 20, height: rect.height + 20 }
          : { opacity: 0, top: 0, left: 0, width: 0, height: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 34, mass: .7 }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          ref={focusPanel}
          className="tour-panel"
          style={panelStyle()}
          role="dialog"
          aria-modal="true"
          aria-label={step.title}
          tabIndex={-1}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: .22 }}
        >
          <div className="tour-panel-head">
            <span className="tour-kicker">STEP {index + 1} <span>/ {steps.length}</span></span>
            <Button variant="ghost" size="icon" className="tour-close" onClick={() => finish()} aria-label="Close the tour"><X size={15} /></Button>
          </div>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          <div className="tour-dots" aria-hidden="true">{steps.map((s, i) => <span key={s.target} className={i === index ? 'tour-dot on' : 'tour-dot'} />)}</div>
          <div className="tour-actions">
            <div className="tour-actions-left">
              {index > 0 && <Button variant="ghost" size="icon" className="tour-back" onClick={prev} aria-label="Previous step"><ChevronLeft size={16} /></Button>}
              <Button variant="ghost" className="tour-quiet" onClick={() => finish()}>Skip</Button>
            </div>
            <Button
              variant="ghost"
              className="tour-primary"
              onClick={() => { if (step.tryIt) finish(true); else if (isLast) finish(); else next(); }}
            >
              {step.primary ?? (isLast ? 'Start exploring' : 'Next')}
              {!step.primary && !isLast && <ArrowRight size={15} />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>}
  </AnimatePresence>;
}

export function useTourReplay() {
  const [replay, setReplay] = useState(0);
  return { replay, requestReplay: () => setReplay(r => r + 1) };
}
