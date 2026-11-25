import { describe, expect, it } from "vitest";
import {
  QuranRightsReviewSchema,
  preserveQuranSourceRights,
  type QuranRightsReview,
  type QuranSource,
} from "./index";

const unknownReview: QuranRightsReview = {
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

const source: QuranSource = {
  source: "Quranic Universal Library (QUL)",
  edition: "Test edition 1",
  license: null,
  url: "https://example.test/source",
  sha256: "a".repeat(64),
  verifiedAt: "2026-11-24T20:34:27.044Z",
  rightsReview: unknownReview,
};

describe("Quran rights review metadata", () => {
  it("accepts explicit unknown permissions without implying clearance", () => {
    expect(QuranRightsReviewSchema.safeParse(unknownReview).success).toBe(true);
  });

  it("requires evidence and reviewer details for a completed review", () => {
    expect(
      QuranRightsReviewSchema.safeParse({
        ...unknownReview,
        reviewStatus: "reviewed",
      }).success,
    ).toBe(false);
  });

  it("rejects permissions on an unreviewed resource", () => {
    expect(
      QuranRightsReviewSchema.safeParse({
        ...unknownReview,
        permissions: { ...unknownReview.permissions, publicDisplay: "permitted" },
      }).success,
    ).toBe(false);
  });

  it("rejects unreviewed attribution claims and unsupported rightsholder details", () => {
    expect(
      QuranRightsReviewSchema.safeParse({
        ...unknownReview,
        attribution: { status: "required", text: "Credit the rightsholder." },
      }).success,
    ).toBe(false);
    expect(
      QuranRightsReviewSchema.safeParse({
        ...unknownReview,
        rightsHolder: "Example rightsholder",
      }).success,
    ).toBe(false);
  });

  it("accepts a reviewed resource with a restricted use", () => {
    expect(
      QuranRightsReviewSchema.safeParse({
        ...unknownReview,
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
      }).success,
    ).toBe(true);
  });

  it("preserves a matching rights decision while allowing integrity metadata to refresh", () => {
    const reviewed = QuranRightsReviewSchema.parse({
      ...unknownReview,
      reviewStatus: "reviewed",
      evidence: [
        {
          kind: "license",
          label: "License text",
          url: "https://example.test/license",
        },
      ],
      reviewerRole: "Legal reviewer",
      reviewedAt: "2026-11-25T10:00:00.000Z",
    });
    const previous = { ...source, rightsReview: reviewed };
    const refreshed = preserveQuranSourceRights(
      {
        ...source,
        sha256: "b".repeat(64),
        verifiedAt: "2026-11-25T11:00:00.000Z",
      },
      previous,
    );

    expect(refreshed.sha256).toBe("b".repeat(64));
    expect(refreshed.verifiedAt).toBe("2026-11-25T11:00:00.000Z");
    expect(refreshed.rightsReview).toEqual(reviewed);
    expect(refreshed.rightsReview.reviewedAt).toBe("2026-11-25T10:00:00.000Z");
  });

  it("does not transfer decisions to a different edition", () => {
    const previous = {
      ...source,
      rightsReview: QuranRightsReviewSchema.parse({
        ...unknownReview,
        reviewStatus: "reviewed",
        evidence: [
          {
            kind: "license",
            label: "License text",
            url: "https://example.test/license",
          },
        ],
        reviewerRole: "Legal reviewer",
        reviewedAt: "2026-11-25T10:00:00.000Z",
      }),
    };
    const next = { ...source, edition: "Test edition 2" };

    expect(preserveQuranSourceRights(next, previous).rightsReview).toEqual(unknownReview);
  });
});