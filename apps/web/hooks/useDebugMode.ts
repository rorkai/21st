import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { isDebugAtom } from '@/lib/atoms';

export function useDebugMode() {
  const [isDebug, setIsDebug] = useAtom(isDebugAtom);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        setIsDebug(prevState => !prevState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsDebug]);

  return isDebug;
}