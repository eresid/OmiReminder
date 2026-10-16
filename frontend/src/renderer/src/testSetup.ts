// jsdom does not implement the native <dialog> modal methods or the Popover API that the
// renderer relies on. These minimal stand-ins keep the same open and closed state.
// eslint-disable-next-line @typescript-eslint/unbound-method -- called with `call` below
const nativeMatches = Element.prototype.matches;

Element.prototype.matches = function matches(this: Element, selector: string): boolean {
  if (selector === ":popover-open") {
    return this.hasAttribute("data-popover-open");
  }
  return nativeMatches.call(this, selector);
} as typeof Element.prototype.matches;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
  this.setAttribute("open", "");
};

HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
  this.removeAttribute("open");
};

HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement): void {
  this.setAttribute("data-popover-open", "");
};

HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement): void {
  this.removeAttribute("data-popover-open");
};

// jsdom's default style sheet hides every [popover], and its selector engine does not know
// `:popover-open`, so open popovers are shown explicitly.
const style = document.createElement("style");
style.textContent = "[popover][data-popover-open] { display: block !important; }";
document.head.append(style);
