import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Mercenary } from "../domain/types";
import { CLASSES } from "../data/catalog";
import { portrait } from "../render/sprite";

export function Avatar({
  m,
  large = false,
}: {
  m: Mercenary;
  large?: boolean;
}) {
  return (
    <img
      className={`avatar ${large ? "large" : ""}`}
      src={portrait(m)}
      alt={`${m.name} · ${CLASSES[m.classId].name}`}
    />
  );
}
export function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3Z" />
        <path d="M9 20v-7h6v7M7 8v-4" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-3a6 6 0 0 1 12 0v3ZM16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5" />
      </>
    ),
    party: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M17.5 14v7M14 17.5h7" />
      </>
    ),
    sword: (
      <>
        <path d="m5 3 14 14m-4 0 4-4m-3 3 5 5M19 3 5 17m0-4 4 4m-1-1-5 5" />
      </>
    ),
    settings: (
      <>
        <path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  };
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.sword}
    </svg>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="닫기"
          onClick={onClose}
          autoFocus
        >
          ✕
        </button>
      </div>
      <div className="sheet-body">{children}</div>
    </dialog>
  );
}
export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} / 5`}>
      {"★".repeat(n)}
      <span>{"★".repeat(5 - n)}</span>
    </span>
  );
}
