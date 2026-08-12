import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {MeasurementToolSelectionGenerator} from './generator.ts';

describe('MeasurementToolSelectionGenerator', () => {
    it.each([
        [Scope.PhysicalRuler, 'ruler'],
        [Scope.Tapemeter, 'tape']
    ] as const)('generates an object suited to %s', (label, expected) => {
        const stub = new MeasurementToolSelectionGenerator().generate({tool: label});
        expect(stub?.data.correctTool).toBe(expected);
        expect(stub?.data.tools).toEqual(['ruler', 'tape']);
    });
});
