import type {ReactNode} from 'react';
import type {AffineExpression, AffineNormalizationProof, AffineRewriteStep, AlgebraExpressionEquivalenceProblem as Problem, ExactAffineEvaluation, ExactAffineNormalForm, ExactCoefficientArithmetic, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraExpression, algebraNode, algebraSymbol} from './algebra-expression-format.tsx';
import {ExactNumericExpression, exactNumericNotation, exactNumericValue} from './numerical-power-expression-format.tsx';

const Card = ({children}: {children: ReactNode}) => <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 800, maxWidth: '96vw'}}>{children}</main>;
const MathLine = ({children}: {children: ReactNode}) => <div className="my-3 text-2xl leading-loose" style={{overflowWrap: 'anywhere'}}>{children}</div>;
const Given = ({children}: {children: ReactNode}) => <div className="mt-4 rounded-xl bg-slate-100 p-5">{children}</div>;
const Answer = ({children}: {children: ReactNode}) => <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">{children}</div>;
const Response = ({children}: {children: ReactNode}) => <div className="mt-5 min-h-24 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="equivalence-response">{children}</div>;
const getExpression = (data: Problem, id: string): AffineExpression => data.expressions.find(expression => expression.expressionId === id)!;
const Expression = ({data, expression}: {data: Problem; expression: AffineExpression}) => <AlgebraExpression node={expression.root} symbols={data.domain.symbols} />;
const ValueAtom = ({value}: {value: ExactCoefficientArithmetic['result']}) => <>{value.numerator < 0 || value.denominator !== 1 ? `(${exactNumericValue(value)})` : exactNumericValue(value)}</>;
const arithmeticSymbol = {addition: '+', subtraction: '-', multiplication: '×', division: '÷'} as const;
const Arithmetic = ({calculation}: {calculation: ExactCoefficientArithmetic}) => <><ValueAtom value={calculation.operands[0]} /> {arithmeticSymbol[calculation.operation]} <ValueAtom value={calculation.operands[1]} /> = {exactNumericValue(calculation.result)}</>;

function containsNumericLiteral(node: Node): boolean {
    if (node.kind === 'number' || node.kind === 'power') return true;
    if (node.kind === 'variable') return false;
    if (node.kind === 'binary') return containsNumericLiteral(node.left) || containsNumericLiteral(node.right);
    return containsNumericLiteral(node.kind === 'group' ? node.expression : node.operand);
}

/** A genuine source-atom representation premise; never read aggregate maps or candidate evidence. */
function OriginalAtomPremises({data}: {data: Problem}) {
    const source = getExpression(data, data.validIdentity.sourceExpressionId);
    if (containsNumericLiteral(source.root)) return null;
    const proof = data.validIdentity.universalProof;
    const sourceProof = proof.leftExpressionId === source.expressionId ? proof.leftNormalization : proof.rightNormalization;
    const seen = new Set<string>();
    const atoms = sourceProof.steps.filter(step => {
        if (step.kind !== 'variable' || seen.has(step.symbolId)) return false;
        seen.add(step.symbolId); return true;
    });
    return <div className="mt-3 space-y-2 text-sm" data-role="original-atom-premises">{atoms.map(atom => atom.kind === 'variable' && <p key={atom.nodeId}>A bare variable atom <i>{algebraSymbol(data.domain.symbols, atom.symbolId)}</i> denotes {exactNumericValue(atom.unitCoefficient)} × <i>{algebraSymbol(data.domain.symbols, atom.symbolId)}</i>.</p>)}</div>;
}

function CommonDomain({data}: {data: Problem}) {
    return <div data-role="equivalence-common-domain"><p>Common domain: {data.domain.symbols.map((symbol, index) => <span key={symbol.symbolId}>{index > 0 && ', '}<i>{symbol.symbol}</i></span>)} range independently over all rational numbers.</p><OriginalAtomPremises data={data} /></div>;
}

/** Formats a supplied complete coefficient map; omitted variable coefficients mean zero. */
function NormalForm({data, form}: {data: Problem; form: ExactAffineNormalForm}) {
    return <div className="my-3 rounded border border-emerald-200 p-3" data-role="affine-normal-form"><p>Constant: {exactNumericValue(form.constant)}.</p>
        {form.coefficients.map(row => <p key={row.symbolId}>Coefficient of <i>{algebraSymbol(data.domain.symbols, row.symbolId)}</i>: {exactNumericValue(row.coefficient)}.</p>)}
        <p>{form.coefficients.length === 0 ? 'All variable coefficients are 0.' : 'All unlisted variable coefficients are 0.'}</p>
    </div>;
}

function CoefficientCalculations({data, proof}: {data: Problem; proof: AffineNormalizationProof}) {
    const original = getExpression(data, proof.expressionId);
    const steps = proof.steps.filter(step => 'components' in step);
    if (steps.length === 0) return null;
    return <div className="mt-3 space-y-3" data-role="affine-coefficient-calculations">{steps.map(step => 'components' in step && <div key={step.nodeId} className="border-t border-emerald-200 pt-2">
        <p>For <AlgebraExpression node={algebraNode(original.root, step.nodeId)} symbols={data.domain.symbols} />:</p>
        {step.components.map(component => <p className="ml-3" key={component.symbolId ?? 'constant'}>{component.symbolId === null ? 'Constant' : <>Coefficient of <i>{algebraSymbol(data.domain.symbols, component.symbolId)}</i></>}: <Arithmetic calculation={component.arithmetic} /></p>)}
    </div>)}</div>;
}

function UniversalProof({data, proof}: {data: Problem; proof: Problem['validIdentity']['universalProof']}) {
    return <div data-role="universal-affine-proof"><p>The complete affine coefficient maps agree.</p>
        <p className="mt-3 font-semibold">First expression</p><NormalForm data={data} form={proof.leftNormalization.rootNormalForm} />
        <p className="mt-3 font-semibold">Second expression</p><NormalForm data={data} form={proof.rightNormalization.rootNormalForm} />
        <p>Equal constants and equal coefficients give the same value for every assignment in the common rational domain.</p>
    </div>;
}

const rewriteInstruction = (step: AffineRewriteStep): string => step.kind === 'distribution' ? step.direction === 'factored-to-expanded' ? 'Use distribution to expand the expression.' : 'Use distribution to extract a common multiplier.'
    : step.kind === 'collection' ? 'Combine the like terms.'
        : step.kind === 'association' ? `Use association of ${step.operation} to change grouping without changing operand order.`
            : step.kind === 'commutation' ? `Use commutation of ${step.operation} to change operand order.`
                : step.kind === 'constant-arithmetic' ? 'Simplify the constant arithmetic.' : 'Write an equivalent expression by combining its constant and variable coefficients.';

function RewriteEvidence({data, step}: {data: Problem; step: AffineRewriteStep}) {
    const before = getExpression(data, step.beforeExpressionId);
    if (step.kind === 'distribution') return <><p>The common multiplier is {exactNumericValue(step.scalar)}. Distribution {step.direction === 'factored-to-expanded' ? 'multiplies each addend' : 'extracts the same multiplier from each indicated product'}.</p>
        {step.coefficientProducts.map((calculation, index) => <p key={index}><Arithmetic calculation={calculation} /></p>)}</>;
    if (step.kind === 'collection') return <><p>Signed coefficients of the like <i>{algebraSymbol(data.domain.symbols, step.symbolId)}</i> terms: {step.terms.map(term => exactNumericValue(term.signedCoefficient)).join(', ')}.</p>
        {step.coefficientSums.map((calculation, index) => <p key={index}><Arithmetic calculation={calculation} /></p>)}<p>Collected coefficient: {exactNumericValue(step.collectedCoefficient)}.</p></>;
    if (step.kind === 'association') return <p>The operand order stays {step.orderedOperandNodeIds.map((id, index) => <span key={id}>{index > 0 && ', '}<AlgebraExpression node={algebraNode(before.root, id)} symbols={data.domain.symbols} /></span>)}. Only the {step.operation} grouping changes.</p>;
    if (step.kind === 'commutation') return <p>The operands <AlgebraExpression node={algebraNode(before.root, step.operandNodeIds[0])} symbols={data.domain.symbols} /> and <AlgebraExpression node={algebraNode(before.root, step.operandNodeIds[1])} symbols={data.domain.symbols} /> swap positions under {step.operation}.</p>;
    if (step.kind === 'constant-arithmetic') return <p><Arithmetic calculation={step.arithmetic} /></p>;
    return <><p>Combine the constant and each variable coefficient in the two expressions.</p>
        <CoefficientCalculations data={data} proof={step.proof.leftNormalization} /><CoefficientCalculations data={data} proof={step.proof.rightNormalization} /></>;
}

export function AlgebraEquivalenceGenerateBody({data, isSolutionView}: {data: Problem; isSolutionView: boolean}) {
    const source = getExpression(data, data.validIdentity.sourceExpressionId);
    return <Card><h1 className="mb-4 text-2xl font-bold">Generate an equivalent expression</h1><p>{rewriteInstruction(data.validIdentity.steps[0])} Give an expression that agrees for every admissible assignment.</p>
        <Given><CommonDomain data={data} /><div data-role="equivalence-source"><MathLine><Expression data={data} expression={source} /></MathLine></div></Given>
        {isSolutionView ? <Answer><h2 className="text-lg font-semibold">Equivalent rewrite</h2><ol className="space-y-4">{data.validIdentity.steps.map((step, index) => <li key={index} data-role="affine-rewrite-step">
            <p className="mt-3 font-medium">Step {index + 1}: {rewriteInstruction(step)}</p><MathLine><Expression data={data} expression={getExpression(data, step.beforeExpressionId)} /> = <Expression data={data} expression={getExpression(data, step.afterExpressionId)} /></MathLine><RewriteEvidence data={data} step={step} />
        </li>)}</ol><div className="mt-5 border-t border-emerald-200 pt-3" data-role="equivalence-generated-answer"><p className="font-semibold">One equivalent expression</p><MathLine><Expression data={data} expression={getExpression(data, data.validIdentity.equivalentExpressionId)} /></MathLine></div>
            <UniversalProof data={data} proof={data.validIdentity.universalProof} />
        </Answer> : <Response>Equivalent expression and work: ____________________</Response>}
    </Card>;
}

function CounterexampleSide({side, label}: {side: ExactAffineEvaluation; label: string}) {
    return <section className="mt-4 border-t border-emerald-200 pt-3" data-role="counterexample-calculation"><h3 className="font-semibold">{label}</h3><MathLine><ExactNumericExpression node={side.calculation.expression} /></MathLine>
        {side.calculation.reductions.map((step, index) => <div key={step.targetNodeId}><p className="text-sm">Step {index + 1}</p><MathLine><ExactNumericExpression node={step.after} /></MathLine></div>)}
        <p>Value: {exactNumericValue(side.calculation.finalValue)}.</p>
    </section>;
}

export function AlgebraEquivalenceJudgeBody({data, isSolutionView}: {data: Problem; isSolutionView: boolean}) {
    const source = getExpression(data, data.comparison.sourceExpressionId), candidate = getExpression(data, data.comparison.candidateExpressionId);
    return <Card><h1 className="mb-4 text-2xl font-bold">Judge equivalence</h1><p>Do these expressions agree for every assignment in the common domain? Justify your judgment.</p>
        <Given><CommonDomain data={data} /><p className="mt-3 font-medium">Expression A</p><div data-role="equivalence-source"><MathLine><Expression data={data} expression={source} /></MathLine></div>
            <p className="font-medium">Expression B</p><div data-role="equivalence-candidate"><MathLine><Expression data={data} expression={candidate} /></MathLine></div>
        </Given>
        {isSolutionView ? <Answer>{data.comparison.kind === 'equivalent' ? <><h2 className="mb-3 text-xl font-semibold" data-role="equivalence-verdict">The expressions are equivalent.</h2><UniversalProof data={data} proof={data.comparison.universalProof} /></>
            : <><h2 className="mb-3 text-xl font-semibold" data-role="equivalence-verdict">The expressions are not equivalent.</h2><p>One admissible assignment is enough to disprove agreement for every assignment.</p>
                <div className="mt-3" data-role="equivalence-counterexample-bindings">{data.comparison.counterexample.bindings.map(binding => <p key={binding.symbolId}><i>{algebraSymbol(data.domain.symbols, binding.symbolId)}</i> = {exactNumericNotation(binding.notation)}.</p>)}</div>
                <CounterexampleSide side={data.comparison.counterexample.left} label="Expression A after substitution" /><CounterexampleSide side={data.comparison.counterexample.right} label="Expression B after substitution" />
                <p className="mt-4 text-lg font-semibold">{exactNumericValue(data.comparison.counterexample.unequalValues.left)} is not equal to {exactNumericValue(data.comparison.counterexample.unequalValues.right)}.</p>
            </>}
        </Answer> : <Response><p>Judgment: ____________________</p><p className="mt-5">Justification: ____________________</p></Response>}
    </Card>;
}
