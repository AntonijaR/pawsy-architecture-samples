import {EligibleUserProfile} from "./find-eligible-users";

type Coordinates = {
    lat: number;
    lng: number;
};

export function filterUsersByExactDistance(params: {
    source: {
        lat: number;
        lng: number;
        radiusKm: number;
    };
    candidates: EligibleUserProfile[];
}): {
    eligibleUsers: EligibleUserProfile[];
    userDistanceMap: Map<string, number>;
} {
    const userDistanceMap = new Map<string, number>();

    const eligibleUsers = params.candidates.filter((candidate) => {
        const distanceKm = haversineDistanceKm(
            { lat: params.source.lat, lng: params.source.lng },
            { lat: candidate.effectiveLat, lng: candidate.effectiveLng },
        );

        const isWithinBothRadii =
            distanceKm <= params.source.radiusKm &&
            distanceKm <= candidate.visibilityRadiusKilometers;

        if (isWithinBothRadii) {
            userDistanceMap.set(candidate.userId, distanceKm);
        }

        return isWithinBothRadii;
    });

    return {
        eligibleUsers,
        userDistanceMap,
    };
}

function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
    const earthRadiusKm = 6371;

    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);

    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);

    const haversine =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}