import type { AppState } from "../hooks/storeReducer";

export interface ValidationIssue {
    id: string;
    type: 'Critical' | 'Major' | 'Minor' | 'Suggestion';
    module: string;
    description: string;
    targetId: string;
    autoFixable: boolean;
}

export const ValidationSuite = {
    validateState: (state: AppState): ValidationIssue[] => {
        const issues: ValidationIssue[] = [];

        // 1. Dependency Checks
        state.coaRecords?.forEach(coa => {
            const hasProduct = state.products.some(p => p.name === coa.productName);
            if (!hasProduct) {
                issues.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Major',
                    module: 'COA',
                    description: `COA ${coa.coaNumber} references unknown product: ${coa.productName}`,
                    targetId: coa.id,
                    autoFixable: false
                });
            }
        });

        // 2. GMP Compliance Checks (BMR)
        state.batchRecords?.forEach(batch => {
            if (batch.status === 'Released' && (!batch.actualYield || batch.actualYield === 0)) {
                issues.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Critical',
                    module: 'BMR',
                    description: `Released batch ${batch.batchNumber} has no yield reconciliation!`,
                    targetId: batch.id,
                    autoFixable: false
                });
            }

            const unexecutedSteps = batch.stepExecutions.filter(s => s.status !== 'Completed' && s.status !== 'Skipped');
            if (batch.status === 'Quarantine' && unexecutedSteps.length > 0) {
                issues.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Major',
                    module: 'BMR',
                    description: `Batch ${batch.batchNumber} moved to Quarantine with ${unexecutedSteps.length} incomplete steps.`,
                    targetId: batch.id,
                    autoFixable: false
                });
            }
        });

        // 3. Data Integrity (Inventory)
        state.products?.forEach(p => {
            if (new Date(p.expiryDate) < new Date() && p.status !== 'Expired') {
                issues.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Major',
                    module: 'Inventory',
                    description: `Product ${p.name} (Batch ${p.batchNumber}) is expired but status is ${p.status}`,
                    targetId: p.id,
                    autoFixable: true
                });
            }
        });

        // 4. Lab Compliance
        state.rawMaterials?.forEach(m => {
            if (m.status === 'Under_Test' && (!m.tests || m.tests.length === 0)) {
                issues.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'Major',
                    module: 'Laboratory',
                    description: `Material ${m.name} is 'Under Test' but has no test parameters assigned.`,
                    targetId: m.id,
                    autoFixable: false
                });
            }
        });

        return issues;
    },

    autoFix: (issue: ValidationIssue, state: AppState, dispatch: any): boolean => {
        if (!issue.autoFixable) return false;

        if (issue.module === 'Inventory' && issue.description.includes('expired')) {
            const product = state.products.find(p => p.id === issue.targetId);
            if (product) {
                dispatch({
                    type: 'UPDATE_PRODUCT',
                    payload: { ...product, status: 'Expired' }
                });
                return true;
            }
        }
        return false;
    }
};
