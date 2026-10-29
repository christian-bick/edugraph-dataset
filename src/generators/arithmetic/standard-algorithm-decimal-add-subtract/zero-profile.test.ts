import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
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

afterEach(() => vi.restoreAllMocks());

describe('decimal standard add/sub zero profiles', () => {
    it('uses active column values while excluding invisible leading padding and carry initialization', () => {
        for (const [operation, first, second, zero] of [
            ['addition', '11.1', '11.1', false], ['subtraction', '33.3', '11.1', false],
            ['addition', '123.4', '1.1', false], ['addition', '12.3', '1.11', true],
            ['addition', '11.1', '0', true], ['subtraction', '11.1', '11.1', true],
            ['subtraction', '100.005', '0.017', true], ['addition', '99.99', '0.01', true],
            ['subtraction', '31.1', '11.2', true]
        ] as const) {
            const data = buildDecimalStandardAddSubtractProblem(operation, first, second);
            expect(hasDecimalColumnZero(data)).toBe(zero);
        }
    });

    it('includes the exhausted quantity before a chained borrow, even with nonzero visible digits', () => {
        const data = buildDecimalStandardAddSubtractProblem('subtraction', '31.1', '11.2');
        expect([data.top, data.bottom, data.result].every(value => !value.numeral.includes('0'))).toBe(true);
        const ones = data.columns.find(column => column.placeExponent === 0)!;
        expect(ones).toMatchObject({topDigit: 1, regroupIn: 1, regroupOut: 1, workingValue: 10, resultDigit: 9});
        expect(ones.topDigit - ones.regroupIn).toBe(0);
        expect(hasDecimalColumnZero(data)).toBe(true);
    });

    it.each(['addition', 'subtraction'] as const)('has both nonempty %s profiles at every cap and completes stress draws', operation => {
        const generator = new StandardAlgorithmDecimalAddSubtractGenerator();
        for (const max of [100000, 1000000, Number.MAX_SAFE_INTEGER]) {
            // Equal-precision variant0 supports each positive witness with nonzero
            // proposal probability; variant3 supports actual zero operands/results.
            const witness = operation === 'addition' ? ['11.1', '11.1'] : ['33.3', '11.1'];
            expect(hasDecimalColumnZero(buildDecimalStandardAddSubtractProblem(operation, witness[0]!, witness[1]!))).toBe(false);
            for (const zeroPresence of [false, true]) for (let seed = 0; seed < 100; seed++) {
                rng.setSeed(seed);
                const config = {operation, range: {min: 0, max}, zeroPresence};
                const first = generator.generate(config);
                expect(first).not.toBeNull();
                expect(hasDecimalColumnZero(first!.data)).toBe(zeroPresence);
                const state = rng.getRandomState();
                rng.setSeed(seed);
                expect(generator.generate(config)).toEqual(first);
                expect(rng.getRandomState()).toBe(state);
            }
        }
    });

    it('uses the normal numeric retry outcome instead of making a false claim on exhaustion', () => {
        vi.spyOn(rng, 'random').mockReturnValue(0.99); // variant3 always has an actual zero
        expect(new StandardAlgorithmDecimalAddSubtractGenerator().generate({operation: 'addition',
            range: {min: 0, max: 100000}, zeroPresence: false})).toBeNull();
    });

    it.each([Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm])('matches explicit profiles and replays %s', operation => {
        const generator = new StandardAlgorithmDecimalAddSubtractGenerator();
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: StandardAlgorithmDecimalAddSubtractGeneratorSchema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const labels = [operation, zero, ...view.generalLabels];
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
