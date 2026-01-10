import { copyFileSync, readdirSync, unlinkSync } from "fs";

const browser = process.argv[2];

if (!browser || !["chrome", "firefox"].includes(browser)) {
  console.error("Usage: node copy_manifest.js [chrome|firefox]");
  process.exit(1);
}

const sourceManifest = `public/manifest.${browser}.json`;
const targetDir = browser === "chrome" ? "dist_chrome" : "dist_firefox";
const targetManifest = `${targetDir}/manifest.json`;

// Remove any existing manifest files first
try {
  const files = readdirSync(targetDir);
  files.forEach((file) => {
    if (file.startsWith("manifest.") && file.endsWith(".json")) {
      unlinkSync(`${targetDir}/${file}`);
      console.log(`✓ Removed ${targetDir}/${file}`);
    }
  });
} catch (err) {
  // Directory might not exist yet
}

copyFileSync(sourceManifest, targetManifest);
console.log(`✓ Copied ${sourceManifest} to ${targetManifest}`);

// Copy all files from commons folder
const commonsDir = "public/commons";
try {
  const commonFiles = readdirSync(commonsDir);
  commonFiles.forEach((file) => {
    const sourcePath = `${commonsDir}/${file}`;
    const targetPath = `${targetDir}/${file}`;
    copyFileSync(sourcePath, targetPath);
    console.log(`✓ Copied ${sourcePath} to ${targetPath}`);
  });
} catch (err) {
  console.log(`ℹ No commons folder found at ${commonsDir}`);
}
