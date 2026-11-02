import {Area} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {ArithmeticWordProblemWithin100View} from '../../../visuals/views/operations/arithmetic-word-problem-within-100-view.tsx';
import {spec as viewSpec} from '../../../visuals/views/operations/operations-word-problem-reasoning/spec.ts';
import type {TwoStepOperationLabels} from '../helpers.ts';
import {buildRounding} from '../word-problem-evidence.ts';
import {canonicalProposalInterval, roundingCores, roundingDomain, roundingRangeProfiles} from './domain.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';
import {roundingProposalInterval} from './proposal-domain.ts';
import {spec} from './spec.ts';

// Public typed configurations also admit these six ordered pairs. Matching's
// existing unordered-label resolver continues to expose only its ten choices.
const directPairs = [
    ['addition', 'multiplication'], ['subtraction', 'addition'], ['subtraction', 'multiplication'],
    ['addition', 'division'], ['subtraction', 'division'], ['division', 'multiplication']
] as const;
const operationLabels = {addition: Area.Addition, subtraction: Area.Subtraction,
    multiplication: Area.Multiplication, division: Area.Division};
const apply = (a: number, b: number, operation: ArithmeticOperation) => operation === 'addition' ? a + b
    : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
afterEach(() => vi.restoreAllMocks());

describe('rounding-story direct-only operation support', () => {
    it('retains the complete old generic Cartesian corpus at every formerly feasible floor', () => {
        let retained = 0, floorOutcomes = 0;
        for (const operations of directPairs) {
            const rows = roundingCores(operations), lookup = new Map(rows.map(row => [`${row.a}:${row.b}:${row.c}`, row]));
            expect(lookup.size).toBe(rows.length);
            let base = 0;
            for (const floor of [1, 5, 10, 20]) for (let a = Math.max(2, floor); a <= 50; a++)
                for (let b = Math.max(2, floor); b <= 50; b++) for (let c = Math.max(2, floor); c <= 50; c++) {
                    // The original constructor's else branch drew these three
                    // primitives independently, then rejected noninteger math.
                    const intermediate = apply(a, b, operations[0]), answer = apply(intermediate, c, operations[1]);
                    if (![a, b, c, intermediate, answer].every(n => Number.isInteger(n) && n >= floor && n <= 999999)
                        || answer < Math.max(5, floor)) continue;
                    const evidence = buildRounding({num1: a, num2: b, num3: c, intermediate, answer}, operations);
                    const old = roundingProposalInterval({...evidence, numberDomain: {min: floor, max: 1000000}});
                    if (!old) continue;
                    const row = lookup.get(`${a}:${b}:${c}`);
                    if (!row || row.intermediate !== intermediate || row.answer !== answer
                        || row.sourceMinimum !== 1 || row.proposalLower > old.lower || old.upper > 1000000)
                        throw new Error(`Lost direct primitive: ${JSON.stringify({operations, floor, a, b, c})}`);
                    if (floor === 1) base++;
                    floorOutcomes++;
                }
            expect(base).toBe(rows.length);
            retained += base;
        }
        expect(retained).toBe(245588);
        expect(floorOutcomes).toBeGreaterThan(retained);
    });

    it('partitions every old direct proposal interval with exact conditional masses and positive endpoint witnesses', () => {
        for (const operations of directPairs) {
            const rows = roundingCores(operations), covered = new Float64Array(rows.length);
            for (const {range} of roundingRangeProfiles) {
                const domain = roundingDomain(operations, range);
                let before = 0;
                for (const [index, row] of rows.entries()) {
                    const interval = canonicalProposalInterval(row, range);
                    let count = 0;
                    if (interval) {
                        count = interval.upper - interval.lower + 1 - Number(row.answer >= interval.lower && row.answer <= interval.upper);
                        covered[index]! += count;
                        const first = interval.lower === row.answer ? interval.lower + 1 : interval.lower;
                        const last = interval.upper === row.answer ? interval.upper - 1 : interval.upper;
                        for (const P of [first, last]) {
                            const quantities = [row.a, row.b, row.c, row.intermediate, row.answer, row.roundedAnswer,
                                P, Math.round(P / row.roundingPlace) * row.roundingPlace];
                            if (quantities.some(n => n <= 0) || P === row.answer || !hasCanonicalRangeWitness(quantities, range))
                                throw new Error('False direct canonical or nonzero claim');
                        }
                    }
                    if (Math.abs(domain.cumulative[index]! - before - count / row.proposalCount) > 3e-11)
                        throw new Error('Incorrect direct conditional mass');
                    before = domain.cumulative[index]!;
                }
            }
            for (const [index, row] of rows.entries()) expect(covered[index]).toBe(row.proposalCount);
        }
    });

    it('generates and replays every direct-only feasible cell at both true RNG boundaries and renders both modes', () => {
        const generator = new ArithmeticWordProblemsRoundingGenerator();
        let cells = 0;
        for (const operations of directPairs) for (const {range} of roundingRangeProfiles) {
            if (!roundingDomain(operations, range).weight) continue;
            const config = {operations: operations.map(op => operationLabels[op]) as unknown as TwoStepOperationLabels, range};
            const draw = vi.spyOn(rng, 'random');
            for (const boundary of [0, (2 ** 32 - 1) / 2 ** 32]) {
                draw.mockReset().mockReturnValue(boundary);
                const stub = generator.generate(config)!;
                const data = stub.data;
                expect(hasCanonicalRangeWitness([...data.operands, data.intermediate, data.answer, data.roundedAnswer,
                    data.proposal.proposedAnswer, data.proposal.roundedProposedAnswer], range)).toBe(true);
                expect(draw).toHaveBeenCalledTimes(2);
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(<ArithmeticWordProblemWithin100View
                        config={{expectedKind: 'rounding', invertProcedure: false, useLengthContext: false}}
                        payload={{viewId: viewSpec.viewId, targetLabels: [...spec.generalLabels, ...viewSpec.generalLabels],
                            problem: {type: 'arithmetic', ...stub, labels: []}, seed: 0, isSolutionView}} />);
                    expect(markup).not.toMatch(/NaN|undefined/);
                    expect(markup).toContain('Use the rounding check');
                }
            }
            draw.mockRestore();
            rng.setSeed(196);
            const first = generator.generate(config), state = rng.getRandomState();
            rng.setSeed(196);
            expect(generator.generate(config)).toEqual(first);
            expect(rng.getRandomState()).toBe(state);
            cells++;
        }
        expect(cells).toBe(122);
    });

    it('keeps the reported direct addition-then-multiplication frame', () => {
        const row = roundingCores(['addition', 'multiplication']).find(r => r.a === 2 && r.b === 2 && r.c === 2);
        expect(row).toMatchObject({intermediate: 4, answer: 8, roundedAnswer: 10});
    });
});
