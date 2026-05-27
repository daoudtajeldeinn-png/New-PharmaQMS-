import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { useDelete } from '@/hooks/useDelete';
import { useSecurity } from '@/components/security/SecurityProvider';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from '@/components/security/DeleteConfirmationDialog';
import { Plus, Pill, ShieldAlert } from 'lucide-react';
import type { PharmaceuticalProduct } from '@/types';

export function Products() {
  const { state, dispatch } = useStore();
  const { user } = useSecurity();
  const { canDelete, handleDelete, isDeleting } = useDelete();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PharmaceuticalProduct | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: PharmaceuticalProduct) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: PharmaceuticalProduct) => {
    if (!canDelete) {
      return; // Button is hidden for non-admins, but guard anyway
    }
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async (reason: string) => {
    if (!selectedProduct) return;
    const success = await handleDelete(
      'products',
      selectedProduct.id,
      selectedProduct.name,
      () => {
        dispatch({ type: 'DELETE_PRODUCT', payload: selectedProduct.id });
        dispatch({
          type: 'ADD_ACTIVITY',
          payload: {
            id: crypto.randomUUID(),
            type: 'Product_Updated',
            description: `[DELETE] Product: "${selectedProduct.name}" by ${user?.username}. Reason: ${reason}`,
            user: user?.name || 'Unknown',
            timestamp: new Date(),
          },
        });
      },
      reason
    );
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleView = (product: PharmaceuticalProduct) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleTest = (product: PharmaceuticalProduct) => {
    window.location.hash = '#testing/results?productId=' + product.id;
  };

  const handleSubmit = (product: Partial<PharmaceuticalProduct>) => {
    if (selectedProduct) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: product as PharmaceuticalProduct,
      });
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: crypto.randomUUID(),
          type: 'Product_Updated',
          description: `Updated product: ${product.name}`,
          user: 'System',
          timestamp: new Date(),
        },
      });
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        payload: product as PharmaceuticalProduct,
      });
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: crypto.randomUUID(),
          type: 'Product_Created',
          description: `Created new product: ${product.name}`,
          user: 'System',
          timestamp: new Date(),
        },
      });
    }
    setIsFormOpen(false);
    dispatch({ type: 'UPDATE_DASHBOARD_STATS' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmaceutical Product Repository</h1>
          <p className="text-slate-500">Managing Manufacturing Inventory &amp; Raw Material Database</p>
        </div>
        <div className="flex items-center gap-3">
          {!canDelete && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <ShieldAlert className="h-3.5 w-3.5" />
              Read-only — deletions require Admin or QA Admin
            </div>
          )}
          <Button onClick={handleAdd} className="bg-indigo-600">
            <Plus className="mr-2 h-4 w-4" />
            Register New Product
          </Button>
        </div>
      </div>

      <ProductTable
        products={state.products}
        onEdit={handleEdit}
        onDelete={canDelete ? handleDeleteClick : undefined}
        onView={handleView}
        onTest={handleTest}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">
              {selectedProduct ? 'Edit Pharmaceutical Record' : 'Register New Inventory Item'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">Product Specification Dossier</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Pill className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-slate-500">{selectedProduct.genericName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Classification Category:</span>
                  <p className="font-medium">{selectedProduct.category}</p>
                </div>
                <div>
                  <span className="text-slate-500">Dosage Form:</span>
                  <p className="font-medium">{selectedProduct.dosageForm}</p>
                </div>
                <div>
                  <span className="text-slate-500">Strength / Potency:</span>
                  <p className="font-medium">{selectedProduct.strength}</p>
                </div>
                <div>
                  <span className="text-slate-500">Original Manufacturer:</span>
                  <p className="font-medium">{selectedProduct.manufacturer}</p>
                </div>
                <div>
                  <span className="text-slate-500">Batch Control Number:</span>
                  <p className="font-medium">{selectedProduct.batchNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Inventory Quantity:</span>
                  <p className="font-medium">
                    {selectedProduct.quantity} {selectedProduct.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Expiry Date:</span>
                  <p className="font-medium">
                    {new Date(selectedProduct.expiryDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Pharmacopeial Standard:</span>
                  <p className="font-medium">{selectedProduct.pharmacopeiaStandard}</p>
                </div>
              </div>

              {selectedProduct.notes && (
                <div>
                  <span className="text-slate-500 font-bold underline">Additional Compliance Notes:</span>
                  <p className="mt-1 text-sm text-slate-600 italic p-3 bg-slate-50 rounded border">{selectedProduct.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          recordLabel={selectedProduct.name}
          tableName="products"
        />
      )}
    </div>
  );
}
