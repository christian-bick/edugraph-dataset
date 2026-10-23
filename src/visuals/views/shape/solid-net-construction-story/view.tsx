import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {isPolyhedralNetProblem} from '../../../../generators/shape/polyhedral-net-helpers.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PolyhedralNetBody} from '../polyhedral-net-view.tsx';
import {SolidNetConstructionStoryViewSchema, type SolidNetConstructionStoryViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'solid-net-construction-story';
export const SolidNetConstructionStoryCore = ({payload}: {config: SolidNetConstructionStoryViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'solidKind', 'unit', 'context', 'solid', 'net', 'surfaceArea']);
    // The complete guard handles the valid empty surfaceAdditivity branch.
    if (!isPolyhedralNetProblem(data)) throw new ViewValidationError(VIEW_ID, 'The solid, congruent faces, connected net, fold closure or exact area evidence is inconsistent.');
    return <PolyhedralNetBody data={data} task="construction" story={true} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const SolidNetConstructionStory = withConfig(SolidNetConstructionStoryViewSchema, SolidNetConstructionStoryCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<SolidNetConstructionStory payload={payload} />);
};
