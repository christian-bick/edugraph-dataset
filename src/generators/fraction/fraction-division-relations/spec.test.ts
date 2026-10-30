import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {createGenerationSelectionReceipt, planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {FractionDivisionRelationsGenerator} from './generator.ts';
import {FractionDivisionRelationsGeneratorSchema, spec} from './spec.ts';
import type {FractionDivisionRelationProblem} from '../../../types/problems.ts';

const magnitudeOf = (data: FractionDivisionRelationProblem): Scope => {
    const operand = data.operandProfile === 'integer-by-fraction' ? data.divisor : data.dividend;
    return operand.numerator < operand.denominator ? Scope.ProperFractions : Scope.ImproperFractions;
};
const zeroOf = (data: FractionDivisionRelationProblem) => data.model.completeGroups === 0 ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;

const profiles = [
    [[Scope.FractionDividend, Scope.FractionDivisor], 'fraction-by-fraction'],
    [[Scope.FractionDividend, Scope.IntegerDivisor], 'fraction-by-integer'],
    [[Scope.IntegerDividend, Scope.FractionDivisor], 'integer-by-fraction']
] as const;

describe('fraction-division-relations capabilities', () => {
    it('owns division and its nonnegative domain without a learner action', () => {
        expect(spec.generalLabels).toEqual([Area.Division, Scope.NumbersWithoutNegatives]);
    });

    it.each(profiles)('resolves the exact original operand bundle %s', (labels, operandProfile) => {
        const problem = generateWithLabels(new FractionDivisionRelationsGenerator(), [
            Area.Division, Scope.NumbersWithoutNegatives, ...labels, Ability.ProcedureExecution
        ])!;
        expect(problem.data.operandProfile).toBe(operandProfile);
        expect(new Set(problem.labels)).toEqual(new Set([...labels, magnitudeOf(problem.data), zeroOf(problem.data)]));
        expect(problem.data).not.toHaveProperty('equationWitness');
        expect(problem.data).not.toHaveProperty('multiplicationWitness');
    });

    it.each(profiles)('selects the mathematical witnesses for %s when requested', (labels) => {
        for (const [mathematicalLabel, field] of [
            [Area.Equation, 'equationWitness'], [Area.Multiplication, 'multiplicationWitness']
        ] as const) {
            const problem = generateWithLabels(new FractionDivisionRelationsGenerator(), [...labels, mathematicalLabel])!;
            expect(problem.data[field]).toBeDefined();
            expect(new Set(problem.labels)).toEqual(new Set([...labels, mathematicalLabel, magnitudeOf(problem.data), zeroOf(problem.data)]));
        }
    });

    it('supports both optional witnesses as one conjunction', () => {
        const labels = [Scope.FractionDividend, Scope.FractionDivisor, Area.Equation, Area.Multiplication];
        const problem = generateWithLabels(new FractionDivisionRelationsGenerator(), labels)!;
        expect(problem.data.equationWitness).toBeDefined();
        expect(problem.data.multiplicationWitness).toBeDefined();
        expect(new Set(problem.labels)).toEqual(new Set([...labels, magnitudeOf(problem.data), zeroOf(problem.data)]));
    });

    it('rejects conflicting original role bundles', () => {
        for (const labels of [
            [Scope.FractionDividend, Scope.IntegerDividend, Scope.FractionDivisor],
            [Scope.IntegerDividend, Scope.IntegerDivisor],
            [Scope.FractionDividend, Scope.FractionDivisor, Scope.IntegerDivisor]
        ]) {
            expect(() => generateWithLabels(new FractionDivisionRelationsGenerator(), labels)).toThrow();
        }
    });

    it.each([Scope.ProperFractions, Scope.ImproperFractions])('supports a preselected evidenced %s operand', magnitude => {
        for (const [roles, operandProfile] of profiles) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const generated = generateWithLabels(new FractionDivisionRelationsGenerator(), [...roles, magnitude])!;
                expect(generated.data.operandProfile).toBe(operandProfile);
                expect(generated.labels).toContain(magnitude);
                expect(magnitudeOf(generated.data)).toBe(magnitude);
            }
        }
    });

    it('is independent of the leaf Ability and contains no selected unknown', () => {
        const labels = [Area.Division, Scope.NumbersWithoutNegatives, Scope.IntegerDividend, Scope.FractionDivisor];
        setSeed(93);
        const execution = generateWithLabels(new FractionDivisionRelationsGenerator(), [...labels, Ability.ProcedureExecution]);
        setSeed(93);
        expect(generateWithLabels(new FractionDivisionRelationsGenerator(), [...labels, Ability.TextualArticulation])).toEqual(execution);
        expect(execution!.data).not.toHaveProperty('unknown');
        expect(execution!.data).not.toHaveProperty('prompt');
    });

    it('admits exactly eleven complete pre-generation operand/group profiles and replays their claims', () => {
        expect(spec).not.toHaveProperty('inferredLabels');
        expect(findSchemaFallbackContractIssues(FractionDivisionRelationsGeneratorSchema)).toEqual([]);
        const result = planCompatibility({identity: {targetId: 'division-profiles', generatorId: spec.generatorId, viewId: 'proof'},
            targetLabels: [], generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(FractionDivisionRelationsGeneratorSchema, [], 'generator')});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const enumeration = enumerateDependencyAuditSelections(result.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(11);
        const configs = new Set<string>();
        for (const selection of enumeration.selections) {
            expect(selection.labels.filter(label => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].includes(label as Scope)))
                .toHaveLength(1);
            for (let seed = 0; seed < 12; seed++) {
                const sampleKey = 'division-profiles#fraction-division-relations#proof#train#question#inst:0';
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                const input = {generatorSchema: FractionDivisionRelationsGeneratorSchema, viewSchema: {}, plan: result.plan,
                    sampleKey, seed, attempt: 1, replay};
                const resolved = resolvePlannedConfigurations(input);
                configs.add(JSON.stringify(resolved.generatorConfig));
                const draw = generatePlannedDraw({...input, generator: new FractionDivisionRelationsGenerator()});
                const data = draw.stub!.data as FractionDivisionRelationProblem;
                expect(draw.labels).toContain(zeroOf(data));
                expect(draw.replay).toEqual(replay);
                expect(generatePlannedDraw({...input, generator: new FractionDivisionRelationsGenerator()})).toEqual(draw);
                setSeed(seed); const state = getRandomState();
                const direct = extractConfig(FractionDivisionRelationsGeneratorSchema, selection.labels);
                expect(direct.config).toEqual(resolved.generatorConfig);
                expect(getRandomState()).toBe(state);
            }
        }
        expect(configs.size).toBe(11);
    });

    it('resolves the always-zero proper-fraction/integer context directly and rejects its impossible opposite', () => {
        const labels = [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions];
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const result = generateWithLabels(new FractionDivisionRelationsGenerator(), labels)!;
            expect(result.data.model.completeGroups).toBe(0);
            expect(result.labels).toContain(Scope.NumbersWithZero);
        }
        const contradictory = [...labels, Scope.NumbersWithoutZero];
        const result = planCompatibility({identity: {targetId: 'infeasible-profile', generatorId: spec.generatorId, viewId: 'proof'},
            targetLabels: contradictory, generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(FractionDivisionRelationsGeneratorSchema, contradictory, 'generator')});
        expect(result.supported).toBe(false);
        expect(() => extractConfig(FractionDivisionRelationsGeneratorSchema, contradictory)).toThrow(/cannot complete/);
        expect(() => extractConfig(FractionDivisionRelationsGeneratorSchema, [...labels, Scope.NumbersWithZero, Scope.NumbersWithoutZero]))
            .toThrow(/Ambiguous exact label mapping/);
    });
});
