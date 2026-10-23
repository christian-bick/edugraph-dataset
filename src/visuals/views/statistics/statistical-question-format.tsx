import type {StatisticalInvestigation, StatisticalQuestionsProblem, StatisticalResponse} from '../../../types/problems.ts';
import {exactNumericValue} from '../operations/numerical-power-expression-format.tsx';

/** A local seeded permutation changes presentation only and never reads a verdict. */
export function orderStatisticalInvestigations(data: StatisticalQuestionsProblem, seed: number): StatisticalInvestigation[] {
    const rows = [...data.investigations];
    let state = seed >>> 0;
    const next = () => {
        let value = state += 0x6d2b79f5;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
    for (let index = rows.length - 1; index > 0; index--) {
        const other = Math.floor(next() * (index + 1));
        [rows[index], rows[other]] = [rows[other], rows[index]];
    }
    return rows;
}

export const statisticalResponseText = (response: StatisticalResponse): string => response.kind === 'numeric' ? exactNumericValue(response.value) : response.value;

export function StatisticalInvestigationPremises({value}: {value: StatisticalInvestigation}) {
    const plan = value.observationPlan, attribute = value.attribute;
    return <div className="space-y-2" data-role="statistical-investigation-premises">
        <p className="font-semibold">{plan.populationName}</p>
        <p className="text-sm text-slate-600">Named units: {plan.units.map((unit, index) => `U${index + 1}: ${unit.name}`).join('; ')}.</p>
        <p className="text-sm text-slate-600">Named occasions: {plan.occasions.map((occasion, index) => `O${index + 1}: ${occasion.name}`).join('; ')}.</p>
        <p>The investigation would record one response for every named unit on every named occasion.</p>
        {attribute.kind === 'upper-face-number' ? <p data-role="statistical-source-inquiry">What number appears on the upper face when each named standard six-sided die is rolled once on each named occasion?</p>
            : attribute.kind === 'color-choice' ? <p data-role="statistical-source-inquiry">Which color does each named person choose from the menu ({attribute.alternatives.join(', ')}) on each named occasion? Each occasion allows a fresh choice.</p>
                : attribute.kind === 'side-count' ? <p data-role="statistical-source-inquiry">How many sides does each named {attribute.shape} have on each named occasion?</p>
                    : <div data-role="statistical-source-inquiry"><p>Every named sealed box obeys the packing rule: exactly {attribute.pencilsPerBox} pencils per box.</p><p>How many pencils are in each named box on each named occasion?</p></div>}
    </div>;
}

function observationText(value: StatisticalInvestigation, id: string): string {
    const plan = value.observationPlan, index = plan.indices.find(row => row.id === id)!;
    const unitIndex = plan.units.findIndex(row => row.id === index.unitId), occasionIndex = plan.occasions.findIndex(row => row.id === index.occasionId);
    return `U${unitIndex + 1} (${plan.units[unitIndex].name}) on O${occasionIndex + 1} (${plan.occasions[occasionIndex].name})`;
}

/** Read the supplied evidence; no response set, count or classification is inferred from prose. */
export function StatisticalClassificationExplanation({value}: {value: StatisticalInvestigation}) {
    const evidence = value.variability;
    return <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800" data-role="statistical-classification-answer">
        <p className="text-lg font-bold">{evidence.kind === 'anticipated-variation' ? 'Statistical' : 'Not statistical'}</p>
        {evidence.kind === 'anticipated-variation' ? <>
            <p>Responses may vary across the {value.observationPlan.observationCount} planned observations.</p>
            <p data-role="statistical-possibility-proof">For example, {observationText(value, evidence.possibilities[0].observationId)} could give {statisticalResponseText(evidence.possibilities[0].response)}, while {observationText(value, evidence.possibilities[1].observationId)} could give {statisticalResponseText(evidence.possibilities[1].response)}.</p>
            <p>These are possible responses before collection. A future collection can still contain equal responses.</p>
        </> : evidence.kind === 'single-observation' ? <>
            <p>This asks for one specified response: {observationText(value, evidence.observationId)}.</p>
            <p>Uncertainty about that response does not create variation among multiple observations.</p>
        </> : <>
            <p>The stated attribute or rule fixes every planned response at {statisticalResponseText(evidence.response)}.</p>
            <p>All {value.observationPlan.observationCount} planned observations have the same response, so variation is not anticipated.</p>
        </>}
    </div>;
}
