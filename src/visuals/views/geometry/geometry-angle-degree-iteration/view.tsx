import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AngleDegreeIterationView} from '../angle-concepts-view.tsx';
import {
    GeometryAngleDegreeIterationViewConfig,
    GeometryAngleDegreeIterationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'geometry-angle-degree-iteration';

interface CoreProps {
    config: GeometryAngleDegreeIterationViewConfig;
    payload: ViewRenderPayload<'geometry-angle-degree-iteration'>;
}

const GeometryAngleDegreeIterationCore = ({payload}: CoreProps) => (
    <AngleDegreeIterationView
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const GeometryAngleDegreeIteration = withConfig(
    GeometryAngleDegreeIterationViewSchema,
    GeometryAngleDegreeIterationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-angle-degree-iteration'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryAngleDegreeIteration payload={payload} />);
    }
};
