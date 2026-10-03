import {describe, expect, it} from 'vitest';
import type {CoordinateSystemProblem} from '../../../types/problems.ts';
import {
    COORDINATE_FRAME,
    coordinatePosition,
    isValidCoordinateSystem
} from './coordinate-system-helpers.ts';

export const coordinateFixture: CoordinateSystemProblem = {
    kind: 'coordinate-system-foundations',
    origin: {x: 0, y: 0},
    rightAngleDegrees: 90,
    axes: {
        horizontal: {
            axisName: 'x', coordinateName: 'x', positiveUnitVector: {x: 1, y: 0},
            tickStep: 2, tickValues: [0, 2, 4, 6, 8, 10, 12]
        },
        vertical: {
            axisName: 'y', coordinateName: 'y', positiveUnitVector: {x: 0, y: 1},
            tickStep: 1, tickValues: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        }
    },
    travel: {xUnits: 6, yUnits: 5}
};

describe('coordinate-system frame contract', () => {
    it('accepts independent exact scales and boundary travel on the axes', () => {
        expect(isValidCoordinateSystem(coordinateFixture)).toBe(true);
        expect(isValidCoordinateSystem({...coordinateFixture, travel: {xUnits: 0, yUnits: 0}})).toBe(true);
        expect(isValidCoordinateSystem({...coordinateFixture, travel: {xUnits: 12, yUnits: 8}})).toBe(true);
    });

    it('rejects broken axes, scales, or travel', () => {
        const horizontal = coordinateFixture.axes.horizontal;
        const vertical = coordinateFixture.axes.vertical;
        const bad: CoordinateSystemProblem[] = [
            {...coordinateFixture, rightAngleDegrees: 45 as 90},
            {...coordinateFixture, origin: {x: 1 as 0, y: 0}},
            {...coordinateFixture, axes: {...coordinateFixture.axes, horizontal: {...horizontal, axisName: 'y' as 'x'}}},
            {...coordinateFixture, axes: {...coordinateFixture.axes, vertical: {...vertical, positiveUnitVector: {x: 1 as 0, y: 1}}}},
            {...coordinateFixture, axes: {...coordinateFixture.axes, horizontal: {...horizontal, tickValues: [0, 2, 5, 6, 8]}}},
            {...coordinateFixture, axes: {...coordinateFixture.axes, vertical: {...vertical, tickValues: [0, 1, 2, 3]}}},
            {...coordinateFixture, travel: {xUnits: 3, yUnits: 5}}
        ];
        for (const candidate of bad) expect(isValidCoordinateSystem(candidate)).toBe(false);
    });

    it('maps every displayed endpoint inside the frame and uses the separate steps', () => {
        const origin = coordinatePosition(coordinateFixture, 0, 0);
        const endpoint = coordinatePosition(coordinateFixture, 12, 8);
        expect(origin).toEqual({x: COORDINATE_FRAME.originX, y: COORDINATE_FRAME.originY});
        expect(endpoint).toEqual({
            x: COORDINATE_FRAME.originX + 6 * COORDINATE_FRAME.tickPixels,
            y: COORDINATE_FRAME.originY - 8 * COORDINATE_FRAME.tickPixels
        });
        expect(endpoint.x + 32).toBeLessThan(COORDINATE_FRAME.width);
        expect(endpoint.y - 20).toBeGreaterThan(0);
    });
});
