// electron-builder hook. Replaces the 20 MB Chromium license file with a short note that links to
// the same file in the official Electron release. See README.md, "Building the Windows app".
const fs = require("node:fs/promises");
const path = require("node:path");
const electronVersion = require("electron/package.json").version;

exports.default = async function afterPack(context) {
  const { appOutDir } = context;
  await fs.rm(path.join(appOutDir, "LICENSES.chromium.html"), { force: true });
  await fs.writeFile(
    path.join(appOutDir, "LICENSES.txt"),
    [
      "OmiReminder is built with Electron, which includes Chromium and other open-source components.",
      "",
      "Electron license: LICENSE.electron.txt in this folder.",
      "",
      `Licenses of Chromium and its components for Electron ${electronVersion} are in the file`,
      `LICENSES.chromium.html inside the official Electron ${electronVersion} release archive:`,
      `https://github.com/electron/electron/releases/tag/v${electronVersion}`,
      "",
    ].join("\r\n")
  );
};
