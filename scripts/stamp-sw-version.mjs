// Stamp public/sw.js với version mới mỗi lần build, để service worker tự xoá
// RUNTIME cache cũ (activate handler trong sw.js) thay vì giữ mãi layout cũ khi offline.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const swPath = fileURLToPath(new URL("../public/sw.js", import.meta.url));
const version = `wallio-${Date.now().toString(36)}`;

const content = readFileSync(swPath, "utf8");
const updated = content.replace(/const VERSION = ".*";/, `const VERSION = "${version}";`);

if (updated === content) {
  throw new Error(`Không tìm thấy dòng "const VERSION = ...;" trong ${swPath}`);
}

writeFileSync(swPath, updated);
console.log(`[stamp-sw-version] VERSION -> ${version}`);
