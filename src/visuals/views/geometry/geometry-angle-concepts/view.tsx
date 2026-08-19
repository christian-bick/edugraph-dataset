import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AngleConceptsView} from '../angle-concepts-view.tsx';
import {
    GeometryAngleConceptsViewConfig,
    GeometryAngleConceptsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'geometry-angle-concepts';

interface CoreProps {
    config: GeometryAngleConceptsViewConfig;
    payload: ViewRenderPayload<'geometry-angle-concepts'>;
}

const GeometryAngleConceptsCore = ({payload}: CoreProps) => (
    <AngleConceptsView
        mode="interpretation"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const GeometryAngleConcepts = withConfig(
    GeometryAngleConceptsViewSchema,
    GeometryAngleConceptsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-angle-concepts'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryAngleConcepts payload={payload} />);
    }
};
