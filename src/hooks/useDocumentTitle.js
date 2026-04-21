import { useEffect } from 'react';

const APP_TITLE = 'CodeHerWay CEO OS';

export function useDocumentTitle(pageTitle) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${APP_TITLE}` : APP_TITLE;
  }, [pageTitle]);
}
