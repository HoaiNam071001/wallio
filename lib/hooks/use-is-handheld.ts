"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px), (pointer: coarse)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** true trên điện thoại/tablet (màn hẹp hoặc cảm ứng), false trên desktop có chuột. */
export function useIsHandheld(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
