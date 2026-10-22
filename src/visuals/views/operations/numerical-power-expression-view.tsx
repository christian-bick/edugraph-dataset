import type {ReactNode} from 'react';
import type {ExactNumericReductionEvidence, ExactPowerFact, NumericalPowerExpressionProblem} from '../../../types/problems.ts';
import {ExactNumericExpression, exactNumericValue, PrescribedNumericCalculation} from './numerical-power-expression-format.tsx';

const Card = ({children}: {children: ReactNode}) => <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 780, maxWidth: '96vw'}}>{children}</main>;
const MathLine = ({children}: {children: ReactNode}) => <div className="my-3 text-2xl leading-loose" style={{overflowWrap: 'anywhere'}}>{children}</div>;
const Response = ({children}: {children: ReactNode}) => <div className="mt-5 min-h-24 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="power-response">{children}</div>;
const Answer = ({children}: {children: ReactNode}) => <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">{children}</div>;
const ValueAtom = ({value}: {value: ExactPowerFact['baseValue']}) => <>{value.numerator < 0 || value.denominator !== 1 ? `(${exactNumericValue(value)})` : exactNumericValue(value)}</>;

function PowerFact({fact}: {fact: ExactPowerFact}) {
    return <div className="mt-3 border-t border-emerald-200 pt-3" data-role="power-fact" data-power-node-id={fact.nodeId}>
        <MathLine><ValueAtom value={fact.baseValue} /><sup className="ml-0.5 text-[0.7em]">{fact.exponent}</sup> = {exactNumericValue(fact.result)}</MathLine>
        {fact.kind === 'zero-exponent' ? <p>The base is nonzero. A nonzero base raised to the power 0 equals {exactNumericValue(fact.result)}.</p>
            : <><p>{fact.exponent} {fact.exponent === 1 ? 'factor' : 'factors'} equal to the base:</p>
                <MathLine>{fact.factors.map((factor, index) => <span key={index}>{index > 0 && ' × '}<ValueAtom value={factor} /></span>)} = {exactNumericValue(fact.result)}</MathLine>
                {fact.cumulativeProducts.length > 0 ? <p>Successive multiplication results: {fact.cumulativeProducts.map(exactNumericValue).join(', ')}.</p>
                    : <p>There is one factor, so no multiplication step is needed.</p>}</>}
    </div>;
}

const reductionCaption = (evidence: ExactNumericReductionEvidence): string => evidence.kind === 'power' ? 'Evaluate the power'
    : evidence.kind === 'group' ? 'Replace the completed grouped quantity'
        : evidence.kind === 'negation' ? 'Take the opposite'
            : {addition: 'Add', subtraction: 'Subtract', multiplication: 'Multiply', division: 'Divide'}[evidence.operation];
const precedenceCaption = {
    'inner-group-before-outer-operation': 'Complete the calculation inside grouping before the operation outside it.',
    'power-before-product-or-sum': 'Evaluate the power before the surrounding arithmetic operations.',
    'product-before-sum': 'Evaluate multiplication or division before addition or subtraction.',
    'equal-priority-left-to-right': 'Operations of equal priority are evaluated from left to right.'
} as const;

/** Every calculation and snapshot is supplied by the producer, including written reduction order. */
export function NumericalPowerEvaluationBody({data, isSolutionView}: {data: NumericalPowerExpressionProblem; isSolutionView: boolean}) {
    return <Card><h1 className="mb-4 text-2xl font-bold">Evaluate the power expression</h1><p>Find the exact value. Show the calculation steps.</p>
        <div className="mt-4 rounded-xl bg-slate-100 px-5 py-2" data-role="power-given-expression"><MathLine><ExactNumericExpression node={data.expression} /></MathLine></div>
        {isSolutionView ? <Answer><h2 className="text-lg font-semibold">Calculation steps</h2>
            {data.precedenceWitness && <p className="mt-2">{precedenceCaption[data.precedenceWitness.reason]}</p>}
            <ol className="mt-3 space-y-3">{data.reductions.map((step, index) => <li key={step.targetNodeId} data-role="power-reduction" data-reduction-node-id={step.targetNodeId}>
                <p className="text-sm font-medium">{index + 1}. {reductionCaption(step.evidence)}</p><MathLine><ExactNumericExpression node={step.after} /></MathLine>
            </li>)}</ol>
            <div className="border-t border-emerald-200 pt-3 text-xl font-bold" data-role="power-final-value">Value: {exactNumericValue(data.finalValue)}</div>
            <h2 className="mt-5 text-lg font-semibold">Power facts</h2>{data.powerFacts.map(fact => <PowerFact key={fact.nodeId} fact={fact} />)}
        </Answer> : <Response><p>Work: ____________________</p><p className="mt-5">Value: ____________________</p></Response>}
    </Card>;
}

/** The fixed writing task projects syntax into necessary prose and withholds all calculated work. */
export function NumericalPowerWritingBody({data, isSolutionView}: {data: NumericalPowerExpressionProblem; isSolutionView: boolean}) {
    return <Card><h1 className="mb-4 text-2xl font-bold">Write a power expression</h1><p>Write one numerical expression for the prescribed calculation. Use exponent notation. Do not find its value.</p>
        <div className="mt-4 rounded-xl bg-slate-100 p-5 text-lg leading-relaxed" data-role="power-prescribed-prose"><PrescribedNumericCalculation node={data.expression} /></div>
        {isSolutionView ? <Answer><h2 className="text-lg font-semibold">Numerical expression</h2><div data-role="power-written-answer"><MathLine><ExactNumericExpression node={data.expression} /></MathLine></div></Answer>
            : <Response>Numerical expression: ____________________</Response>}
    </Card>;
}
