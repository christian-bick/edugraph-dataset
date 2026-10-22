import type {ReactNode} from 'react';
import type {AlgebraicEquationProblem, AlgebraicInequalityProblem, AlgebraicScalar, StatementAssignmentCheck, StatementSideEvaluation} from '../../../types/problems.ts';
import {ExactNumericExpression, exactNumericNotation, exactNumericValue} from './numerical-power-expression-format.tsx';
import {StatementDomain, StatementRelation, statementOperator, type StatementProblem} from './algebra-statement-format.tsx';
import {StatementSolutionLine} from './algebra-statement-numberline.tsx';

const Card = ({children}: {children: ReactNode}) => <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 800, maxWidth: '96vw'}}>{children}</main>;
const Given = ({children}: {children: ReactNode}) => <div className="mt-4 space-y-3 rounded-xl bg-slate-100 p-5">{children}</div>;
const Answer = ({children}: {children: ReactNode}) => <div className="mt-5 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">{children}</div>;
const Response = ({children}: {children: ReactNode}) => <div className="mt-5 min-h-24 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="statement-response">{children}</div>;
const MathLine = ({children}: {children: ReactNode}) => <div className="my-3 text-2xl leading-loose" style={{overflowWrap: 'anywhere'}}>{children}</div>;
const values = (items: readonly AlgebraicScalar[]) => `{${items.map(exactNumericValue).join(', ')}}`;
const atom = (value: AlgebraicScalar) => value.numerator < 0 || value.denominator !== 1 ? `(${exactNumericValue(value)})` : exactNumericValue(value);
const Domain = ({data}: {data: StatementProblem}) => <p>Admissible values: <StatementDomain domain={data.ambientDomain} />.</p>;
const Relation = ({data}: {data: StatementProblem}) => <MathLine><StatementRelation statement={data.statement} variable={data.variable} /></MathLine>;
const Cardinality = ({data}: {data: StatementProblem}) => <p data-role="solution-cardinality">{data.solutionCardinality.kind === 'infinite' ? 'There are infinitely many solutions in the stated domain.' : `Number of solutions in the stated domain: ${data.solutionCardinality.count}.`}</p>;

function NumericWork({side, label}: {side: StatementSideEvaluation; label: string}) {
    return <section data-role="statement-side-work"><h3 className="font-semibold">{label}</h3><MathLine><ExactNumericExpression node={side.calculation.expression} /></MathLine>
        {side.calculation.reductions.map((step, index) => <div key={step.targetNodeId} data-role="statement-reduction"><p>Step {index + 1}</p><MathLine><ExactNumericExpression node={step.after} /></MathLine></div>)}
        <p>Value: {exactNumericValue(side.calculation.finalValue)}.</p></section>;
}
function CheckedAssignment({check, data}: {check: StatementAssignmentCheck; data: StatementProblem}) {
    return <div className="space-y-4" data-role="checked-assignment"><p>Use <i>{data.variable.symbol}</i> = {exactNumericNotation(check.binding.notation)} consistently in every occurrence.</p>
        <NumericWork side={check.left} label="Left side after substitution" /><NumericWork side={check.right} label="Right side after substitution" />
        <p className="font-semibold" data-role="statement-truth">{exactNumericValue(check.comparison.leftValue)} {statementOperator[check.comparison.operator]} {exactNumericValue(check.comparison.rightValue)} is {check.comparison.truth ? 'true' : 'false'}. This assignment {check.comparison.truth ? 'satisfies' : 'does not satisfy'} the relation.</p></div>;
}
export function AlgebraSubstitutionCheckBody({data, isSolutionView}: {data: StatementProblem; isSolutionView: boolean}) {
    // The strict guard proves one exact row matches the supplied binding, including its spelling.
    const check = data.candidateChecks.find(row => row.binding.symbolId === data.assignment.symbolId && row.binding.value.numerator === data.assignment.value.numerator && row.binding.value.denominator === data.assignment.value.denominator)!;
    return <Card><h1 className="text-2xl font-bold">Check a candidate by substitution</h1><p className="mt-3">Substitute the given candidate, evaluate both sides and decide whether the relation is true.</p>
        <Given><Domain data={data} /><Relation data={data} /><p>Candidate universe: {'{'}{data.candidateUniverse.map(candidate => exactNumericNotation(candidate.notation)).join(', ')}{'}'}.</p><p data-role="given-assignment">Given candidate: <i>{data.variable.symbol}</i> = {exactNumericNotation(data.assignment.notation)}.</p></Given>
        {isSolutionView ? <Answer><CheckedAssignment check={check} data={data} /><p>This checks the supplied candidate; it does not determine every solution in the ambient domain.</p></Answer> : <Response>Substitution, exact calculations and truth: ____________________</Response>}
    </Card>;
}
export function AlgebraSolutionMeaningBody({data, isSolutionView}: {data: StatementProblem; isSolutionView: boolean}) {
    return <Card><h1 className="text-2xl font-bold">Explain the solution-selection process</h1><p className="mt-3">Why does this process select precisely the solutions from the entire candidate universe?</p>
        <Given><Domain data={data} /><Relation data={data} /><p>The universe for this process is the finite set {'{'}{data.candidateUniverse.map(candidate => exactNumericNotation(candidate.notation)).join(', ')}{'}'}.</p>
            <table className="w-full text-left" data-role="candidate-truth-table"><thead><tr><th>Candidate</th><th>Left value</th><th>Right value</th><th>Relation true?</th></tr></thead><tbody>{data.candidateChecks.map(row => <tr key={row.candidateId}><td>{exactNumericNotation(row.binding.notation)}</td><td>{exactNumericValue(row.comparison.leftValue)}</td><td>{exactNumericValue(row.comparison.rightValue)}</td><td>{row.comparison.truth ? 'Yes' : 'No'}</td></tr>)}</tbody></table>
            <p>Process: check each candidate and retain exactly the true rows.</p><p data-role="given-restricted-set">Selected values: {values(data.restrictedSolutions.values)}.</p></Given>
        {isSolutionView ? <Answer data-role="solution-meaning-answer"><p>Each retained candidate makes the original relation true, so it belongs to this solution set. Every other candidate makes it false and is rejected.</p><p>Every value in this finite universe was checked. Therefore the selected set {values(data.restrictedSolutions.values)} contains all and only its satisfying values.</p><p>This conclusion concerns the stated candidate universe. Values elsewhere in the ambient domain were not decided by this finite selection process.</p></Answer> : <Response>Explain why the selection is both correct and complete: ____________________</Response>}
    </Card>;
}

function EquationContext({data}: {data: AlgebraicEquationProblem}) {
    const context = data.context;
    return <div className="space-y-3" data-role="statement-context-prose">{context.kind === 'number-relation' ? <><p>An input number is {context.relationship === 'sum' ? <>combined by addition with {exactNumericNotation(context.constantQuantity.notation)}</> : <>multiplied by the scale factor {exactNumericNotation(context.constantQuantity.notation)}</>}. The resulting number is {exactNumericNotation(context.resultQuantity.notation)}.</p><p>Determine the input number.</p></>
        : context.kind === 'combined-amounts' ? <><p>An initial amount receives an added amount of {exactNumericNotation(context.addedQuantity.notation)} {context.addedQuantity.unit.name}. The total amount is {exactNumericNotation(context.totalQuantity.notation)} {context.totalQuantity.unit.name}.</p><p>Determine the initial amount, measured in {context.variableQuantity.unit.name}.</p></>
            : <><p>{context.variableQuantity.meaning === 'duration' ? 'A duration' : context.variableQuantity.meaning === 'group-count' ? 'A number of groups' : 'An amount per group'} is unknown, measured in {context.variableQuantity.unit.name}. The {context.multiplierQuantity.meaning.replaceAll('-', ' ')} is {exactNumericNotation(context.multiplierQuantity.notation)} {context.multiplierQuantity.unit.name}. Their product is the total amount, {exactNumericNotation(context.totalQuantity.notation)} {context.totalQuantity.unit.name}.</p><p>Determine the unknown quantity.</p></>}
        <Domain data={data} /></div>;
}
function AmbientSet({data}: {data: StatementProblem}) {
    const solution = data.ambientSolution;
    return <div data-role="ambient-solution">{solution.kind === 'empty' ? <p>No value in the stated domain satisfies the relation. The solution set is empty.</p>
        : solution.kind === 'all-domain' ? <p>Every value in the original admissible domain satisfies the relation. The solution set is that entire domain, including its original restrictions.</p>
            : solution.kind === 'singleton' ? <p>The complete solution set is {'{'}{exactNumericNotation(solution.notation)}{'}'}.</p>
                : solution.kind === 'finite' ? <p>The complete solution set is {values(solution.values)}.</p>
                    : solution.kind === 'ray' ? <p>All admissible values {solution.direction === 'less' ? 'less than' : 'greater than'} {exactNumericValue(solution.boundary)} satisfy the inequality; the boundary itself is excluded.</p>
                        : <><p>The solution interval has {solution.lower ? `${solution.lower.inclusive ? 'included' : 'excluded'} lower endpoint ${exactNumericValue(solution.lower.value)}` : 'no lower bound'} and {solution.upper ? `${solution.upper.inclusive ? 'included' : 'excluded'} upper endpoint ${exactNumericValue(solution.upper.value)}` : 'no upper bound'}.</p>{solution.excludedValues.length > 0 && <p>Exclude {values(solution.excludedValues)} from this interval.</p>}</>}
        <Cardinality data={data} /></div>;
}
function EquationWork({data}: {data: AlgebraicEquationProblem}) {
    const witness = data.solutionWitness;
    if (witness.kind === 'zero-coefficient') return <div data-role="equation-exception"><p>The multiplier is {exactNumericValue(witness.coefficient)}. Its product with any admissible value is 0.</p><p>0 = {exactNumericValue(witness.constant)} is {witness.constantTruth ? 'true' : 'false'}, so {witness.constantTruth ? 'all admissible values work' : 'no admissible value works'}. Division by zero is not used.</p></div>;
    if (witness.kind === 'nonnegative-addend-exceeds-total') return <div data-role="equation-exception"><p>The initial value is nonnegative. Adding {exactNumericValue(witness.addend)} therefore gives at least {exactNumericValue(witness.addend)}, which is greater than {exactNumericValue(witness.total)}. No admissible value can give the required total.</p></div>;
    return <div className="space-y-4" data-role="equation-inverse-work">{witness.transformations.map((step, index) => <section key={index}>{step.kind === 'constant-comparison' ? <p>{exactNumericValue(step.leftConstant)} = {exactNumericValue(step.rightConstant)} is {step.equal ? 'true' : 'false'}.</p> : <><p>{step.kind === 'subtract-same-addend' ? `Subtract the same ${atom(step.operand)} from both sides.` : `Divide both sides by the same nonzero ${atom(step.divisor)}.`}</p><MathLine><StatementRelation statement={step.before} variable={data.variable} /></MathLine><p>Then</p><MathLine><StatementRelation statement={step.after} variable={data.variable} /></MathLine></>}</section>)}
        <p>The isolated value {exactNumericValue(witness.algebraicValue)} {witness.admissible ? 'belongs to' : 'does not belong to'} the original admissible domain.</p>{witness.verification !== null && <CheckedAssignment check={witness.verification} data={data} />}</div>;
}
export function AlgebraEquationModelSolveBody({data, isSolutionView}: {data: AlgebraicEquationProblem; isSolutionView: boolean}) {
    return <Card><h1 className="text-2xl font-bold">Model and solve an equation</h1><p className="mt-3">Define a variable, write the equation and determine every admissible solution.</p><Given><EquationContext data={data} /></Given>
        {isSolutionView ? <Answer><p>Let <i>{data.variable.symbol}</i> denote {data.context.kind === 'number-relation' ? 'the input number' : `the ${data.context.variableQuantity.meaning.replaceAll('-', ' ')}, measured in ${data.context.variableQuantity.unit.name}`}.</p><Relation data={data} /><EquationWork data={data} /><AmbientSet data={data} />{data.context.kind !== 'number-relation' && <p>The solution values use {data.context.variableQuantity.unit.name}.</p>}</Answer> : <Response>Variable: __________; Equation: __________; Solution{data.context.kind !== 'number-relation' && ' with its unit'} and work: __________</Response>}
    </Card>;
}

const thresholdDescription = {temperature: {quantity: 'temperature', unit: 'degrees Celsius', reference: '0 degrees Celsius'}, elevation: {quantity: 'elevation', unit: 'meters', reference: 'sea level'}, balance: {quantity: 'net balance', unit: 'dollars', reference: 'a settled balance'}} as const;
function InequalityContext({data}: {data: AlgebraicInequalityProblem}) {
    const description = thresholdDescription[data.context.context.kind];
    return <div className="space-y-3" data-role="statement-context-prose"><p>A {description.quantity}, measured in {description.unit} relative to {description.reference}, must be strictly {data.context.relationship === 'strictly-below-threshold' ? 'below' : 'above'} {exactNumericNotation(data.context.threshold.notation)} {description.unit}.</p><Domain data={data} /></div>;
}
export function AlgebraInequalityModelBody({data, isSolutionView}: {data: AlgebraicInequalityProblem; isSolutionView: boolean}) {
    const description = thresholdDescription[data.context.context.kind];
    return <Card><h1 className="text-2xl font-bold">Model a strict condition</h1><p className="mt-3">Define the quantity with a letter and write the strict inequality.</p><Given><InequalityContext data={data} /></Given>
        {isSolutionView ? <Answer><p>Let <i>{data.variable.symbol}</i> denote the {description.quantity} in {description.unit}.</p><Relation data={data} /><Domain data={data} /></Answer> : <Response>Quantity and variable: __________; Inequality: __________</Response>}
    </Card>;
}
export function AlgebraInequalityNumberlineBody({data, isSolutionView, seed}: {data: AlgebraicInequalityProblem; isSolutionView: boolean; seed: number}) {
    return <Card><h1 className="text-2xl font-bold">Graph the complete solution set</h1><p className="mt-3">Represent every satisfying value in the stated domain on the number line.</p><Given><Domain data={data} /><Relation data={data} /></Given><StatementSolutionLine data={data} isSolutionView={isSolutionView} seed={seed} />{isSolutionView && <Answer><AmbientSet data={data} /></Answer>}</Card>;
}
export function AlgebraInequalityInfiniteSolutionsBody({data, isSolutionView}: {data: AlgebraicInequalityProblem; isSolutionView: boolean}) {
    const solution = data.ambientSolution;
    return <Card><h1 className="text-2xl font-bold">Interpret the inequality's solutions</h1><p className="mt-3">Explain which values satisfy it, whether the strict boundary is included, and how many solutions the stated domain permits.</p><Given><Domain data={data} /><Relation data={data} /></Given>
        {isSolutionView ? <Answer><AmbientSet data={data} /><p>The value {exactNumericNotation(data.bound.notation)} makes the two sides equal, so it fails this strict inequality.</p>
            {solution.kind === 'ray' && <div data-role="infinite-family"><p>For every positive integer n, <i>{data.variable.symbol}</i> = {atom(solution.infiniteFamily.base)} {solution.infiniteFamily.direction === 'add' ? '+' : '-'} n × {atom(solution.infiniteFamily.step)} is a distinct satisfying value.</p><p>Solutions continue without a final value toward {solution.direction === 'less' ? 'smaller' : 'larger'} numbers. The entire ray, rather than only these example values, is the solution set.</p></div>}
            {solution.kind === 'interval' && <div data-role="infinite-subinterval"><p>The open subinterval ({exactNumericValue(solution.infiniteSubinterval.lower)}, {exactNumericValue(solution.infiniteSubinterval.upper)}) lies inside the solution set and avoids its exclusions. It contains the supplied value {exactNumericValue(solution.infiniteSubinterval.interior)} and infinitely many rational values.</p><p>Infinitely many values can lie in a bounded interval; this does not require an unbounded ray.</p></div>}
        </Answer> : <Response>Solution-set meaning, strict boundary and cardinality: ____________________</Response>}
    </Card>;
}
