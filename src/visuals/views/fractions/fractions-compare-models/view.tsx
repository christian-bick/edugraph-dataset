import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionComparisonView} from '../fraction-comparison-view.tsx';
import {
    FractionsCompareModelsViewConfig,
    FractionsCompareModelsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-compare-models';

interface CoreProps {
    config: FractionsCompareModelsViewConfig;
    payload: ViewRenderPayload<'fractions-compare-models'>;
}

const FractionsCompareModelsCore = ({payload}: CoreProps) => (
    <FractionComparisonView
        mode="logical-inference"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const FractionsCompareModels = withConfig(
    FractionsCompareModelsViewSchema,
    FractionsCompareModelsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-compare-models'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsCompareModels payload={payload} />);
    }
};
