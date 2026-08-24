import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {UnitSquareGridProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    SquareGridDiagram,
    UnitSquareDiagram
} from './shape-square-array-components.tsx';
import {
    buildUnitSquareInversionPresentation,
    getAreaTilePrompt,
    getSquareAreaUnit,
    getUnitSquareStoryPrompt,
    isValidUnitSquareGridProblem
} from './shape-square-array-helpers.ts';

type UnitSquareGridTask = 'interpretation' | 'execution' | 'understanding' | 'inversion';

export const UnitSquareGridView = ({
    payload,
    task,
    useStory,
    viewId
}: {
    payload: RenderPayload<AbstractProblem<UnitSquareGridProblem>>;
    task: UnitSquareGridTask;
    useStory: boolean;
    viewId: string;
}) => {
    const {problem, isSolutionView} = payload;
    validateProblemData(viewId, problem.data, ['kind', 'rows', 'columns', 'tileCount', 'unitId']);
    if (!isValidUnitSquareGridProblem(problem.data)) {
        throw new ViewValidationError(
            viewId,
            'The unit-square grid must have consistent dimensions, tile count, and area unit.'
        );
    }

    const data = problem.data;
    const isSingleUnit = data.tileCount === 1;
    const units = getSquareAreaUnit(data.unitId);
    if (task === 'inversion') {
        const presentation = buildUnitSquareInversionPresentation(data, payload.seed);
        return (
            <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <div className="text-center text-[1.25rem] font-bold leading-snug text-slate-700">{presentation.prompt}</div>
                <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                    <SquareGridDiagram
                        geometry={{rows: data.rows, columns: data.columns, cellCount: data.tileCount}}
                        showCells
                        showCount={false}
                        showSideLengths
                        hiddenDimension={isSolutionView ? undefined : presentation.unknownDimension}
                    />
                </div>
                <div className="mt-4 grid grid-cols-[245px_1fr] gap-3">
                    <div className="flex items-center justify-center rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-3 font-mono text-[0.95rem] font-extrabold text-violet-800">Area = length × width</div>
                    <div className="flex min-h-[54px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-slate-700">
                        {isSolutionView
                            ? presentation.questionEquation.replace('?', String(presentation.missingValue))
                            : presentation.questionEquation}
                    </div>
                </div>
                {!isSolutionView && <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-blue-800">Inverse step: {presentation.inverseEquation}</div>}
                {isSolutionView && (
                    <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                        <div className="font-mono text-[1.08rem] font-extrabold">{presentation.solutionEquation}</div>
                        <div className="mt-1 text-[1.05rem] font-extrabold">{presentation.answerStatement}</div>
                        <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{presentation.explanation}</div>
                    </div>
                )}
            </div>
        );
    }

    const isInterpretation = task === 'interpretation';
    const isUnderstanding = task === 'understanding';
    const prompt = useStory
        ? getUnitSquareStoryPrompt(data)
        : isInterpretation
            ? isSingleUnit
                ? 'This square tile has side length 1 unit. What area does it represent?'
                : `Count one row at a time, adding ${data.columns} unit squares for each row. What does the repeated count tell you about area?`
            : isUnderstanding
                ? 'Why does multiplying the side lengths give the area of this tiled rectangle?'
                : getAreaTilePrompt(data.unitId);
    const solution = isInterpretation
        ? isSingleUnit
            ? '1 unit × 1 unit = 1 square unit'
            : `${data.tileCount} unit squares cover the figure, so its area is ${data.tileCount} square units.`
        : isUnderstanding
            ? `${data.rows} rows of ${data.columns} unit squares: ${data.rows} × ${data.columns} = ${data.tileCount} square units.`
            : `Area = ${data.tileCount} ${units.plural}`;

    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex min-h-[450px] w-[520px] flex-col items-center gap-4">
                <div className={`${!isSingleUnit || useStory ? 'min-h-[82px] text-[1.1rem] leading-tight' : 'h-[58px] text-[1.3rem] leading-snug'} flex items-center justify-center px-5 text-center font-bold text-slate-700`}>{prompt}</div>
                <div className="box-border flex h-[280px] w-[420px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                    {isSingleUnit && isInterpretation
                        ? <UnitSquareDiagram />
                        : <SquareGridDiagram
                            geometry={{rows: data.rows, columns: data.columns, cellCount: data.tileCount}}
                            showCells
                            showCount={!isUnderstanding && isSolutionView}
                            showCountingPath={task === 'execution' && !useStory}
                            showSideLengths={isUnderstanding}
                        />}
                </div>
                <div
                    className={`box-border flex h-[52px] min-w-[270px] items-center justify-center rounded-xl border-2 px-6 text-[1.18rem] font-bold ${isSolutionView
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : isInterpretation
                            ? 'border-slate-200 bg-slate-100 text-slate-600'
                            : 'border-slate-300 bg-white text-transparent'}`}
                    aria-label={isSolutionView ? solution : isInterpretation ? 'Interpret the unit-square evidence as area' : 'Blank area answer'}
                >
                    {isSolutionView ? solution : isInterpretation ? 'Interpret the square-tile evidence as area.' : '\u00a0'}
                </div>
            </div>
        </div>
    );
};
