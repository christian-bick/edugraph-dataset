import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionArithmeticView} from '../fraction-arithmetic-view.tsx';
import {
    FractionsOperationModelViewConfig,
    FractionsOperationModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-operation-model';

interface CoreProps {
    config: FractionsOperationModelViewConfig;
    payload: ViewRenderPayload<'fractions-operation-model'>;
}

const FractionsOperationModelCore = ({payload}: CoreProps) => (
    <FractionArithmeticView
        layout="model"
        payload={payload}
        presentation="execution-model"
        viewId={VIEW_ID}
    />
);

export const FractionsOperationModel = withConfig(
    FractionsOperationModelViewSchema,
    FractionsOperationModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-operation-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsOperationModel payload={payload} />);
    }
};
