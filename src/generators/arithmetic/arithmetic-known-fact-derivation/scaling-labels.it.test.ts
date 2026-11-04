import {Area, Scope} from 'edugraph-ts';
import {beforeAll, describe, expect, it} from 'vitest';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {matchTarget, matchTargets, type GeneratorMatchInfo, type MatchTuple, type ViewMatchInfo} from '../../../lib/matching.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {getRandomState} from '../../../lib/random.ts';
import {extractSchemaLabels, labelSetHash} from '../../../lib/utils.ts';
import {spec as grade3Targets} from '../../../spec/ccss/grade-03.ts';
import type {KnownFactDerivationProblem} from '../../../types/problems.ts';
import {spec as derivationSpec, OperationsKnownFactDerivationViewSchema} from '../../../visuals/views/operations/operations-known-fact-derivation/spec.ts';
import {spec as inversionSpec, OperationsKnownFactInversionViewSchema} from '../../../visuals/views/operations/operations-known-fact-inversion/spec.ts';
import {ArithmeticKnownFactDerivationGenerator} from './generator.ts';
import {spec, ArithmeticKnownFactDerivationGeneratorSchema as schema} from './spec.ts';

const migrations = [
    ['2da80b18', 'c9f9a57d', Scope.NumbersSmaller120],
    ['703366da', '3df7c1b7', Scope.NumbersSmaller100],
    ['a0353fc0', 'c0753c57', Scope.NumbersSmaller1000]
] as const;
const prefix = '3.NBT.A.3-one-digit-times-multiple-of-ten';
const sourceTargets = grade3Targets.filter(target => target.labels.some(label =>
    label === Area.MultiplicationKnownFactDerivation || label === Area.DivisionKnownFactDerivation));
const model: GeneratorMatchInfo = {generatorId: spec.generatorId, spec, schema,
    generalLabels: spec.generalLabels, labels: [...spec.generalLabels, ...extractSchemaLabels(schema)],
    problemType: 'KnownFactDerivationProblem'};
const views: ViewMatchInfo[] = [
    {spec: derivationSpec, schema: OperationsKnownFactDerivationViewSchema},
    {spec: inversionSpec, schema: OperationsKnownFactInversionViewSchema}
].map(({spec: viewSpec, schema: viewSchema}) => ({viewId: viewSpec.viewId, spec: viewSpec, schema: viewSchema,
    supportedLabels: [...viewSpec.generalLabels], generalLabels: viewSpec.generalLabels,
    problemType: 'KnownFactDerivationProblem'}));
let routes: MatchTuple[];
beforeAll(() => { routes = matchTargets(sourceTargets, [model], views).tuples; });

describe('one-digit times whole-ten classification', () => {
    it('retains every Grade 3 known-fact target and both existing consumer families', () => {
        expect(sourceTargets).toHaveLength(18);
        expect(routes).toHaveLength(32);
        expect(new Set(routes.map(route => route.target.id))).toEqual(new Set(sourceTargets.map(target => target.id)));
        expect(new Set(routes.map(route => route.viewId))).toEqual(new Set(views.map(view => view.viewId)));
    });

    it.each(migrations)('migrates only the false scope from source %s to %s', (oldHash, newHash, upper) => {
        const target = sourceTargets.find(target => target.id === `${prefix}~${newHash}`)!;
        expect(target).toBeDefined();
        expect(target.labels).not.toContain(Scope.MultiplesOf10);
        expect(target.labels).toEqual(expect.arrayContaining([Area.MultiplicationKnownFactDerivation,
            Area.PlaceValue, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, upper]));
        expect(labelSetHash(target.labels)).toBe(newHash);
        expect(labelSetHash([...target.labels, Scope.MultiplesOf10])).toBe(oldHash);
        const retained = routes.filter(route => route.target.id === target.id);
        expect(retained.map(route => route.viewId).sort()).toEqual(views.map(view => view.viewId).sort());
        for (const view of views) {
            expect(matchTarget({...target, id: `${prefix}~${oldHash}`,
                labels: [...target.labels, Scope.MultiplesOf10]}, model, view)).toEqual({
                matched: false, reason: 'unsupported-label', label: Scope.MultiplesOf10});
        }
        for (const route of retained) {
            const selections = enumerateDependencyAuditSelections(route.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections.length).toBeGreaterThan(0);
            expect(selections.selections.every(selection => !selection.labels.includes(Scope.MultiplesOf10))).toBe(true);
            for (let seed = 0; seed < 8; seed++) {
                const view = views.find(view => view.viewId === route.viewId)!;
                const input = {generator: new ArithmeticKnownFactDerivationGenerator(), generatorSpec: spec,
                    viewSchema: view.schema!, viewSpec: view.spec, plan: route.plan,
                    sampleKey: `${target.id}#${model.generatorId}#${view.viewId}#train#question#inst:0`,
                    attempt: 1, seed};
                const first = generatePlannedDraw(input), state = getRandomState();
                expect(first.stub).not.toBeNull();
                const data = first.stub!.data as KnownFactDerivationProblem;
                expect(data.strategy).toBe('place-value-scaling');
                expect(data.derivedOperands).toEqual([data.knownFact.firstFactor, data.knownFact.secondFactor * 10]);
                expect(data.answer).toBe(data.derivedOperands[0] * data.derivedOperands[1]);
                expect(data.derivedOperands[0]).toBeGreaterThanOrEqual(2);
                expect(data.derivedOperands[0]).toBeLessThanOrEqual(9);
                expect(data.derivedOperands[1] % 10).toBe(0);
                expect(first.labels).not.toContain(Scope.MultiplesOf10);
                expect(generatePlannedDraw({...input, replay: first.replay})).toEqual(first);
                expect(getRandomState()).toBe(state);
            }
        }
    });
});
