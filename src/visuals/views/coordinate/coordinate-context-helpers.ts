import type {
    ContextualCoordinateLocation,
    ContextualCoordinateLocationId,
    ContextualCoordinateProblem
} from '../../../types/problems.ts';

export const CONTEXT_GRID = {
    width: 470,
    height: 450,
    originX: 70,
    originY: 390,
    cell: 42,
    maximum: 8
} as const;

export const locationIds = ['pond', 'garden', 'playground'] as const;
export const locationLetters = ['A', 'B', 'C'] as const;

export const locationName = (id: ContextualCoordinateLocationId): string =>
    id === 'pond' ? 'Pond' : id === 'garden' ? 'Garden' : 'Playground';

export const locationLetter = (id: ContextualCoordinateLocationId): string =>
    locationLetters[locationIds.indexOf(id)];

const validValue = (value: unknown): boolean =>
    Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= CONTEXT_GRID.maximum;

/** The fixed park semantics and every location must agree with the drawn grid. */
export function isValidContextualCoordinate(data: ContextualCoordinateProblem): boolean {
    if (!data || data.kind !== 'contextual-coordinate-locations'
        || data.situation?.kind !== 'park-map'
        || data.situation.originLandmark !== 'park-gate'
        || data.situation.horizontalQuantity?.kind !== 'eastward-distance'
        || data.situation.horizontalQuantity.positiveDirection !== 'east'
        || data.situation.horizontalQuantity.unitId !== 'block'
        || data.situation.verticalQuantity?.kind !== 'northward-distance'
        || data.situation.verticalQuantity.positiveDirection !== 'north'
        || data.situation.verticalQuantity.unitId !== 'block'
        || !Array.isArray(data.locations)
        || data.locations.length !== locationIds.length
        || !locationIds.includes(data.referenceLocationId)) return false;
    if (!data.locations.every((location, index) => location
        && location.id === locationIds[index]
        && validValue(location.xValue)
        && validValue(location.yValue))) return false;
    return new Set(data.locations.map(location => `${location.xValue},${location.yValue}`)).size === 3;
}

export function contextPointPosition(location: Pick<ContextualCoordinateLocation<ContextualCoordinateLocationId>, 'xValue' | 'yValue'>): {
    x: number; y: number;
} {
    return {
        x: CONTEXT_GRID.originX + location.xValue * CONTEXT_GRID.cell,
        y: CONTEXT_GRID.originY - location.yValue * CONTEXT_GRID.cell
    };
}
