import type {AlgebraicScalar, ExactCoefficientArithmetic, FractionalRectangularPrismVolumeProblem} from '../../../types/problems.ts';

export const prismScalar = (value: AlgebraicScalar): string => value.denominator === 1
    ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
export const prismFactor = (value: AlgebraicScalar): string => value.denominator === 1
    ? prismScalar(value) : `(${prismScalar(value)})`;
const operationSymbol = {addition: '+', subtraction: '−', multiplication: '×', division: '÷'} as const;
export const prismArithmetic = (work: ExactCoefficientArithmetic): string =>
    `${prismFactor(work.operands[0])} ${operationSymbol[work.operation]} ${prismFactor(work.operands[1])} = ${prismScalar(work.result)}`;

export function PhysicalPrismGivens({data, story}: {data: FractionalRectangularPrismVolumeProblem; story: boolean}) {
    const input = data.measuredInput;
    return story ? (
        <p data-role="prism-story" className="leading-relaxed">
            A storage crate has {input.kind === 'three-edges'
                ? <>an inside length of {prismScalar(input.lengthUnits)} u, an inside width of {prismScalar(input.widthUnits)} u,
                    and an inside height of {prismScalar(input.heightUnits)} u.</>
                : <>an inside base area of {prismScalar(input.baseAreaSquareUnits)} u²
                    and an inside height of {prismScalar(input.heightUnits)} u.</>}
            {' '}How many cubic units does the crate hold? The reference length unit is u.
        </p>
    ) : (
        <div data-role="prism-measured-input" className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-semibold">
            {input.kind === 'three-edges'
                ? <><span>Length: {prismScalar(input.lengthUnits)} u</span><span>Width: {prismScalar(input.widthUnits)} u</span>
                    <span>Height: {prismScalar(input.heightUnits)} u</span></>
                : <><span>Base area: {prismScalar(input.baseAreaSquareUnits)} u²</span>
                    <span>Height: {prismScalar(input.heightUnits)} u</span></>}
        </div>
    );
}

export function FractionalFormulaSolution({data, story}: {data: FractionalRectangularPrismVolumeProblem; story: boolean}) {
    const input = data.measuredInput;
    return <>
        <p className="font-semibold">{input.kind === 'three-edges' ? 'V = length × width × height' : 'V = base area × height'}</p>
        <p className="mt-2 font-mono">V = {input.kind === 'three-edges'
            ? `${prismFactor(input.lengthUnits)} u × ${prismFactor(input.widthUnits)} u × ${prismFactor(input.heightUnits)} u`
            : `${prismFactor(input.baseAreaSquareUnits)} u² × ${prismFactor(input.heightUnits)} u`}</p>
        {input.kind === 'three-edges' && <p className="mt-2">Base area: {prismArithmetic(data.physicalProducts.baseArea)} u².</p>}
        <p className="mt-2">Volume: {prismArithmetic(data.physicalProducts.volume)} u³.</p>
        <p data-role="prism-volume-answer" className="mt-3 text-xl font-bold">
            {story ? 'The crate holds' : 'Prism volume:'} {prismScalar(data.volumeCubicUnits)} u³.
        </p>
    </>;
}
