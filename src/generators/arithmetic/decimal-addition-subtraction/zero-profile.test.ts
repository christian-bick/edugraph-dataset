import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {spec as view} from '../../../visuals/views/operations/operations-decimal-addition-subtraction-method/spec.ts';
import {createDecimalAddSubtractProblem, decimalZeroPools, DecimalAdditionSubtractionGenerator} from './generator.ts';
import {DecimalAdditionSubtractionGeneratorSchema, spec} from './spec.ts';
import {hasDecimalUnitZero} from './zero-profile.ts';

describe('decimal arithmetic unit zero', () => {
    it('uses actual unit counts throughout exchanges rather than hidden carry sentinels', () => {
        expect(hasDecimalUnitZero(createDecimalAddSubtractProblem('addition', 112, 119)!)).toBe(false);
        expect(hasDecimalUnitZero(createDecimalAddSubtractProblem('subtraction', 245, 118)!)).toBe(false);
        expect(hasDecimalUnitZero(createDecimalAddSubtractProblem('addition', 100, 13)!)).toBe(true);
        expect(hasDecimalUnitZero(createDecimalAddSubtractProblem('subtraction', 102, 38)!)).toBe(true);
    });

    it.each(['addition', 'subtraction'] as const)('partitions every old %s scenario and preserves its accepted-pair weights', operation => {
        const withZero = decimalZeroPools(operation, true), withoutZero = decimalZeroPools(operation, false);
        const profiles = new Map<string, {count: number; expected: number; pairs: Set<string>}>();
        const denominator = operation === 'addition' ? 4 : 5;
        for (const presence of [false, true]) for (const pool of presence ? withZero : withoutZero) {
            const record = profiles.get(pool.profile) ?? {count: 0, expected: pool.originalCount, pairs: new Set()};
            record.count += pool.pairs.length;
            expect(pool.weight / pool.pairs.length).toBeCloseTo(1 / denominator / pool.originalCount, 15);
            expect(pool.pairs.every(pair => {
                const key = `${pair[0]}:${pair[1]}`;
                if (record.pairs.has(key)) return false;
                record.pairs.add(key);
                return hasDecimalUnitZero(createDecimalAddSubtractProblem(operation, pair[0], pair[1])!) === presence;
            })).toBe(true);
            profiles.set(pool.profile, record);
        }
        expect(profiles.size).toBe(denominator);
        expect([...profiles.values()].every(row => row.count === row.expected)).toBe(true);
        expect([...withZero, ...withoutZero].reduce((sum, pool) => sum + pool.weight, 0)).toBeCloseTo(1, 14);
        // Independent exhaustive source-membership proof, including scenario overlap.
        for (let first = 1; first <= 249; first++) for (let second = 1; second <= 249; second++) {
            const onesA = first % 10, onesB = second % 10;
            const tenthsA = Math.floor(first % 100 / 10), tenthsB = Math.floor(second % 100 / 10);
            const lower = operation === 'addition' ? onesA + onesB >= 10 : onesA < onesB;
            const higher = operation === 'addition' ? tenthsA + tenthsB + Number(lower) >= 10
                : tenthsA - Number(lower) < tenthsB;
            const accepted = (onesA !== 0 || onesB !== 0) && (operation === 'addition' || first > second);
            const expected = accepted ? [
                ...(lower && higher ? [operation === 'addition' ? 'double-carry' : 'double-borrow'] : []),
                ...(lower && !higher ? [operation === 'addition' ? 'hundredths-carry' : 'hundredths-borrow'] : []),
                ...(!lower && higher ? [operation === 'addition' ? 'tenths-carry' : 'tenths-borrow'] : []),
                ...((onesA === 0) !== (onesB === 0) && (lower || higher) ? ['zero-placeholder'] : []),
                ...(operation === 'subtraction' && lower && higher && tenthsA === 0 ? ['zero-cascade'] : [])
            ].sort() : [];
            const key = `${first}:${second}`;
            const actual = [...profiles].filter(([, row]) => row.pairs.has(key)).map(([profile]) => profile).sort();
            if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error(`Lost or added ${operation} scenario pair ${key}`);
        }
    });

    it.each([Area.Addition, Area.Subtraction])('selects truthful matching profiles directly and through replay for %s', operation => {
        const generator = new DecimalAdditionSubtractionGenerator();
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: DecimalAdditionSubtractionGeneratorSchema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const labels = [operation, zero, Scope.HundredthDecimals, ...view.generalLabels];
            const match = planModelCompatibility({id: 'decimal', labels}, model, consumer);
            expect(match.supported).toBe(true);
            if (!match.supported) throw new Error(match.reason);
            const selections = enumerateDependencyAuditSelections(match.plan);
            expect(selections.selections).toHaveLength(zero === Scope.NumbersWithZero ? 2 : 1);
            for (const selected of selections.selections) for (let seed = 0; seed < 20; seed++) {
                const bound = selected.labels.find(label => label === Scope.NumbersSmaller10 || label === Scope.NumbersSmaller20)!;
                setSeed(seed);
                const direct = generateWithLabels(generator, [...labels, bound])!;
                expect(hasDecimalUnitZero(direct.data)).toBe(zero === Scope.NumbersWithZero);
                const sampleKey = `decimal#${spec.generatorId}#${view.viewId}#train#question#inst:0`;
                const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec: view, plan: match.plan,
                    sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                        selection: createGenerationSelectionReceipt(match.plan, selected.choices)}};
                const planned = generatePlannedDraw(input);
                expect(planned.stub!.data).toEqual(direct.data);
                expect(generatePlannedDraw(input)).toEqual(planned);
                expect(planned.labels).toContain(zero);
            }
        }
    });
});
