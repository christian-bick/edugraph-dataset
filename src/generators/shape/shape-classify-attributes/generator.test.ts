import {beforeEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as shapeHelpers from '../helpers.ts';
import {
    getDefiningAttributeStatements,
    getShapeDefinition,
    NON_DEFINING_ATTRIBUTE_STATEMENTS
} from '../helpers.ts';
import {ShapeClassifyAttributesGenerator} from './generator.ts';

describe('ShapeClassifyAttributesGenerator', () => {
    let generator: ShapeClassifyAttributesGenerator;

    beforeEach(() => {
        generator = new ShapeClassifyAttributesGenerator();
        setSeed(42);
    });

    it('has the shape problem type and accepts its empty config', () => {
        expect(generator.type).toBe('shape');
        expect(generator.generate({})).not.toBeNull();
    });

    it('rejects a null config before generating', () => {
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: shape-classify-attributes] Validation Error'
        );
    });

    it('returns null when a selected ontology label has no shape mapping', () => {
        const shapeNameSpy = vi.spyOn(shapeHelpers, 'shapeNameFromLabel').mockReturnValueOnce(null);

        expect(generator.generate({})).toBeNull();
        expect(shapeNameSpy).toHaveBeenCalledOnce();
    });

    it('generates exactly one defining option and three non-defining options', () => {
        const stub = generator.generate({})!;
        const {shape, definition, options, answer} = stub.data;
        const definingOptions = options.filter(option => option.kind === 'defining');
        const nonDefiningOptions = options.filter(option => option.kind === 'non-defining');

        expect(options).toHaveLength(4);
        expect(options.map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(definingOptions).toHaveLength(1);
        expect(nonDefiningOptions).toHaveLength(3);
        expect(nonDefiningOptions.map(option => option.text).sort()).toEqual(
            [...NON_DEFINING_ATTRIBUTE_STATEMENTS].sort()
        );
        expect(getDefiningAttributeStatements(shape)).toContain(definingOptions[0].text);
        expect(definition).toEqual(getShapeDefinition(shape));
        expect(answer).toBe(definingOptions[0].id);
    });

    it('varies shapes, defining statements and answer positions across seeds', () => {
        const shapes = new Set<string>();
        const definingStatements = new Set<string>();
        const answerPositions = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const stub = generator.generate({})!;
            const definingOption = stub.data.options.find(option => option.kind === 'defining')!;

            shapes.add(stub.data.shape);
            definingStatements.add(definingOption.text);
            answerPositions.add(stub.data.answer);
        }

        expect(shapes.size).toBe(5);
        expect(definingStatements.size).toBeGreaterThanOrEqual(6);
        expect(answerPositions.size).toBe(4);
    });

    it('is deterministic for the same seed', () => {
        setSeed('classification-example');
        const first = generator.generate({});
        setSeed('classification-example');
        const second = generator.generate({});

        expect(second).toEqual(first);
    });
});
