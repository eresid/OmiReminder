import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderAppIcon } from "../src/main/icons/icons";
import { encodePng } from "../src/main/icons/png";

const icon = renderAppIcon(512, "dark");
writeFileSync(join(process.cwd(), "build", "icon.png"), encodePng(icon.width, icon.height, icon.data));
