import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const GAP = 6;
const VIEWPORT_MARGIN = 8;

/**
 * Open state for a popover and its anchor button. Light dismiss closes the popover on
 * `pointerdown`, so a click on the anchor right after that must not reopen it.
 */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const closedAt = useRef(0);
  const toggle = useCallback(() => {
    setOpen((current) => {
      if (!current && Date.now() - closedAt.current < 200) {
        return false;
      }
      return !current;
    });
  }, []);
  const close = useCallback(() => {
    closedAt.current = Date.now();
    setOpen(false);
  }, []);
  return { open, toggle, close };
}

interface PopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  align?: "start" | "end";
  label: string;
  children: ReactNode;
}

/**
 * A floating panel in the top layer, built on the native Popover API. It appears above modal
 * dialogs and closes on Escape or a click outside.
 */
export function Popover({ anchorRef, open, onClose, align = "start", label, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const popover = ref.current;
    const anchor = anchorRef.current;
    if (!popover) {
      return;
    }
    if (!open) {
      if (popover.matches(":popover-open")) {
        popover.hidePopover();
      }
      return;
    }
    popover.showPopover();
    if (anchor) {
      const anchorRect = anchor.getBoundingClientRect();
      const { width, height } = popover.getBoundingClientRect();
      // Open below the anchor if it fits, otherwise on the side with more space, and keep the
      // whole panel inside the window.
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;
      const fitsBelow = GAP + height + VIEWPORT_MARGIN <= spaceBelow;
      const preferredTop =
        fitsBelow || spaceBelow >= spaceAbove ? anchorRect.bottom + GAP : anchorRect.top - GAP - height;
      const top = Math.min(Math.max(VIEWPORT_MARGIN, preferredTop), window.innerHeight - height - VIEWPORT_MARGIN);
      const preferredLeft = align === "end" ? anchorRect.right - width : anchorRect.left;
      const left = Math.min(Math.max(VIEWPORT_MARGIN, preferredLeft), window.innerWidth - width - VIEWPORT_MARGIN);
      popover.style.top = `${String(Math.round(top))}px`;
      popover.style.left = `${String(Math.round(left))}px`;
    }
  }, [open, anchorRef, align]);

  useLayoutEffect(() => {
    const popover = ref.current;
    if (!popover) {
      return;
    }
    const handleToggle = (event: Event): void => {
      if ((event as ToggleEvent).newState === "closed") {
        onClose();
      }
    };
    popover.addEventListener("toggle", handleToggle);
    return () => {
      popover.removeEventListener("toggle", handleToggle);
    };
  }, [onClose]);

  return (
    <div ref={ref} popover="auto" className="popover" role="dialog" aria-label={label}>
      {open ? children : null}
    </div>
  );
}
