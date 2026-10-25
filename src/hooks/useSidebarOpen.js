import { useEffect, useState } from 'react';

const desktopSidebarQuery = '(min-width: 591px)';

export function useSidebarOpen() {
  const [open, setOpen] = useState(() => window.matchMedia(desktopSidebarQuery).matches);

  useEffect(() => {
    const media = window.matchMedia(desktopSidebarQuery);
    const syncToViewport = (event) => setOpen(event.matches);
    media.addEventListener('change', syncToViewport);
    return () => media.removeEventListener('change', syncToViewport);
  }, []);

  return [open, setOpen];
}
