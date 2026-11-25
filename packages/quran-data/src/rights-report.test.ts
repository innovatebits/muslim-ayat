import { describe, expect, it } from "vitest";
import { getContentSources } from "./reader";
import { buildContentRightsReport } from "./rights-report";

describe("content rights report", () => {
  it("is deterministic and reports every current resource once", () => {
    const sources = getContentSources();
    const report = buildContentRightsReport(sources);

    expect(report).toBe(buildContentRightsReport(sources));
    expect(report.match(/^### /gm)).toHaveLength(sources.length);
    for (const source of sources) {
      expect(report.split(`(\`${source.id}\`)`)).toHaveLength(2);
    }
    expect(report).toContain("Resource records: 13");
    expect(report).toContain("Unresolved use permissions: 52");
    expect(report).toContain("Release decision: NOT DETERMINED");
  });

  it("reports unknown permissions as unresolved instead of clearance", () => {
    const report = buildContentRightsReport(getContentSources());

    expect(report).toContain("Rights review is not complete");
    expect(report).toContain("Public display permission is unknown");
    expect(report).toContain("Public display: unknown");
    expect(report).not.toContain("CLEAR");
  });

  it("reports restricted uses separately from unknown permissions", () => {
    const sources = structuredClone(getContentSources());
    const review = sources[0]!.rightsReview;
    sources[0]!.rightsReview = {
      ...review,
      reviewStatus: "reviewed",
      rightsHolder: "Example rightsholder",
      evidence: [
        {
          kind: "terms",
          label: "Published terms",
          url: "https://example.test/terms",
        },
      ],
      attribution: { status: "required", text: "Credit the rightsholder." },
      reviewerRole: "Legal reviewer",
      reviewedAt: "2026-11-25T10:00:00.000Z",
      permissions: {
        publicDisplay: "permitted",
        redistribution: "not-permitted",
        offlineCaching: "unknown",
        commercialUse: "not-permitted",
      },
    };

    const report = buildContentRightsReport(sources);

    expect(report).toContain("Restricted use permissions: 2");
    expect(report).toContain("Redistribution: not-permitted");
    expect(report).toContain("Offline caching: unknown");
  });

  it("fails on malformed metadata and incomplete resource-category coverage", () => {
    const sources = getContentSources();
    const malformed = structuredClone(sources);
    Object.assign(malformed[0]!.rightsReview.permissions, { publicDisplay: "allowed" });

    expect(() => buildContentRightsReport(malformed)).toThrow();
    expect(() => buildContentRightsReport([sources[0]])).toThrow(
      "Rights report is missing resource categories",
    );
  });
});