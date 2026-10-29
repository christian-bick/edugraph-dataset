import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {spec as view} from '../../../visuals/views/operations/operations-answer-reasonableness/spec.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';
import {estimationProfileMass, estimationRelation, estimationRelationHasZero, estimationRows,
    hasEstimationProfile, sampleEstimation} from './numeric-domain.ts';
import {ArithmeticEstimationGeneratorSchema, spec} from './spec.ts';

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const apply = (a: number, b: number, operation: ArithmeticOperation) => operation === 'addition' ? a + b
    : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
const rounded = (value: number) => Math.round(value / 10) * 10;

describe('finite estimation operand/proposal domain', () => {
    it.each(operations)('preserves every old %s pair and raw proposal probability', operation => {
        for (const [minimum, maximum] of [[0, 20], [0, 1000], [30, 1000]]) {
            const domain = {operation, minimum: minimum!, maximum: maximum!};
            const low = Math.max(1, minimum!, maximum! < 22 ? 1 : 11);
            const firstMax = operation === 'addition' ? Math.min(700, maximum! - low)
                : operation === 'subtraction' ? Math.min(400, maximum! - low) : Math.min(49, maximum!);
            const expected = new Set<string>();
            for (let a = 1; a <= maximum!; a++) for (let b = 1; b <= maximum!; b++) {
                const inHierarchy = operation === 'addition' ? a >= low && a <= firstMax && b >= low && a + b <= maximum!
                    : operation === 'subtraction' ? b >= low && b <= firstMax && a - b >= low && a <= maximum!
                        : operation === 'multiplication' ? a >= low && a <= firstMax && b >= low && b <= 49 && a * b <= maximum!
                            : b >= low && b <= firstMax && Number.isInteger(a / b) && a / b >= Math.max(2, minimum!)
                                && a / b <= 80 && a <= maximum!;
                if (!inHierarchy) continue;
                const ra = rounded(a), rb = rounded(b), exact = apply(a, b, operation), estimate = apply(ra, rb, operation);
                if (ra === a && rb === b || rb === 0 || ![a, b, ra, rb, exact, estimate, rounded(estimate)]
                    .every(value => Number.isInteger(value) && value >= minimum! && value <= maximum!)) continue;
                expected.add(`${a}:${b}`);
            }
            const rows = estimationRows(domain);
            let originalMass = 0;
            for (const row of rows) {
                const secondMin = operation === 'division' ? Math.max(2, minimum!) : low;
                const secondMax = operation === 'addition' || operation === 'subtraction' ? maximum! - row.first
                    : operation === 'multiplication' ? Math.min(49, Math.floor(maximum! / row.first))
                        : Math.min(80, Math.floor(maximum! / row.first));
                expect(row.pairWeight).toBe(1 / (firstMax - low + 1) / (secondMax - secondMin + 1));
                for (const second of row.seconds) {
                    const data = estimationRelation(domain, row.first, second)!;
                    if (!expected.delete(`${data.num1}:${data.num2}`)) throw new Error('Added or duplicated an old mathematical pair.');
                }
                expect(row.totalMass.every(mass => mass === 1)).toBe(true);
                expect(row.zeroMass.every(mass => mass >= 0 && mass <= 1)).toBe(true);
                originalMass += row.pairWeight * row.seconds.length;
            }
            expect(expected.size).toBe(0);
            expect(estimationProfileMass(domain, false) + estimationProfileMass(domain, true)).toBeCloseTo(originalMass, 10);
            for (const presence of [false, true]) expect(hasEstimationProfile(domain, presence))
                .toBe(estimationProfileMass(domain, presence) > 0);
        }
    });

    it.each(operations)('constructs every feasible %s zero profile without rare-event retries', operation => {
        const domain = {operation, minimum: 0, maximum: 1000};
        for (const zeroPresence of [false, true]) {
            if (estimationProfileMass(domain, zeroPresence) === 0) {
                expect(sampleEstimation(domain, zeroPresence)).toBeNull();
                continue;
            }
            for (let seed = 0; seed < 60; seed++) {
                setSeed(seed);
                const data = sampleEstimation(domain, zeroPresence)!;
                expect(data).not.toBeNull();
                expect(estimationRelationHasZero(data) || data.proposal.proposedAnswer === 0
                    || data.proposal.roundedProposedAnswer === 0).toBe(zeroPresence);
                const state = getRandomState();
                setSeed(seed);
                expect(sampleEstimation(domain, zeroPresence)).toEqual(data);
                expect(getRandomState()).toBe(state);
            }
        }
    });

    it('plans only feasible zero claims, keeping multiplication zero absence as an ordinary capability', () => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: ArithmeticEstimationGeneratorSchema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        for (const operation of [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division]) {
            for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
                const labels = [operation, Scope.NumbersSmaller1000, zero, ...view.generalLabels];
                const state = getRandomState();
                const matched = planModelCompatibility({id: 'estimation', labels}, model, consumer);
                expect(getRandomState()).toBe(state);
                expect(matched.supported).toBe(operation !== Area.Multiplication || zero === Scope.NumbersWithoutZero);
                if (matched.supported) {
                    const task = generateWithLabels(new ArithmeticEstimationGenerator(), labels)!;
                    expect(task.labels).toContain(zero);
                }
            }
        }
    });
});
