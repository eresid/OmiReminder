import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}

/** A modal built on the native `<dialog>` element: focus trap, Escape, and backdrop for free. */
export function Dialog({ open, onClose, className, labelledBy, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={["dialog", className].filter(Boolean).join(" ")}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        // A click on the backdrop targets the dialog element itself.
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
