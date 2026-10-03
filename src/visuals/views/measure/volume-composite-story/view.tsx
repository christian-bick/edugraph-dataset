import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidCompositePrism} from '../volume-composite-prism-helpers.ts';
import {CompositePrismBody} from '../volume-composite-prism-view.tsx';
import {VolumeCompositeStoryViewConfig, VolumeCompositeStoryViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'volume-composite-story';
interface CoreProps {
    config: VolumeCompositeStoryViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const VolumeCompositeStoryCore = ({payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'unitId', 'parts', 'sharedFace', 'volumeSum']);
    if (!isValidCompositePrism(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected two exact joined prisms and an exact volume sum.');
    }
    return <CompositePrismBody data={data} isSolutionView={payload.isSolutionView} task="story" />;
};

export const VolumeCompositeStoryView = withConfig(
    VolumeCompositeStoryViewSchema, VolumeCompositeStoryCore
);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<VolumeCompositeStoryView payload={payload} />);
};
