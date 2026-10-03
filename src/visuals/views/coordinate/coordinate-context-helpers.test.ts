import {describe, expect, it} from 'vitest';
import type {ContextualCoordinateProblem} from '../../../types/problems.ts';
import {
    CONTEXT_GRID,
    contextPointPosition,
    isValidContextualCoordinate,
    locationLetter,
    locationName
} from './coordinate-context-helpers.ts';

const fixture: ContextualCoordinateProblem = {
    kind: 'contextual-coordinate-locations',
    situation: {
        kind: 'park-map', originLandmark: 'park-gate',
        horizontalQuantity: {kind: 'eastward-distance', positiveDirection: 'east', unitId: 'block'},
        verticalQuantity: {kind: 'northward-distance', positiveDirection: 'north', unitId: 'block'}
    },
    locations: [
        {id: 'pond', xValue: 2, yValue: 5},
        {id: 'garden', xValue: 6, yValue: 3},
        {id: 'playground', xValue: 8, yValue: 7}
    ],
    referenceLocationId: 'garden'
};

describe('contextual coordinate grid contract', () => {
    it('accepts the exact park semantics, references, and distinct bounded points', () => {
        expect(isValidContextualCoordinate(fixture)).toBe(true);
        for (const referenceLocationId of ['pond', 'garden', 'playground'] as const) {
            expect(isValidContextualCoordinate({...fixture, referenceLocationId})).toBe(true);
        }
        expect(locationLetter('pond')).toBe('A');
        expect(locationLetter('garden')).toBe('B');
        expect(locationLetter('playground')).toBe('C');
        expect(locationName('garden')).toBe('Garden');
    });

    it('rejects direction, unit, order, range, duplicates, and missing reference', () => {
        const [pond, garden, playground] = fixture.locations;
        const invalid: ContextualCoordinateProblem[] = [
            {...fixture, situation: {...fixture.situation, originLandmark: 'other' as 'park-gate'}},
            {...fixture, situation: {...fixture.situation, horizontalQuantity: {
                ...fixture.situation.horizontalQuantity, positiveDirection: 'west' as 'east'
            }}},
            {...fixture, situation: {...fixture.situation, verticalQuantity: {
                ...fixture.situation.verticalQuantity, unitId: 'meter' as 'block'
            }}},
            {...fixture, locations: [garden, pond, playground] as unknown as ContextualCoordinateProblem['locations']},
            {...fixture, locations: [pond, {...garden, xValue: 9 as 8}, playground]},
            {...fixture, locations: [pond, {...garden, xValue: 2, yValue: 5}, playground]},
            {...fixture, referenceLocationId: 'bench' as 'pond'}
        ];
        invalid.forEach(problem => expect(isValidContextualCoordinate(problem)).toBe(false));
    });

    it('places first-quadrant values within the visible named axes', () => {
        expect(contextPointPosition({xValue: 1, yValue: 1})).toEqual({
            x: CONTEXT_GRID.originX + CONTEXT_GRID.cell,
            y: CONTEXT_GRID.originY - CONTEXT_GRID.cell
        });
        const upper = contextPointPosition({xValue: 8, yValue: 8});
        expect(upper.x + 16).toBeLessThan(CONTEXT_GRID.width);
        expect(upper.y - 16).toBeGreaterThan(0);
    });
});
