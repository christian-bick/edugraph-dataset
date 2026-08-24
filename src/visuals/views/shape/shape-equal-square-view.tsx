import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {EqualSquarePartitionProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {SquareGridDiagram} from './shape-square-array-components.tsx';
import {
    getEqualSquareStoryPrompt,
    isValidEqualSquarePartitionProblem
} from './shape-square-array-helpers.ts';

export const EqualSquareView = ({
    payload,
    task,
    useStory,
    viewId
}: {
    payload: RenderPayload<AbstractProblem<EqualSquarePartitionProblem>>;
    task: 'partition' | 'count';
    useStory: boolean;
    viewId: string;
}) => {
    const {problem, isSolutionView} = payload;
    validateProblemData(viewId, problem.data, ['kind', 'rows', 'columns', 'partCount']);
    if (!isValidEqualSquarePartitionProblem(problem.data)) {
        throw new ViewValidationError(
            viewId,
            'The equal-square partition must have consistent non-square dimensions and part count.'
        );
    }

    const isPartition = task === 'partition';
    const prompt = useStory
        ? getEqualSquareStoryPrompt(problem.data)
        : isPartition
            ? `Partition the rectangle into ${problem.data.rows} rows and ${problem.data.columns} columns of equal squares.`
            : 'How many equal squares are in the rectangle?';
    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex min-h-[450px] w-[520px] flex-col items-center gap-4">
                <div className={`${useStory ? 'min-h-[82px] text-[1.1rem] leading-tight' : 'h-[58px] text-[1.3rem] leading-snug'} flex items-center justify-center px-5 text-center font-bold text-slate-700`}>
                    {prompt}
                </div>
                <div className="box-border flex h-[280px] w-[420px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                    <SquareGridDiagram
                        geometry={{
                            rows: problem.data.rows,
                            columns: problem.data.columns,
                            cellCount: problem.data.partCount
                        }}
                        showCells={!isPartition || isSolutionView}
                        showCount={!isPartition && isSolutionView}
                        showSideLengths={false}
                    />
                </div>
                <div
                    className={`box-border flex h-[52px] min-w-[270px] items-center justify-center rounded-xl border-2 px-6 text-[1.18rem] font-bold ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : isPartition
                                ? 'border-slate-200 bg-slate-100 text-slate-600'
                                : 'border-slate-300 bg-white text-transparent'
                    }`}
                    aria-label={isSolutionView
                        ? isPartition
                            ? `Partition: ${problem.data.rows} rows of ${problem.data.columns} equal squares`
                            : `Answer: ${problem.data.partCount} equal squares`
                        : isPartition ? 'Draw the square grid' : 'Blank answer'}
                >
                    {isSolutionView
                        ? isPartition
                            ? `${problem.data.rows} rows of ${problem.data.columns} equal squares`
                            : `${problem.data.rows} × ${problem.data.columns} = ${problem.data.partCount} equal squares`
                        : isPartition ? 'Draw the square grid.' : '\u00a0'}
                </div>
            </div>
        </div>
    );
};
