"use client";

import { getCountries } from "libphonenumber-js/min";
import { useMemo, useSyncExternalStore } from "react";
import { callingCode } from "./validation";

export interface CountryOption {
  code: string;
  name: string;
  dial: string;
}

const noSubscribe = () => () => {};
/** False during server rendering and hydration, true afterwards. */
export const useIsClient = () => useSyncExternalStore(noSubscribe, () => true, () => false);

function buildCountries(): CountryOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  return getCountries()
    .map((code) => ({ code, name: names?.of(code) ?? code, dial: callingCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/**
 * Country list for phone-code and country selects. Names come from the
 * browser's Intl data, which can differ from Node's, so the list only appears
 * after hydration.
 */
export function useCountries(): CountryOption[] {
  const isClient = useIsClient();
  return useMemo(() => (isClient ? buildCountries() : []), [isClient]);
}
