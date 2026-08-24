import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {SquareAreaUnitId} from '../../../types/problems.ts';
import {ShapeUnitSquareGridGenerator} from './generator.ts';

const generator = new ShapeUnitSquareGridGenerator();

describe('ShapeUnitSquareGridGenerator', () => {
    it('requires a typed mathematical grid kind', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({gridKind: 'other'} as never))
            .toThrow('single-unit, coverage, or product');
    });

    it('authors one canonical unit square', () => {
        expect(generator.generate({gridKind: 'single-unit'}).data).toEqual({
            kind: 'unit-square-grid',
            rows: 1,
            columns: 1,
            tileCount: 1,
            unitId: 'square-unit'
        });
    });

    it.each([
        ['square-unit'],
        ['square-centimeter'],
        ['square-meter'],
        ['square-inch'],
        ['square-foot']
    ] as const)('retains the semantic %s scale on a complete grid', (unitId) => {
        const data = generator.generate({gridKind: 'coverage', unitId}).data;

        expect(data.kind).toBe('unit-square-grid');
        expect(data.unitId).toBe(unitId satisfies SquareAreaUnitId);
        expect(data.tileCount).toBe(data.rows * data.columns);
    });

    it('uses the same canonical contract for coverage and product relations', () => {
        setSeed(13);
        const coverage = generator.generate({gridKind: 'coverage'}).data;
        setSeed(13);
        const product = generator.generate({gridKind: 'product'}).data;

        expect(product).toEqual(coverage);
        expect(product).not.toHaveProperty('model');
        expect(product).not.toHaveProperty('formula');
    });

    it('rejects unsupported square-area units', () => {
        expect(() => generator.generate({
            gridKind: 'coverage',
            unitId: 'centimeter'
        } as never)).toThrow('supported square-area unit');
    });
});
