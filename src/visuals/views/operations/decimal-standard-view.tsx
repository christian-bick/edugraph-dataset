import type {ReactNode} from 'react';
import type {
    DecimalStandardAddSubtractProblem, DecimalStandardDivisionProblem,
    DecimalStandardMultiplicationProblem, ExactDecimalValue
} from '../../../types/problems.ts';
import {alignedIntegerDigits, decimalDigitAt, decimalPartialDigits} from './decimal-standard-helpers.ts';

const GREEN = 'text-emerald-800';
const NEUTRAL = 'text-slate-900';

function Card({title, expression, children}: {title: string; expression: ReactNode; children: ReactNode}) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 font-sans text-slate-800 shadow-sm" style={{width: 960, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">{title}</div>
        <h1 className="mb-4 mt-2 font-mono text-xl font-bold text-slate-900">{expression}</h1>
        {children}
    </main>;
}

function WorkFrame({children}: {children: ReactNode}) {
    return <section className="mx-auto w-fit rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">{children}</section>;
}

function BlankWork() {
    return <div className="flex h-48 items-end justify-center pb-3 text-sm text-slate-400" data-role="blank-work">Show your work here.</div>;
}

function Answer({children, solution}: {children: ReactNode; solution: boolean}) {
    return <div className={`mt-4 rounded-xl border-2 px-5 py-3 text-center font-mono text-lg font-bold ${solution
        ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 bg-slate-50 text-slate-700'}`}>{children}</div>;
}

function Cell({children, width, green = false, small = false}: {children: ReactNode; width: number; green?: boolean; small?: boolean}) {
    return <div className={`relative flex shrink-0 items-center justify-center font-mono font-bold ${green ? GREEN : NEUTRAL}`}
        style={{width, height: small ? 28 : 42, fontSize: small ? 15 : width < 30 ? 20 : 28}}>{children}</div>;
}

const integerWidth = (value: ExactDecimalValue): number => value.numeral.includes('.') ? value.numeral.indexOf('.') : value.numeral.length;

export function DecimalStandardAddSubtractBody({data, isSolutionView}: {data: DecimalStandardAddSubtractProblem; isSolutionView: boolean}) {
    const scale = data.alignment.scale;
    const highestGiven = Math.max(integerWidth(data.top), integerWidth(data.bottom)) - 1;
    const highest = isSolutionView ? data.columns[data.columns.length - 1]!.placeExponent : highestGiven + 1;
    const places = Array.from({length: highest + scale + 1}, (_, index) => highest - index);
    const width = Math.min(44, Math.max(18, 720 / places.length));
    const columnByPlace = new Map(data.columns.map(column => [column.placeExponent, column]));
    const symbol = data.operation === 'addition' ? '+' : '−';

    function Row({label, role, cell, point, pointGreen = false}: {label: string; role: string; cell: (place: number) => ReactNode; point: ReactNode; pointGreen?: boolean}) {
        return <div className="flex items-center" data-role={role}>
            <div className="w-28 shrink-0 pr-3 text-right text-xs text-slate-600">{label}</div>
            {places.map(place => <div key={place} className="flex items-center">
                {cell(place)}
                {place === 0 && scale > 0 && <Cell width={14} green={pointGreen}>{point}</Cell>}
            </div>)}
        </div>;
    }

    function Operand({value, top}: {value: ExactDecimalValue; top: boolean}) {
        return <Row label={top ? '' : symbol} role={top ? 'aligned-top' : 'aligned-bottom'} point={value.scale > 0 || isSolutionView ? '.' : null}
            pointGreen={isSolutionView && value.scale === 0} cell={place => {
            const original = decimalDigitAt(value, place);
            const column = columnByPlace.get(place);
            const appended = isSolutionView && place < -value.scale;
            const changed = isSolutionView && top && data.operation === 'subtraction' && column
                && (column.regroupIn !== 0 || column.regroupOut !== 0);
            return <Cell width={width} green={appended}>
                <span className={changed ? 'line-through decoration-slate-400' : ''}>{original === null ? appended ? 0 : null : original}</span>
            </Cell>;
        }} />;
    }

    return <Card title={`Standard decimal ${data.operation}`} expression={<>{data.top.numeral} {symbol} {data.bottom.numeral}</>}>
        <p className="mb-4 text-sm text-slate-600">Align the decimal points. Calculate from right to left and record regrouping.</p>
        <WorkFrame>
            {isSolutionView && <Row label={data.operation === 'addition' ? 'Carries' : 'Regrouped top'} role="regrouping" point={null} cell={place => {
                const column = columnByPlace.get(place)!;
                const value = data.operation === 'addition' ? column.regroupIn > 0 ? column.regroupIn : null
                    : column.regroupIn !== 0 || column.regroupOut !== 0 ? column.workingValue : null;
                return <Cell width={width} green={true} small={true}>{value}</Cell>;
            }} />}
            <Operand value={data.top} top={true} />
            <Operand value={data.bottom} top={false} />
            <div className="ml-28 border-t-2 border-slate-700" />
            {isSolutionView ? <Row label="Result" role="decimal-result" point="." pointGreen={true} cell={place =>
                <Cell width={width} green={true}>{place < integerWidth(data.result) ? columnByPlace.get(place)!.resultDigit : null}</Cell>} /> : <BlankWork />}
        </WorkFrame>
        <Answer solution={isSolutionView}><span className={NEUTRAL}>{data.top.numeral} {symbol} {data.bottom.numeral}</span> = {isSolutionView ? data.result.numeral : '________'}</Answer>
    </Card>;
}

export function DecimalStandardMultiplicationBody({data, isSolutionView}: {data: DecimalStandardMultiplicationProblem; isSolutionView: boolean}) {
    const columns = Math.max(data.multiplicandDigits.length + data.multiplierDigits.length, String(data.unscaledProduct).length);
    const width = Math.min(42, Math.max(20, 700 / columns));
    const places = Array.from({length: columns}, (_, column) => columns - 1 - column);
    function Row({label, values, small = false, role}: {label: string; values: readonly (number | null)[]; small?: boolean; role: string}) {
        return <div className="flex items-center" data-role={role}>
            <div className="w-32 shrink-0 pr-3 text-right text-xs text-emerald-800">{label}</div>
            {values.map((value, index) => <Cell key={index} width={width} green={true} small={small}>{value}</Cell>)}
        </div>;
    }
    return <Card title="Standard decimal multiplication" expression={<>{data.multiplicand.numeral} × {data.multiplier.numeral}</>}>
        <p className="mb-4 text-sm text-slate-600">Multiply the coefficient digits, then place the decimal point using both factors’ decimal places.</p>
        {isSolutionView ? <>
            <WorkFrame>
                <Row label="Coefficient" role="coefficient-top" values={alignedIntegerDigits(data.multiplicand.coefficient, columns - 1, columns)} />
                <Row label="× coefficient" role="coefficient-bottom" values={alignedIntegerDigits(data.multiplier.coefficient, columns - 1, columns)} />
                <div className="ml-32 border-t-2 border-emerald-700" />
                {data.partialRows.map((row, index) => <div key={index} data-role="multiplication-pass" data-shift={row.shiftPlaces}>
                    <Row label={`Carries for ×${row.multiplierDigit}`} role="multiplication-carries" small={true} values={places.map(place => {
                        const localPlace = place - row.shiftPlaces;
                        const carry = localPlace === data.multiplicandDigits.length ? row.leadingCarry
                            : localPlace > 0 && localPlace < row.columns.length ? row.columns[localPlace]!.carryIn : 0;
                        return carry > 0 ? carry : null;
                    })} />
                    <Row label={`${index > 0 ? '+ ' : ''}×${row.multiplierDigit}; shift ${row.shiftPlaces}`} role="partial-product" values={decimalPartialDigits(data, index, columns)} />
                </div>)}
                <div className="ml-32 border-t-2 border-emerald-700" />
                <Row label="Sum carries" role="sum-carries" small={true} values={places.map(place =>
                    place < data.sumColumns.length && data.sumColumns[place]!.carryIn > 0 ? data.sumColumns[place]!.carryIn : null)} />
                <Row label="Unscaled product" role="unscaled-product" values={alignedIntegerDigits(data.unscaledProduct, columns - 1, columns)} />
            </WorkFrame>
            <Answer solution={true}>
                <div>{data.multiplicand.scale} + {data.multiplier.scale} = {data.decimalPlacement.totalScale} decimal places</div>
                <div className="mt-2 flex flex-wrap items-center justify-center" data-role="decimal-placement">
                    {data.decimalPlacement.paddedDigits.map((value, index) => <span key={index}>
                        {index === data.decimalPlacement.decimalIndex && data.decimalPlacement.totalScale > 0 && <span data-role="placed-decimal-point">.</span>}{value}
                    </span>)}
                </div>
            </Answer>
        </> : <WorkFrame>
            <div className="text-right font-mono text-2xl font-bold text-slate-900" data-role="original-factors">
                <div>{data.multiplicand.numeral}</div><div>× {data.multiplier.numeral}</div><div className="mt-2 border-t-2 border-slate-700" />
            </div>
            <div style={{minWidth: 400}}><BlankWork /></div>
        </WorkFrame>}
        <Answer solution={isSolutionView}><span className={NEUTRAL}>{data.multiplicand.numeral} × {data.multiplier.numeral}</span> = {isSolutionView ? data.product.numeral : '________'}</Answer>
    </Card>;
}

function DecimalDivisionQuestion({data}: {data: DecimalStandardDivisionProblem}) {
    return <WorkFrame>
        <div className="h-9" />
        <div className="flex items-center font-mono text-2xl font-bold text-slate-900" data-role="original-division">
            <div className="pr-3">{data.divisor.numeral}</div>
            <div className="rounded-tl-md border-l-2 border-t-2 border-slate-700 px-3 py-1">{data.dividend.numeral}</div>
        </div>
        <div className="mt-4 text-sm text-slate-600" data-role="blank-normalization">Equivalent division: __________ ÷ __________</div>
        <div style={{minWidth: 470}}><BlankWork /></div>
    </WorkFrame>;
}

function DecimalDivisionSolution({data}: {data: DecimalStandardDivisionProblem}) {
    const normalized = data.normalization;
    const extensions = data.steps.filter(step => step.source === 'extension-zero').map(step => step.broughtDownDigits[0]!);
    const source = [...data.sourceDigits, ...extensions];
    const columns = source.length;
    const pointWidth = 12;
    const hasPoint = normalized.dividend.scale > 0 || extensions.length > 0;
    const gutterWidth = Math.max(72, String(normalized.divisor).length * 13 + 18);
    const cellWidth = Math.min(40, Math.max(14, (700 - gutterWidth - pointWidth) / columns));
    const x = (column: number): number => column * cellWidth + (hasPoint && column >= data.decimalIndex ? pointWidth : 0);
    const areaWidth = columns * cellWidth + (hasPoint ? pointWidth : 0);

    function Cells({values, point = false, minusAt, bringAt, extension = false}: {
        values: readonly (number | null)[]; point?: boolean; minusAt?: number; bringAt?: number; extension?: boolean;
    }) {
        return <div className="relative flex items-center">
            {values.map((value, column) => <div key={column} className="flex items-center">
                <Cell width={cellWidth} green={true}>
                    {minusAt === column && <span className="absolute -left-2 text-lg">−</span>}
                    {bringAt === column && <span className="absolute -top-3 text-base leading-none">↓</span>}
                    <span className={extension && column >= data.sourceDigits.length ? 'border-b border-dashed border-emerald-600' : ''}>{value}</span>
                </Cell>
                {hasPoint && column + 1 === data.decimalIndex && <Cell width={pointWidth} green={true}>{point ? '.' : null}</Cell>}
            </div>)}
        </div>;
    }

    function WorkRow({value, end, note, role, minus = false, bring = false}: {
        value: number; end: number; note: ReactNode; role: string; minus?: boolean; bring?: boolean;
    }) {
        return <div className="flex items-center" data-role={role} data-end-column={end}>
            <div style={{width: gutterWidth}} className="shrink-0" />
            <Cells values={alignedIntegerDigits(value, end, columns)} minusAt={minus ? end + 1 - String(value).length : undefined}
                bringAt={bring ? end : undefined} />
            <div className="pl-4 text-xs text-emerald-800" style={{width: 150}}>{note}</div>
        </div>;
    }

    return <>
        <Answer solution={true}>
            <div data-role="normalization-dividend"><span className={NEUTRAL}>{data.dividend.numeral}</span> × {normalized.powerOfTen} = {normalized.dividend.numeral}</div>
            <div data-role="normalization-divisor"><span className={NEUTRAL}>{data.divisor.numeral}</span> × {normalized.powerOfTen} = {normalized.divisor}</div>
        </Answer>
        <div className="mt-4"><WorkFrame>
            <div className="flex items-center" data-role="decimal-quotient">
                <div style={{width: gutterWidth}} className="shrink-0" />
                <Cells values={source.map((_, column) => column >= data.quotientStartColumn ? data.quotientDigits[column - data.quotientStartColumn]! : null)} point={data.quotient.scale > 0} />
            </div>
            <div className="flex items-center" data-role="normalized-source">
                <div className="shrink-0 pr-3 text-right font-mono text-xl font-bold text-emerald-800" style={{width: gutterWidth}}>{normalized.divisor}</div>
                <div className="relative">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-tl-md border-l-2 border-t-2 border-emerald-700" />
                    <Cells values={source} point={hasPoint} extension={true} />
                </div>
            </div>
            {data.steps.map((step, index) => {
                const next = data.steps[index + 1];
                const start = step.endColumnIndex + 1 - String(step.partialDividend).length;
                const endX = x(step.endColumnIndex) + cellWidth;
                return <div key={step.endColumnIndex} data-role="decimal-division-step" data-source={step.source}>
                    <WorkRow value={step.product} end={step.endColumnIndex} minus={true} role="division-product" note={<>{normalized.divisor} × {step.quotientDigit}</>} />
                    <div style={{width: areaWidth + gutterWidth}}>
                        <div className="border-t-2 border-emerald-700" data-role="subtraction-rule" style={{marginLeft: gutterWidth + x(start), width: endX - x(start)}} />
                    </div>
                    {next ? <WorkRow value={next.partialDividend} end={next.endColumnIndex} bring={true} role="next-partial"
                        note={next.source === 'extension-zero' ? 'Append 0' : <>Bring down {next.broughtDownDigits[0]} (original)</>} />
                        : <WorkRow value={step.remainder} end={step.endColumnIndex} role="exact-remainder" note="Remainder" />}
                </div>;
            })}
        </WorkFrame></div>
    </>;
}

export function DecimalStandardDivisionBody({data, isSolutionView}: {data: DecimalStandardDivisionProblem; isSolutionView: boolean}) {
    return <Card title="Standard decimal division" expression={<>{data.dividend.numeral} ÷ {data.divisor.numeral}</>}>
        <p className="mb-4 text-sm text-slate-600">Make an equivalent division with a whole-number divisor. Continue long division to an exact decimal quotient.</p>
        {isSolutionView ? <DecimalDivisionSolution data={data} /> : <DecimalDivisionQuestion data={data} />}
        <Answer solution={isSolutionView}><span className={NEUTRAL}>{data.dividend.numeral} ÷ {data.divisor.numeral}</span> = {isSolutionView ? data.quotient.numeral : '________'}</Answer>
    </Card>;
}
