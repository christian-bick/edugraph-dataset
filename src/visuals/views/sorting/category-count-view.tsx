import {Fragment} from 'react';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {CountingClassifySortProblem} from '../../../types/problems.ts';
import {buildShapeClassificationPresentation, ClassificationItem, ClassificationShape} from './classification-presentation.ts';
import {
    categoryCountIsDescending,
    categoryGroupsInDirection,
    generateScatteredPositions,
    validateCategoryCountData
} from './category-count-helpers.ts';

const COLOR_MAP = {red: '#ef4444', blue: '#3b82f6', green: '#14b8a6'};

function ItemSVG({item, size}: {item: ClassificationItem; size: number}) {
    const style = {fill: COLOR_MAP[item.color], stroke: '#1e293b', strokeWidth: 2};
    return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        {item.shape === 'square'
            ? <rect x="4" y="4" width="32" height="32" rx="4" {...style} />
            : item.shape === 'triangle'
                ? <polygon points="20,4 36,36 4,36" {...style} />
                : <circle cx="20" cy="20" r="16" {...style} />}
    </svg>;
}

function ShapeIdentity({shape}: {shape: ClassificationShape}) {
    return <>
        <ItemSVG item={{shape, color: 'blue'}} size={32} />
        <span>{shape.charAt(0).toUpperCase() + shape.slice(1)}</span>
    </>;
}

interface CategoryCountViewProps {
    payload: RenderPayload<AbstractProblem<CountingClassifySortProblem>>;
    viewId: string;
    task: 'extremum' | 'order';
}

export function CategoryCountView({payload, viewId, task}: CategoryCountViewProps) {
    const {data} = payload.problem;
    validateCategoryCountData(viewId, data);
    const {isSolutionView, seed} = payload;
    const {items, mappedCategories} = buildShapeClassificationPresentation(data.categories, seed);
    const {positions, itemSize} = generateScatteredPositions(items.length, 450, 200, 32);
    const isDescending = categoryCountIsDescending(data.relation);
    const categoryIds = Object.keys(data.categories).sort();
    const selectedCategories = isDescending ? data.maximumCategories : data.minimumCategories;
    const groups = categoryGroupsInDirection(data);

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.15rem] font-bold text-slate-700 mb-5 text-center leading-relaxed">
                    {task === 'extremum' ? <>
                        <div>Which {selectedCategories.length > 1 ? 'shapes have' : 'shape has'} the {isDescending ? 'most' : 'fewest'} items?</div>
                        {selectedCategories.length > 1 && <div className="text-sm font-normal">Select each shape that ties.</div>}
                    </> : <>
                        <div>Count each shape category. Write the counts in digits.</div>
                        <div>Arrange all categories from {isDescending ? 'most to fewest' : 'fewest to most'}.</div>
                        <div className="text-sm font-normal">Place categories with equal counts together.</div>
                    </>}
                </div>

                <div className="relative w-[450px] h-[200px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden mb-[25px]">
                    {positions.map((position, index) => <div
                        key={index}
                        data-classification-item="true"
                        className="absolute flex justify-center items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                        style={{left: position.x, top: position.y, width: itemSize, height: itemSize}}
                    >
                        <ItemSVG item={items[index]!} size={itemSize} />
                    </div>)}
                </div>

                {task === 'extremum' ? <div className="w-full flex gap-3" data-response="extremum">
                    {categoryIds.map(category => {
                        const isSelected = isSolutionView && selectedCategories.includes(category);
                        return <div
                            key={category}
                            data-selected={isSelected ? 'true' : undefined}
                            className={`flex-1 py-3 px-2.5 border-2 rounded-lg flex flex-col items-center gap-2 font-semibold text-[0.95rem] ${isSelected
                                ? 'border-green-600 bg-green-50 text-green-700 font-bold'
                                : 'border-slate-200 bg-white text-slate-600'}`}
                        >
                            <ShapeIdentity shape={mappedCategories[category]!} />
                        </div>;
                    })}
                </div> : <div className="w-full flex flex-col items-center gap-2">
                    <div className="font-semibold text-slate-600">Shapes and counts in order</div>
                    <div className="flex items-center justify-center gap-2 w-full" data-response="order">
                        {isSolutionView ? groups.map((group, groupIndex) => <Fragment key={group.join('-')}>
                            {groupIndex > 0 && <span className="text-2xl font-bold text-slate-600">{isDescending ? '>' : '<'}</span>}
                            <div className="flex items-center gap-2" data-order-group="true">
                                {group.map((category, index) => <Fragment key={category}>
                                    {index > 0 && <span className="text-2xl font-bold text-slate-600">=</span>}
                                    <div className="w-[112px] py-3 border-2 rounded-lg border-green-600 bg-green-50 text-green-700 flex flex-col items-center gap-1 font-semibold" data-ordered-category={category}>
                                        <ShapeIdentity shape={mappedCategories[category]!} />
                                        <span className="text-xl font-mono" data-category-count="true">{data.categories[category]}</span>
                                    </div>
                                </Fragment>)}
                            </div>
                        </Fragment>) : categoryIds.map((category) => <div
                            key={category}
                            className="w-[128px] h-[116px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-3 text-sm text-slate-500"
                            aria-label="Blank shape and count"
                        >
                            <span>Shape: ______</span>
                            <span>Count: ______</span>
                        </div>)}
                    </div>
                </div>}
            </div>
        </div>
    );
}
