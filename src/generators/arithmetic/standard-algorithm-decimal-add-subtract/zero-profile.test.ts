import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import * as rng from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {spec as view} from '../../../visuals/views/operations/operations-decimal-standard-add-subtract/spec.ts';
import {buildDecimalStandardAddSubtractProblem, StandardAlgorithmDecimalAddSubtractGenerator} from './generator.ts';
import {StandardAlgorithmDecimalAddSubtractGeneratorSchema, spec} from './spec.ts';
import {hasDecimalColumnZero} from './zero-profile.ts';
import {nonzeroDecimalDigitsAtMost, standardDecimalColumnCases} from './domain.ts';

afterEach(() => vi.restoreAllMocks());

describe('decimal standard add/sub zero profiles', () => {
    it('uses active column values while excluding invisible leading padding and carry initialization', () => {
        for (const [operation, first, second, zero] of [
            ['addition', '11.1', '11.1', false], ['subtraction', '33.3', '11.1', false],
            ['addition', '123.4', '1.1', false], ['addition', '12.3', '1.11', true],
            ['addition', '11.1', '0', true], ['subtraction', '11.1', '11.1', true],
            ['subtraction', '100.005', '0.017', true], ['addition', '99.99', '0.01', true],
            ['subtraction', '31.1', '11.2', true],
            ['addition', '12.5', '18.5', false], ['addition', '125', '185', false],
            ['addition', '555.5', '555.5', false], ['addition', '1.1', '123.4', false],
            ['addition', '1.11', '12.3', true], ['addition', '0', '11.1', true],
            ['subtraction', '122.5', '111.4', true], ['subtraction', '11.1', '1.2', true]
        ] as const) {
            const data = buildDecimalStandardAddSubtractProblem(operation, first, second);
            expect(hasDecimalColumnZero(data)).toBe(zero);
        }
    });

    it('separates positive carry totals from numerical zero and retains the original seed-105 proposal', () => {
        const data = buildDecimalStandardAddSubtractProblem('addition', '3779.7', '3825.5');
        expect(data.result.numeral).toBe('7605.2');
        expect(data.columns.find(column => column.placeExponent === 1)).toMatchObject({
            topDigit: 7, bottomDigit: 2, regroupIn: 1, workingValue: 10, resultDigit: 0
        });
        expect(hasDecimalColumnZero(data)).toBe(false);
        const range = createCanonicalNumericRange(10000), blocks = standardDecimalColumnCases('addition', range, false);
        const index = blocks.findIndex(b => b.kind === 'regular' && b.scale === 1 && b.bottomScale === 1);
        const block = blocks[index]!;
        if (block.kind !== 'regular' || !block.nonzero) throw Error('Missing original equal-precision source');
        const at = 37797 - block.first;
        const total = blocks.reduce((n, b) => n + b.weight, 0);
        const inputs = [(blocks.slice(0, index).reduce((n, b) => n + b.weight, 0) + block.weight / 2) / total,
            ((block.nonzero[at - 1] ?? 0) + block.nonzero[at]!) / 2 / block.nonzero[block.nonzero.length - 1]!,
            (nonzeroDecimalDigitsAtMost(38254) - nonzeroDecimalDigitsAtMost(9) + 0.5)
                / (nonzeroDecimalDigitsAtMost(62203) - nonzeroDecimalDigitsAtMost(9))];
        vi.spyOn(rng, 'random').mockImplementation(() => inputs.shift()!);
        expect(new StandardAlgorithmDecimalAddSubtractGenerator().generate({operation: 'addition', range, zeroPresence: false}).data).toEqual(data);
        expect(inputs).toEqual([]);

    });

    it('replays the corrected seed-105 profiles and rejects its old unsupported zero claim', () => {
        const generator = new StandardAlgorithmDecimalAddSubtractGenerator();
        const oldProposal = buildDecimalStandardAddSubtractProblem('addition', '3779.7', '3825.5');
        for (const zeroPresence of [false, true]) {
            const config = {operation: 'addition' as const, range: createCanonicalNumericRange(100000), zeroPresence};
            rng.setSeed(105);
            const first = generator.generate(config)!;
            expect(first).not.toBeNull();
            expect(hasDecimalColumnZero(first.data)).toBe(zeroPresence);
            if (zeroPresence) expect(first.data).not.toEqual(oldProposal);
            const continuation = rng.getRandomState();
            rng.setSeed(105);
            expect(generator.generate(config)).toEqual(first);
            expect(rng.getRandomState()).toBe(continuation);
        }
    });

    it('retains actual zero differences above the trimmed result and zero working quantities', () => {
        const leading = buildDecimalStandardAddSubtractProblem('subtraction', '122.5', '111.4');
        expect(leading.result.numeral).toBe('11.1');
        expect(leading.columns.find(column => column.placeExponent === 2)).toMatchObject({
            topDigit: 1, bottomDigit: 1, workingValue: 1, resultDigit: 0
        });
        expect(hasDecimalColumnZero(leading)).toBe(true);
        const exhausted = buildDecimalStandardAddSubtractProblem('subtraction', '11.1', '1.2');
        expect(exhausted.columns.find(column => column.placeExponent === 1)).toMatchObject({
            topDigit: 1, regroupIn: 1, workingValue: 0, resultDigit: 0
        });
        expect(hasDecimalColumnZero(exhausted)).toBe(true);
    });

    it('includes the exhausted quantity before a chained borrow, even with nonzero visible digits', () => {
        const data = buildDecimalStandardAddSubtractProblem('subtraction', '31.1', '11.2');
        expect([data.top, data.bottom, data.result].every(value => !value.numeral.includes('0'))).toBe(true);
        const ones = data.columns.find(column => column.placeExponent === 0)!;
        expect(ones).toMatchObject({topDigit: 1, regroupIn: 1, regroupOut: 1, workingValue: 10, resultDigit: 9});
        expect(ones.topDigit - ones.regroupIn).toBe(0);
        expect(hasDecimalColumnZero(data)).toBe(true);
    });

    it.each((['addition', 'subtraction'] as const).flatMap(operation =>
        [20, 100, 120, 1000, 10000, 100000].map(max => ({operation, max}))))(
        'upper$max has both nonempty $operation profiles and replays every original stress draw', ({operation, max}) => {
            const generator = new StandardAlgorithmDecimalAddSubtractGenerator();
            // The original nonzero competency witnesses remain mathematically supported.
            const witness = operation === 'addition' ? ['11.1', '11.1'] : ['33.3', '11.1'];
            expect(hasDecimalColumnZero(buildDecimalStandardAddSubtractProblem(operation, witness[0]!, witness[1]!))).toBe(false);
            for (const zeroPresence of [false, true]) for (let seed = 0; seed < 100; seed++) {
                rng.setSeed(seed);
                const config = {operation, range: createCanonicalNumericRange(max), zeroPresence};
                const first = generator.generate(config);
                expect(first).not.toBeNull();
                expect(hasDecimalColumnZero(first!.data)).toBe(zeroPresence);
                const state = rng.getRandomState();
                rng.setSeed(seed);
                expect(generator.generate(config)).toEqual(first);
                expect(rng.getRandomState()).toBe(state);
            }
        });

    it('rejects an invalid profile before consuming mathematical proposal randomness', () => {
        const random = vi.spyOn(rng, 'random');
        expect(() => new StandardAlgorithmDecimalAddSubtractGenerator().generate({operation: 'addition',
            range: createCanonicalNumericRange(100000),
            // @ts-expect-error External configuration must also satisfy runtime profile validation.
            zeroPresence: 'true'})).toThrow('Zero presence must be a boolean.');
        expect(random).not.toHaveBeenCalled();
    });

    it.each([Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm])('matches explicit profiles and replays %s', operation => {
        const generator = new StandardAlgorithmDecimalAddSubtractGenerator();
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: StandardAlgorithmDecimalAddSubtractGeneratorSchema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const labels = [operation, zero, Scope.NumbersSmaller100, ...view.generalLabels];
            const match = planModelCompatibility({id: 'decimal-standard', labels}, model, consumer);
            expect(match.supported).toBe(true);
            if (!match.supported) throw new Error(match.reason);
            const selected = enumerateDependencyAuditSelections(match.plan).selections;
            expect(selected).toHaveLength(1);
            for (let seed = 0; seed < 10; seed++) {
                rng.setSeed(seed);
                const direct = generateWithLabels(generator, labels)!;
                expect(hasDecimalColumnZero(direct.data)).toBe(zero === Scope.NumbersWithZero);
                const sampleKey = `decimal-standard#${spec.generatorId}#${view.viewId}#train#question#inst:0`;
                const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec: view, plan: match.plan,
                    sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                        selection: createGenerationSelectionReceipt(match.plan, selected[0]!.choices)}};
                const planned = generatePlannedDraw(input);
                expect(planned.stub!.data).toEqual(direct.data);
                expect(generatePlannedDraw(input)).toEqual(planned);
            }
        }
    });
});
