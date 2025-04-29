import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";

type Page = 'settings' | 'chat';

interface UsePages {
  currentPages: Page[];
  isOpen: (page: Page) => boolean;
  openPage: (page: Page) => void;
  closePage: (page: Page) => void;
  togglePage: (page: Page) => void;
}

// i was gonna set use a set, but those dont work with storage
const pagesAtom = atomWithStorage<Page[]>('pages', []);

const usePages = () => {
  const [currentPages, setCurrentPages] = useAtom(pagesAtom);

  const isOpen = (page: Page) => {
    return currentPages.includes(page);
  };

  const openPage = (page: Page) => {
    setCurrentPages((prev) => {
      if (prev.includes(page)) return prev;
      return [...prev, page];
    });
  };

  const closePage = (page: Page) => {
    setCurrentPages((prev) => prev.filter(p => p !== page));
  };

  const togglePage = (page: Page) => {
    setCurrentPages((prev) => {
      if (prev.includes(page)) {
        return prev.filter(p => p !== page);
      } else {
        return [...prev, page];
      }
    });
  };

  return { currentPages, isOpen, openPage, closePage, togglePage } as UsePages;
};

export default usePages;
