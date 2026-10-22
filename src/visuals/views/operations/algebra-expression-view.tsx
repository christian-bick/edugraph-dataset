import type {ReactNode} from 'react';
import type {AlgebraicExpressionProblem, AlgebraicSubstitution, ExactPowerFact, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraDomains, AlgebraExpression, algebraNode, algebraSymbol, PrescribedAlgebraCalculation} from './algebra-expression-format.tsx';
import {AbstractModelProse, AlgebraContextProse, algebraOutputUnit} from './algebra-expression-context.tsx';
import {ExactNumericExpression, exactNumericNotation, exactNumericValue} from './numerical-power-expression-format.tsx';

const Card = ({children}: {children: ReactNode}) => <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 800, maxWidth: '96vw'}}>{children}</main>;
const MathLine = ({children}: {children: ReactNode}) => <div className="my-3 text-2xl leading-loose" style={{overflowWrap: 'anywhere'}}>{children}</div>;
const Given = ({children}: {children: ReactNode}) => <div className="mt-4 rounded-xl bg-slate-100 p-5">{children}</div>;
const Answer = ({children}: {children: ReactNode}) => <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">{children}</div>;
const Response = ({children}: {children: ReactNode}) => <div className="mt-5 min-h-24 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="algebra-response">{children}</div>;
const Expression = ({data, node, markedId}: {data: AlgebraicExpressionProblem; node: Node; markedId?: string}) => <AlgebraExpression node={node} symbols={data.symbols} markedId={markedId} />;
const ValueAtom = ({value}: {value: ExactPowerFact['baseValue']}) => <>{value.numerator < 0 || value.denominator !== 1 ? `(${exactNumericValue(value)})` : exactNumericValue(value)}</>;

/** A general calculation panel: no powers or no reductions are both valid supplied mathematics. */
function CalculationWork({calculation, unit}: {calculation: AlgebraicSubstitution; unit: string | null}) {
    return <div data-role="algebra-calculation"><h2 className="text-lg font-semibold">Substitute consistently</h2><MathLine><ExactNumericExpression node={calculation.substitutedExpression} /></MathLine>
        <ol className="space-y-3">{calculation.reductions.map((step, index) => <li key={step.targetNodeId} data-role="algebra-reduction" data-reduction-node-id={step.targetNodeId}>
            <p className="text-sm font-medium">Step {index + 1}{step.evidence.kind === 'group' ? ': replace the completed grouped quantity' : ''}</p><MathLine><ExactNumericExpression node={step.after} /></MathLine>
        </li>)}</ol>
        <p className="border-t border-emerald-200 pt-3 text-xl font-bold" data-role="algebra-final-value">Value: {exactNumericNotation(calculation.finalNotation)}{unit && ` ${unit}`}</p>
        {calculation.powerFacts.length > 0 && <section className="mt-5"><h2 className="text-lg font-semibold">Power facts</h2>{calculation.powerFacts.map(fact => <div key={fact.nodeId} className="mt-3 border-t border-emerald-200 pt-3" data-role="algebra-power-fact">
            <MathLine><ValueAtom value={fact.baseValue} /><sup className="ml-0.5 text-[0.7em]">{fact.exponent}</sup> = {exactNumericValue(fact.result)}</MathLine>
            {fact.kind === 'zero-exponent' ? <p>The base is nonzero; raising it to the power 0 gives {exactNumericValue(fact.result)}.</p>
                : <><p>{fact.exponent} {fact.exponent === 1 ? 'factor' : 'factors'} equal to the base:</p><MathLine>{fact.factors.map((factor, index) => <span key={index}>{index > 0 && ' × '}<ValueAtom value={factor} /></span>)} = {exactNumericValue(fact.result)}</MathLine>
                    {fact.cumulativeProducts.length > 0 ? <p>Successive multiplication results: {fact.cumulativeProducts.map(exactNumericValue).join(', ')}.</p> : <p>One factor needs no multiplication step.</p>}</>}
        </div>)}</section>}
    </div>;
}

export function AlgebraExpressionWritingBody({data, isSolutionView}: {data: AlgebraicExpressionProblem; isSolutionView: boolean}) {
    return <Card><h1 className="mb-4 text-2xl font-bold">Write the letter expression</h1><p>Write one expression for the prescribed calculation. Preserve its order; do not calculate a value.</p>
        <Given><div className="text-lg leading-relaxed" data-role="algebra-prescribed-prose"><PrescribedAlgebraCalculation node={data.expression} symbols={data.symbols} revealSymbols /></div><AlgebraDomains data={data} proseRestrictions /></Given>
        {isSolutionView ? <Answer><h2 className="text-lg font-semibold">Expression</h2><div data-role="algebra-written-answer"><MathLine><Expression data={data} node={data.expression} /></MathLine></div></Answer> : <Response>Expression: ____________________</Response>}
    </Card>;
}

/** The first actual relation is the fixed selection rule; no labels or requested-node field are read. */
function structuralSelection(data: AlgebraicExpressionProblem): {component: ReactNode; markedId?: string; role: string; detail: ReactNode; variablePart?: Node} {
    const relation = data.structuralRelations[0], root = data.structuralExpression.expression;
    const node = (id: string) => algebraNode(root, id);
    const render = (part: Node) => <Expression data={data} node={part} />;
    if (relation.kind === 'additive-components') return {component: render(relation.terms[0].signedExpression), role: 'term',
        detail: <>This is one complete signed additive component. The terms at this level are {relation.terms.map((term, index) => <span key={term.sourceNodeId}>{index > 0 && '; '}{render(term.signedExpression)}</span>)}.</>};
    if (relation.kind === 'multiplicative-components') return {component: render(node(relation.factors[0].nodeId)), markedId: relation.factors[0].nodeId, role: 'factor', detail: <>It is one complete multiplicative component of {render(node(relation.productNodeId))}.</>};
    if (relation.kind === 'coefficient') return {component: exactNumericNotation(relation.coefficientNotation), role: 'coefficient', variablePart: relation.variablePart,
        detail: <>It multiplies the designated variable part {render(relation.variablePart)} in the complete term {render(relation.term.signedExpression)}. {relation.constantFactors.length > 0 ? <>The constant factor values are {relation.constantFactors.map(exactNumericValue).join(', ')}.</> : <>There is no explicit constant factor, so its magnitude is the implicit 1.</>}</>};
    const selected = node(relation.operationNodeId);
    if (relation.kind === 'sum') return {component: render(selected), markedId: selected.id, role: 'sum', detail: <>It combines the addends {render(node(relation.addends[0].nodeId))} and {render(node(relation.addends[1].nodeId))}.</>};
    if (relation.kind === 'product') return {component: render(selected), markedId: selected.id, role: 'product', detail: <>It combines the factors {render(node(relation.factors[0].nodeId))} and {render(node(relation.factors[1].nodeId))}.</>};
    return {component: render(selected), markedId: selected.id, role: 'quotient', detail: <>Its numerator is {render(node(relation.numerator.nodeId))} and its denominator is {render(node(relation.denominator.nodeId))}.</>};
}

export function AlgebraExpressionPartsBody({data, isSolutionView}: {data: AlgebraicExpressionProblem; isSolutionView: boolean}) {
    const selected = structuralSelection(data);
    return <Card><h1 className="mb-4 text-2xl font-bold">Classify the expression component</h1><p>Identify the structural role of the marked component in the complete expression.</p>
        <Given><div data-role="algebra-structural-frame" data-frame-kind={data.structuralExpression.kind}><MathLine><Expression data={data} node={data.structuralExpression.expression} markedId={selected.markedId} /></MathLine></div>
            <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3" data-role="algebra-selected-component"><p>Marked component:</p><MathLine>{selected.component}</MathLine></div>
            {selected.variablePart && <p className="mt-3">Designated variable part: <Expression data={data} node={selected.variablePart} />.</p>}
        </Given>
        {isSolutionView ? <Answer><p className="text-xl font-semibold" data-role="algebra-component-category">The marked component is a {selected.role}.</p><div className="mt-3 text-lg leading-relaxed">{selected.detail}</div></Answer> : <Response>Role: ____________________</Response>}
    </Card>;
}

export function AlgebraSubexpressionBody({data, isSolutionView}: {data: AlgebraicExpressionProblem; isSolutionView: boolean}) {
    const incidence = data.groupedOperands[0], root = data.structuralExpression.expression;
    const group = algebraNode(root, incidence.groupNodeId), inner = algebraNode(root, incidence.innerNodeId), parent = algebraNode(root, incidence.parentNodeId);
    const role = incidence.enclosingOperation === 'multiplication' ? 'one whole factor'
        : incidence.enclosingOperation === 'addition' ? 'one whole addend'
            : incidence.enclosingOperation === 'subtraction' ? incidence.position === 'left' ? 'the whole minuend' : 'the whole subtrahend'
                : incidence.enclosingOperation === 'division' ? incidence.position === 'left' ? 'the whole dividend' : 'the whole divisor'
                    : incidence.enclosingOperation === 'power' ? 'the whole base of the power' : 'the whole quantity whose opposite is taken';
    return <Card><h1 className="mb-4 text-2xl font-bold">Interpret the grouped quantity</h1><p>Explain how the marked group acts as one input of the enclosing operation. Keep its inner structure.</p>
        <Given><div data-role="algebra-structural-frame" data-frame-kind={data.structuralExpression.kind}><MathLine><Expression data={data} node={root} markedId={group.id} /></MathLine></div><p>Marked group:</p><MathLine><Expression data={data} node={group} /></MathLine></Given>
        {isSolutionView ? <Answer><p className="text-lg">The group is {role} in <Expression data={data} node={parent} />.</p><p className="mt-3">Inside the group, <Expression data={data} node={inner} /> stays together as one complete quantity.</p></Answer> : <Response>Meaning of the group: ____________________</Response>}
    </Card>;
}

export function AlgebraExpressionEvaluationBody({data, isSolutionView, formula}: {data: AlgebraicExpressionProblem; isSolutionView: boolean; formula: boolean}) {
    const unit = formula ? algebraOutputUnit(data) : null;
    return <Card><h1 className="mb-4 text-2xl font-bold">{formula ? 'Evaluate the contextual formula' : 'Substitute and evaluate'}</h1><p>{formula ? `Use the context to identify the inputs and evaluate the formula. ${unit ? 'Answer with the meaningful unit.' : 'Find the exact resulting number.'}` : 'Substitute each given value consistently, then find the exact value.'}</p>
        {formula && <Given><AlgebraContextProse data={data} includeBindings revealSymbols /></Given>}
        <Given><div data-role="algebra-given-expression"><MathLine><Expression data={data} node={data.expression} /></MathLine></div>
            {!formula && <div data-role="algebra-binding-table">{data.substitution.bindings.map(binding => <p key={binding.symbolId}><i>{algebraSymbol(data.symbols, binding.symbolId)}</i> = {exactNumericNotation(binding.notation)}</p>)}</div>}
            <AlgebraDomains data={data} />
        </Given>
        {isSolutionView ? <Answer><CalculationWork calculation={data.substitution} unit={unit} /></Answer> : <Response><p>Substitution and work: ____________________</p><p className="mt-5">Value{unit ? ' with units' : ''}: ____________________</p></Response>}
    </Card>;
}

export function AlgebraExpressionModelBody({data, isSolutionView}: {data: AlgebraicExpressionProblem; isSolutionView: boolean}) {
    return <Card><h1 className="mb-4 text-2xl font-bold">Model the quantitative situation</h1><p>Identify the varying quantities. Choose a letter for each, state its admissible values, and write one expression for the requested quantity.</p>
        <Given>{data.context.kind === 'quantitative-system' ? <><AlgebraContextProse data={data} includeBindings={false} revealSymbols={false} /><AlgebraDomains data={data} revealSymbols={false} /></> : <AbstractModelProse data={data} />}</Given>
        {isSolutionView ? <Answer><h2 className="text-lg font-semibold">One choice of letters and domains</h2><AlgebraContextProse data={data} includeBindings={false} revealSymbols /><AlgebraDomains data={data} />
            <div data-role="algebra-modeled-answer"><MathLine><Expression data={data} node={data.expression} /></MathLine></div>{algebraOutputUnit(data) && <p>Output unit: {algebraOutputUnit(data)}.</p>}
        </Answer> : <Response><p>Quantity meanings and domains: ____________________</p><p className="mt-5">Expression: ____________________</p></Response>}
    </Card>;
}
