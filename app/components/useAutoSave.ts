'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export function useAutoSave() {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const dirty = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const markDirty = useCallback(() => {
    sequence.current += 1;
    dirty.current = true;
    setStatus('unsaved');
    setError('');
  }, []);

  const reset = useCallback(() => {
    sequence.current += 1;
    dirty.current = false;
    setStatus('idle');
    setError('');
  }, []);

  const save = useCallback((url: string, values: Record<string, unknown>) => {
    const requestSequence = ++sequence.current;
    queue.current = queue.current.catch(() => undefined).then(async () => {
      // Coalesce fast edits: only send the latest complete form snapshot.
      if (requestSequence !== sequence.current) return;
      setStatus('saving');
      setError('');
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(values),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not save this change.');
        if (requestSequence === sequence.current) {
          dirty.current = false;
          setStatus('saved');
        }
      } catch (saveError) {
        if (requestSequence === sequence.current) {
          dirty.current = true;
          setStatus('error');
          setError(saveError instanceof Error ? saveError.message : 'Could not save this change.');
        }
      }
    });
    return queue.current;
  }, []);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const waitForPendingSaveBeforeNavigation = (event: MouseEvent) => {
      if (!dirty.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute('download')) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void queue.current.then(() => {
        if (!dirty.current) {
          window.location.assign(destination.href);
        } else if (window.confirm('This change could not be saved. Leave this page and discard the unsaved edit?')) {
          dirty.current = false;
          window.location.assign(destination.href);
        }
      });
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    document.addEventListener('click', waitForPendingSaveBeforeNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeLeaving);
      document.removeEventListener('click', waitForPendingSaveBeforeNavigation, true);
    };
  }, []);

  return { status, error, markDirty, reset, save };
}
