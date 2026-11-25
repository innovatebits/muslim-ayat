import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import {
  buildQulTextResource,
  QuranCompanionBundleSchema,
  type QuranTextResourceMetadata,
} from "@muslim-ayat/quran-data";

const [translationArchiveArgument, transliterationArchiveArgument] = process.argv.slice(2);
const sourceDirectory = resolve("packages/quran-data/src/data/source");
const companionPath = resolve("packages/quran-data/src/data/companions.json");

const resources = [
  {
    archiveArgument: translationArchiveArgument,
    sourcePath: resolve(sourceDirectory, "saheeh-international-simple.json"),
    entryName: "en-sahih-international-simple.json",
    metadata: {
      id: "saheeh-international",
      name: "Saheeh International",
      locale: "en",
      kind: "translation",
      source: {
        source: "Quranic Universal Library (QUL)",
        edition: "Saheeh International, simple JSON, ayah-by-ayah (resource 193)",
        license: null,
        rightsStatus: "unknown",
        url: "https://qul.tarteel.ai/resources/translation/193",
        sha256: "",
        verifiedAt: "2026-11-24T20:48:23.376Z",
      },
    } satisfies Omit<QuranTextResourceMetadata, "source"> & {
      source: Omit<QuranTextResourceMetadata["source"], "sha256"> & { sha256: string };
    },
  },
  {
    archiveArgument: transliterationArchiveArgument,
    sourcePath: resolve(sourceDirectory, "english-transliteration-tajweed-simple.json"),
    entryName: "english-transliteration-tajweed-simple.json",
    metadata: {
      id: "english-transliteration-tajweed",
      name: "English Transliteration (Tajweed)",
      locale: "en-Latn",
      kind: "transliteration",
      source: {
        source: "Quranic Universal Library (QUL)",
        edition: "English Transliteration (Tajweed), simple JSON (resource export)",
        license: null,
        rightsStatus: "unknown",
        url: "https://qul.tarteel.ai/resources/transliteration",
        sha256: "",
        verifiedAt: "2026-11-24T20:48:23.376Z",
      },
    } satisfies Omit<QuranTextResourceMetadata, "source"> & {
      source: Omit<QuranTextResourceMetadata["source"], "sha256"> & { sha256: string };
    },
  },
] as const;

async function loadResource(resource: (typeof resources)[number]) {
  let sourceBytes: Uint8Array;
  if (resource.archiveArgument) {
    const archiveBytes = await readFile(resolve(resource.archiveArgument));
    const entries = unzipSync(archiveBytes);
    const entry = entries[resource.entryName];
    if (!entry) {
      throw new Error(`Missing ${resource.entryName} in ${resource.archiveArgument}`);
    }
    sourceBytes = entry;
    await mkdir(dirname(resource.sourcePath), { recursive: true });
    await writeFile(resource.sourcePath, sourceBytes);
  } else {
    sourceBytes = await readFile(resource.sourcePath);
  }

  const checksum = createHash("sha256").update(sourceBytes).digest("hex");
  const metadata: QuranTextResourceMetadata = {
    ...resource.metadata,
    source: { ...resource.metadata.source, sha256: checksum },
  };

  return buildQulTextResource(JSON.parse(strFromU8(sourceBytes)) as unknown, metadata);
}

try {
  if (Boolean(translationArchiveArgument) !== Boolean(transliterationArchiveArgument)) {
    throw new Error("Provide both the translation and transliteration ZIP paths, or neither.");
  }

  const translation = await loadResource(resources[0]);
  const transliteration = await loadResource(resources[1]);
  const bundle = QuranCompanionBundleSchema.parse({
    translations: [translation],
    transliterations: [transliteration],
  });

  await writeFile(companionPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
  console.log(`Imported ${Object.keys(translation.verses).length} translation and transliteration ayahs.`);
  console.log(`Translation source checksum: ${translation.source.sha256}`);
  console.log(`Transliteration source checksum: ${transliteration.source.sha256}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to import QUL companion resources.");
  process.exitCode = 1;
}