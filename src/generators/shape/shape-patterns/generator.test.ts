import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapePatternProblem} from '../../../types/problems.ts';
import {ShapePatternsGenerator} from './generator.ts';
import {ShapePatternsGeneratorConfig} from './spec.ts';

const generator = new ShapePatternsGenerator();

const configs = {
    generate: {
        generatesPattern: true,
        recognizesEmergentFeature: false,
        articulateVisually: true,
        classifyFeature: false,
        understandProcedure: false,
        articulateTextually: false
    },
    identify: {
        generatesPattern: false,
        recognizesEmergentFeature: true,
        articulateVisually: false,
        classifyFeature: true,
        understandProcedure: false,
        articulateTextually: false
    },
    explain: {
        generatesPattern: true,
        recognizesEmergentFeature: true,
        articulateVisually: false,
        classifyFeature: false,
        understandProcedure: true,
        articulateTextually: true
    }
} satisfies Record<ShapePatternProblem['task'], ShapePatternsGeneratorConfig>;

describe('ShapePatternsGenerator', () => {
    it('strictly validates every task configuration field', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({
            articulateVisually: true,
            classifyFeature: false,
            understandProcedure: false
        })).toThrow(GeneratorValidationError);
    });

    it.each(['generate', 'identify', 'explain'] as const)(
        'creates a discriminated %s payload with the complete pattern reasoning',
        task => {
            setSeed(14);
            const data = generator.generate(configs[task])!.data;

            expect(data.task).toBe(task);
            expect(data.sequence).toHaveLength(6);
            expect(data.sequence.map(term => term.position)).toEqual([1, 2, 3, 4, 5, 6]);
            expect(data.givenTermCount).toBe(4);
            expect(data.rule).toBeTruthy();
            expect(data.feature).toBeTruthy();
            expect(data.feature).not.toBe(data.rule);
            expect(data.evidence).toHaveLength(2);
            expect(data.explanation).toBeTruthy();
            expect(data.prompt).toBeTruthy();
        }
    );

    it('supplies the exact continuation positions for visual generation', () => {
        const data = generator.generate(configs.generate)!.data;
        expect(data.task).toBe('generate');
        if (data.task !== 'generate') throw new Error('Expected a generation task.');
        expect(data.responsePositions).toEqual([5, 6]);
        expect(data.sequence.slice(data.givenTermCount).map(term => term.position)).toEqual([5, 6]);
    });

    it('supplies one correct non-explicit feature among three identification options', () => {
        const data = generator.generate(configs.identify)!.data;
        expect(data.task).toBe('identify');
        if (data.task !== 'identify') throw new Error('Expected an identification task.');
        expect(data.featureOptions).toHaveLength(3);
        expect(new Set(data.featureOptions).size).toBe(3);
        expect(data.featureOptions).toContain(data.feature);
        expect(data.feature).not.toContain(data.rule);
    });

    it('states the inferred feature and supplies its causal continuation explanation', () => {
        const data = generator.generate(configs.explain)!.data;
        expect(data.task).toBe('explain');
        if (data.task !== 'explain') throw new Error('Expected an explanation task.');
        expect(data.prompt).toContain(data.feature);
        expect(data.explanation.length).toBeGreaterThan(80);
    });

    it('builds concrete growth tokens whose count parity matches each position', () => {
        let growth: ShapePatternProblem | undefined;
        for (let seed = 0; seed < 50 && !growth; seed++) {
            setSeed(seed);
            const data = generator.generate(configs.identify)!.data;
            if (data.patternKind === 'growth-parity') growth = data;
        }

        expect(growth?.patternKind).toBe('growth-parity');
        growth?.sequence.forEach(term => {
            expect(term.tokens).toHaveLength(term.position);
            expect(term.tokens.every(token => token.shape === 'square' && token.orientation === 0)).toBe(true);
            expect(term.tokens.length % 2).toBe(term.position % 2);
        });
        expect(growth?.feature).toContain('Odd-positioned');
        expect(growth?.explanation).toContain('Adding 1 switches odd to even');
    });

    it('builds visibly oriented triangles whose axis alternates by position', () => {
        let rotation: ShapePatternProblem | undefined;
        for (let seed = 0; seed < 50 && !rotation; seed++) {
            setSeed(seed);
            const data = generator.generate(configs.identify)!.data;
            if (data.patternKind === 'rotation-axis') rotation = data;
        }

        expect(rotation?.patternKind).toBe('rotation-axis');
        expect(rotation?.sequence.map(term => term.tokens[0])).toEqual([
            {shape: 'triangle', orientation: 0},
            {shape: 'triangle', orientation: 90},
            {shape: 'triangle', orientation: 180},
            {shape: 'triangle', orientation: 270},
            {shape: 'triangle', orientation: 0},
            {shape: 'triangle', orientation: 90}
        ]);
        expect(rotation?.feature).toContain('odd positions point vertically');
        expect(rotation?.explanation).toContain('switches the triangle between a vertical and a horizontal direction');
    });

    it('rejects incomplete and conflicting task combinations', () => {
        expect(generator.generate({
            generatesPattern: false,
            recognizesEmergentFeature: true,
            articulateVisually: false,
            classifyFeature: false,
            understandProcedure: true,
            articulateTextually: false
        })).toBeNull();
        expect(generator.generate({
            generatesPattern: true,
            recognizesEmergentFeature: true,
            articulateVisually: true,
            classifyFeature: true,
            understandProcedure: false,
            articulateTextually: false
        })).toBeNull();
        expect(generator.generate({
            generatesPattern: false,
            recognizesEmergentFeature: false,
            articulateVisually: false,
            classifyFeature: false,
            understandProcedure: false,
            articulateTextually: false
        })).toBeNull();
        expect(generator.generate({
            generatesPattern: true,
            recognizesEmergentFeature: false,
            articulateVisually: 'true' as unknown as boolean,
            classifyFeature: false,
            understandProcedure: false,
            articulateTextually: false
        })).toBeNull();
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(28);
        const first = generator.generate(configs.identify);
        setSeed(28);
        const second = generator.generate(configs.identify);
        expect(second).toEqual(first);
    });
});
