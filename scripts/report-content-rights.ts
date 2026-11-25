import { getContentSources } from "@muslim-ayat/quran-data/reader";
import { buildContentRightsReport } from "@muslim-ayat/quran-data/rights-report";

try {
  process.stdout.write(buildContentRightsReport(getContentSources()));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to generate the rights report.");
  process.exitCode = 1;
}