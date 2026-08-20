import {createRoot} from 'react-dom/client';
import {Scope} from 'edugraph-ts';
import type {DistanceScaleLabel} from '../../../../lib/ontology.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureLengthEstimateViewConfig, MeasureLengthEstimateViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {config: MeasureLengthEstimateViewConfig; payload: ViewRenderPayload<'measure-length-estimate'>}

interface ReferenceProfile {
    name: string;
    estimates: readonly [number, number, number];
    sizeClass: string;
}

interface ScaleProfile {
    unit: string;
    unitPlural: string;
    references: Record<'small' | 'large', readonly [
        ReferenceProfile,
        ReferenceProfile,
        ReferenceProfile,
        ReferenceProfile
    ]>;
}

const compact = 'h-24 w-64 text-3xl';
const extended = 'h-32 w-80 text-4xl';
const SCALE_PROFILES: Record<DistanceScaleLabel, ScaleProfile> = {
    [Scope.CentimeterScale]: {
        unit: 'cm',
        unitPlural: 'centimeters',
        references: {
            small: [
                {name: 'Crayon', estimates: [8, 9, 10], sizeClass: compact},
                {name: 'Pencil', estimates: [15, 18, 20], sizeClass: compact},
                {name: 'Marker', estimates: [12, 14, 16], sizeClass: compact},
                {name: 'Eraser', estimates: [4, 5, 6], sizeClass: compact}
            ],
            large: [
                {name: 'Book', estimates: [20, 25, 30], sizeClass: extended},
                {name: 'Notebook', estimates: [24, 28, 32], sizeClass: extended},
                {name: 'Tablet', estimates: [22, 26, 30], sizeClass: extended},
                {name: 'Folder', estimates: [28, 32, 36], sizeClass: extended}
            ]
        }
    },
    [Scope.MeterScale]: {
        unit: 'm',
        unitPlural: 'meters',
        references: {
            small: [
                {name: 'Desk', estimates: [1, 1, 2], sizeClass: compact},
                {name: 'Table', estimates: [1, 2, 2], sizeClass: compact},
                {name: 'Sofa', estimates: [2, 2, 3], sizeClass: compact},
                {name: 'Bed', estimates: [2, 2, 3], sizeClass: compact}
            ],
            large: [
                {name: 'Door', estimates: [2, 2, 3], sizeClass: extended},
                {name: 'Room', estimates: [3, 4, 5], sizeClass: extended},
                {name: 'Hallway', estimates: [5, 8, 10], sizeClass: extended},
                {name: 'Wall', estimates: [3, 4, 6], sizeClass: extended}
            ]
        }
    },
    [Scope.InchScale]: {
        unit: 'in',
        unitPlural: 'inches',
        references: {
            small: [
                {name: 'Crayon', estimates: [3, 4, 5], sizeClass: compact},
                {name: 'Pencil', estimates: [6, 7, 8], sizeClass: compact},
                {name: 'Marker', estimates: [5, 6, 7], sizeClass: compact},
                {name: 'Eraser', estimates: [1, 2, 3], sizeClass: compact}
            ],
            large: [
                {name: 'Book', estimates: [8, 10, 12], sizeClass: extended},
                {name: 'Notebook', estimates: [9, 11, 13], sizeClass: extended},
                {name: 'Tablet', estimates: [8, 10, 12], sizeClass: extended},
                {name: 'Folder', estimates: [10, 12, 14], sizeClass: extended}
            ]
        }
    },
    [Scope.FootScale]: {
        unit: 'ft',
        unitPlural: 'feet',
        references: {
            small: [
                {name: 'Desk', estimates: [3, 4, 5], sizeClass: compact},
                {name: 'Table', estimates: [4, 5, 6], sizeClass: compact},
                {name: 'Sofa', estimates: [6, 7, 8], sizeClass: compact},
                {name: 'Bed', estimates: [6, 7, 8], sizeClass: compact}
            ],
            large: [
                {name: 'Door', estimates: [6, 7, 8], sizeClass: extended},
                {name: 'Room', estimates: [10, 12, 15], sizeClass: extended},
                {name: 'Hallway', estimates: [20, 25, 30], sizeClass: extended},
                {name: 'Wall', estimates: [10, 12, 18], sizeClass: extended}
            ]
        }
    },
    [Scope.SegmentScale]: {
        unit: 'segments',
        unitPlural: 'unit segments',
        references: {
            small: [
                {name: 'Short segment A', estimates: [2, 3, 4], sizeClass: compact},
                {name: 'Short segment B', estimates: [3, 4, 5], sizeClass: compact},
                {name: 'Short segment C', estimates: [2, 4, 6], sizeClass: compact},
                {name: 'Short segment D', estimates: [3, 5, 7], sizeClass: compact}
            ],
            large: [
                {name: 'Long segment A', estimates: [5, 6, 7], sizeClass: extended},
                {name: 'Long segment B', estimates: [6, 8, 10], sizeClass: extended},
                {name: 'Long segment C', estimates: [8, 10, 12], sizeClass: extended},
                {name: 'Long segment D', estimates: [10, 12, 15], sizeClass: extended}
            ]
        }
    }
};

const MeasureLengthEstimateCore = ({config, payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData('measure-length-estimate', data, ['referenceSize', 'referenceVariant', 'estimateVariant']);
    if (data.referenceSize !== 'small' && data.referenceSize !== 'large') {
        throw new ViewValidationError('measure-length-estimate', 'Expected a small or large reference size.');
    }
    if (!Number.isInteger(data.estimateVariant) || data.estimateVariant < 0 || data.estimateVariant > 2) {
        throw new ViewValidationError('measure-length-estimate', 'Expected an estimate variant from 0 through 2.');
    }
    if (!Number.isInteger(data.referenceVariant) || data.referenceVariant < 0 || data.referenceVariant > 3) {
        throw new ViewValidationError('measure-length-estimate', 'Expected a reference variant from 0 through 3.');
    }
    if (!config.scale) {
        throw new ViewValidationError('measure-length-estimate', 'Expected a concrete distance scale.');
    }

    const profile = SCALE_PROFILES[config.scale.label];
    const reference = profile.references[data.referenceSize][data.referenceVariant];
    const estimate = reference.estimates[data.estimateVariant];

    return (
        <div className="w-[620px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-xl font-bold text-slate-800">Estimate the length</div>
            <div className={`mx-auto mt-6 flex items-center justify-center rounded-xl bg-indigo-100 font-extrabold text-indigo-800 ${reference.sizeClass}`}>
                {reference.name}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-700">
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-3">
                    <span className="block font-extrabold text-sky-800">1. Choose a unit</span>
                    Use a familiar 1 {profile.unit} length.
                </div>
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-3">
                    <span className="block font-extrabold text-violet-800">2. Repeat it mentally</span>
                    Place copies end to end along the {reference.name.toLowerCase()}.
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <span className="block font-extrabold text-amber-800">3. Estimate</span>
                    Decide how many copies fit.
                </div>
            </div>
            <div className="mt-5 text-center text-lg font-semibold text-slate-700">About how many {profile.unitPlural} long?</div>
            <div className="mx-auto mt-4 flex h-16 w-44 items-center justify-center rounded-xl border-2 border-slate-700 font-mono text-2xl font-bold text-emerald-700">
                {payload.isSolutionView ? `${estimate} ${profile.unit}` : ''}
            </div>
        </div>
    );
};
export const MeasureLengthEstimate = withConfig(MeasureLengthEstimateViewSchema, MeasureLengthEstimateCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-length-estimate'>) => {const el=document.getElementById('view'); if(el){if(!root)root=createRoot(el);root.render(<MeasureLengthEstimate payload={payload}/>);}};
