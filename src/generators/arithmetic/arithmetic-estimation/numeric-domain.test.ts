import {Area, Scope} from 'edugraph-ts';
import {afterAll, describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {spec as view} from '../../../visuals/views/operations/operations-answer-reasonableness/spec.ts';
import {ArithmeticEstimationGenerator} from './generator.ts';
import {estimationRelation, estimationRawRows} from './numeric-domain.ts';
import {estimationProposalCases, proposalSeedCount} from './proposal-domain.ts';
import {ArithmeticEstimationGeneratorSchema, spec} from './spec.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalEstimationProfile} from './canonical-domain.ts';
import {operationNames} from '../helpers.ts';

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const apply = (a: number, b: number, operation: ArithmeticOperation) => operation === 'addition' ? a + b
    : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
const rounded = (value: number) => Math.round(value / 10) * 10;

describe('finite estimation operand/proposal domain', () => {
    const domains = operations.flatMap(operation => ([[0, 20], [0, 1000], [30, 1000]] as const)
        .map(([minimum, maximum]) => ({operation, minimum, maximum})));
    const pairContexts = domains.flatMap(domain => Array.from({length: Math.ceil(domain.maximum / 100)}, (_, index) => ({
        ...domain, first: 100 * index + 1, last: Math.min(100 * (index + 1), domain.maximum)
    })));
    const pairMasses = new Map<string, {originalMass: number; proposalMass: number}>();
    const contextKey = ({operation, minimum, maximum, first}: typeof pairContexts[number]) =>
        `${operation}/${minimum}/${maximum}/${first}`;
    it.each(pairContexts)('preserves every old $operation pair from $minimum to $maximum with first proposal operand $first through $last', ({operation, minimum, maximum, first, last}) => {
        const domain = {operation, minimum: minimum!, maximum: maximum!};
        const low = Math.max(1, minimum!, maximum! < 22 ? 1 : 11);
        const firstMax = operation === 'addition' ? Math.min(700, maximum! - low)
            : operation === 'subtraction' ? Math.min(400, maximum! - low) : Math.min(49, maximum!);
        const expected = new Set<string>();
        const reverse = operation === 'subtraction' || operation === 'division';
        for (let a = reverse ? 1 : first; a <= (reverse ? maximum : last); a++)
            for (let b = reverse ? first : 1; b <= (reverse ? last : maximum); b++) {
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
        const rows = [...estimationRawRows(domain)].filter(row => row.first >= first && row.first <= last);
        let originalMass = 0, proposalMass = 0;
        for (const row of rows) {
            const secondMin = operation === 'division' ? Math.max(2, minimum!) : low;
            const secondMax = operation === 'addition' || operation === 'subtraction' ? maximum! - row.first
                : operation === 'multiplication' ? Math.min(49, Math.floor(maximum! / row.first))
                    : Math.min(80, Math.floor(maximum! / row.first));
            expect(row.pairWeight).toBe(1 / (firstMax - low + 1) / (secondMax - secondMin + 1));
            for (let second = row.secondMin; second <= row.secondMax; second++) {
                const data = estimationRelation(domain, row.first, second);
                if (!data) continue;
                const proposals = estimationProposalCases(data);
                if (!proposals.length) continue;
                if (!expected.delete(`${data.num1}:${data.num2}`)) throw new Error('Added or duplicated an old mathematical pair.');
                if (proposals.reduce((sum, proposal) => sum + proposal.seeds, 0) !== proposalSeedCount) throw new Error('Original proposal seed mass changed.');
                proposalMass += row.pairWeight * proposals.reduce((sum, proposal) => sum + proposal.seeds, 0) / proposalSeedCount;
                originalMass += row.pairWeight;
            }
        }
        expect(expected.size).toBe(0);
        expect(proposalMass).toBeCloseTo(originalMass, 10);
        pairMasses.set(contextKey({operation, minimum, maximum, first, last}), {originalMass, proposalMass});
    });

    afterAll(() => {
        expect(pairContexts).toHaveLength(84);
        expect(pairMasses.size).toBe(pairContexts.length);
        expect(domains.reduce((sum, domain) => sum + domain.maximum ** 2, 0)).toBe(8001600);
        for (const domain of domains) {
            const contexts = pairContexts.filter(context => context.operation === domain.operation
                && context.minimum === domain.minimum && context.maximum === domain.maximum);
            expect(contexts.flatMap(context => Array.from({length: context.last - context.first + 1}, (_, index) => context.first + index)))
                .toEqual(Array.from({length: domain.maximum}, (_, index) => index + 1));
            const masses = contexts.map(context => pairMasses.get(contextKey(context))!);
            expect(masses.reduce((sum, mass) => sum + mass.proposalMass, 0))
                .toBeCloseTo(masses.reduce((sum, mass) => sum + mass.originalMass, 0), 10);
        }
    });

    const zeroContexts = ([Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const)
        .flatMap(operation => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].map(zero => ({operation, zero})));
    it.each(zeroContexts)('plans the feasible $operation / $zero claim without drawing for matching', ({operation, zero}) => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: ArithmeticEstimationGeneratorSchema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        const labels = [operation, Scope.NumbersSmaller1000, zero, ...view.generalLabels];
        const state = getRandomState();
        const matched = planModelCompatibility({id: 'estimation', labels}, model, consumer);
        expect(getRandomState()).toBe(state);
        expect(matched.supported).toBe(canonicalRangeProfiles.filter(({range}) => range.max === 1000)
            .some(({range}) => hasCanonicalEstimationProfile(operationNames[operation], zero === Scope.NumbersWithZero, range)));
        if (matched.supported) {
            const task = generateWithLabels(new ArithmeticEstimationGenerator(), labels)!;
            expect(task.labels).toContain(zero);
        }
    });
});
