"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ReactNode,
} from "react";
import {
  translateDeskPhrase,
  type LanguageCode,
} from "../lib/desk-i18n";

const DeskLanguageContext = createContext<LanguageCode>("en");
const translatedAttributes = [
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "label",
  "placeholder",
  "title",
] as const;

export function DeskLanguageProvider({
  language,
  children,
}: {
  language: LanguageCode;
  children: ReactNode;
}) {
  return (
    <DeskLanguageContext.Provider value={language}>
      {children}
    </DeskLanguageContext.Provider>
  );
}

export function useDeskLanguage(): LanguageCode {
  return useContext(DeskLanguageContext);
}

function translateTree(node: ReactNode, language: LanguageCode): ReactNode {
  if (typeof node === "string") {
    return translateDeskPhrase(language, node);
  }
  if (Array.isArray(node)) {
    return node.map((child) => translateTree(child, language));
  }
  if (!isValidElement<Record<string, unknown>>(node)) {
    return node;
  }

  const props = { ...node.props };
  if ("children" in props) {
    props.children = translateTree(props.children as ReactNode, language);
  }
  for (const attribute of translatedAttributes) {
    const value = props[attribute];
    if (typeof value === "string") {
      props[attribute] = translateDeskPhrase(language, value);
    }
  }
  return cloneElement(node, props);
}

export function DeskLocalized({ children }: { children: ReactNode }) {
  const language = useDeskLanguage();
  return <>{translateTree(children, language)}</>;
}
