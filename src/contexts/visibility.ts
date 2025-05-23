import { createContext, useContext } from "react";

export const VisibilityContext = createContext<boolean>(false);

export function useElectronVisiblity() {
  return useContext(VisibilityContext);
}