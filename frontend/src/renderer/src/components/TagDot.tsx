import type { TagColor } from "../../../shared/types";

/** The color of a tag. The tag name is always shown next to it, so color is not the only signal. */
export function TagDot({ color }: { color: TagColor | null }) {
  return <span className={["tag-dot", color ? `tag-color-${color}` : ""].join(" ")} aria-hidden="true" />;
}
