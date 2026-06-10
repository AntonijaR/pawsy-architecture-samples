export type EligibleUserProfile = {
    userId: string;
    effectiveLat: number;
    effectiveLng: number;
    visibilityRadiusKilometers: number;
};

type BoundingBox = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

type SourceLocation = BoundingBox & {
    effectiveLat: number;
    effectiveLng: number;
};

export async function findPossibleUserMatches(params: {
    prisma: any;
    sourceUserId: string;
    countryAlpha3: string;
    sourceLocation: SourceLocation;
}): Promise<EligibleUserProfile[]> {
    const { prisma, sourceUserId, countryAlpha3, sourceLocation } = params;

    /**
     * Matching can become expensive as the database grows.
     *
     * Instead of fetching all dogs immediately, Pawsy first narrows the candidate
     * pool at the user-profile level. This matters because one user can own
     * multiple dogs.
     *
     * The query applies two cheap database-level filters:
     *
     * 1. Source visibility box:
     *    Candidate users must be inside the source user's visibility area.
     *
     * 2. Candidate visibility box:
     *    The source user must also be inside the candidate user's visibility area.
     *
     * The second condition makes visibility reciprocal and avoids showing matches
     * where only one user has opted into seeing the other.
     */
    return prisma.userProfile.findMany({
        where: {
            userId: {
                not: sourceUserId,
            },

            countryAlpha3,
            visibilityActive: true,

            effectiveLat: {
                gte: sourceLocation.minLat,
                lte: sourceLocation.maxLat,
            },
            effectiveLng: {
                gte: sourceLocation.minLng,
                lte: sourceLocation.maxLng,
            },

            visibilityBoxMinLat: {
                lte: sourceLocation.effectiveLat,
            },
            visibilityBoxMaxLat: {
                gte: sourceLocation.effectiveLat,
            },
            visibilityBoxMinLng: {
                lte: sourceLocation.effectiveLng,
            },
            visibilityBoxMaxLng: {
                gte: sourceLocation.effectiveLng,
            },
        },
        select: {
            userId: true,
            effectiveLat: true,
            effectiveLng: true,
            visibilityRadiusKilometers: true,
        },
    });
}