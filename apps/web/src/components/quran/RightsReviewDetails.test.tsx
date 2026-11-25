import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { QuranRightsReview } from "@muslim-ayat/quran-data";
import { RightsReviewDetails } from "./RightsReviewDetails";

const unknownRightsReview: QuranRightsReview = {
  reviewStatus: "unreviewed",
  rightsHolder: null,
  evidence: [],
  attribution: { status: "unknown", text: null },
  reviewerRole: null,
  reviewedAt: null,
  permissions: {
    publicDisplay: "unknown",
    redistribution: "unknown",
    offlineCaching: "unknown",
    commercialUse: "unknown",
  },
};

describe("RightsReviewDetails", () => {
  it("discloses unresolved permissions and the absence of evidence", () => {
    const markup = renderToStaticMarkup(
      createElement(RightsReviewDetails, {
        label: "Uthmani Quran text",
        rightsReview: unknownRightsReview,
      }),
    );

    expect(markup).toContain("Unreviewed; permissions unresolved");
    expect(markup).toContain("Public display: Unknown");
    expect(markup).toContain("Redistribution: Unknown");
    expect(markup).toContain("No rights evidence recorded.");
  });

  it("shows independently permitted and restricted uses with linked evidence", () => {
    const markup = renderToStaticMarkup(
      createElement(RightsReviewDetails, {
        label: "Example translation",
        rightsReview: {
          ...unknownRightsReview,
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
        },
      }),
    );

    expect(markup).toContain("Public display: Permitted");
    expect(markup).toContain("Redistribution: Not permitted");
    expect(markup).toContain("Attribution</dt><dd>Required: Credit the rightsholder.");
    expect(markup).toContain('href="https://example.test/terms"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain("Reviewer role");
    expect(markup).toContain("2026-11-25T10:00:00.000Z");
  });
});