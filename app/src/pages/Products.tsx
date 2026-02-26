import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pill } from 'lucide-react';
import type { PharmaceuticalProduct } from '@/types';

export function Products() {
  const { state, dispatch } = useStore();
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

  const handleDelete = (product: PharmaceuticalProduct) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      dispatch({ type: 'DELETE_PRODUCT', payload: selectedProduct.id });
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: crypto.randomUUID(),
          type: 'Product_Updated',
          description: `Deleted product: ${selectedProduct.name}`,
          user: 'System',
          timestamp: new Date(),
        },
      });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleView = (product: PharmaceuticalProduct) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleTest = (product: PharmaceuticalProduct) => {
    // Navigate to testing page with product pre-selected
    window.location.href = `/testing/results?productId=${product.id}`;
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
          <p className="text-slate-500">Managing Manufacturing Inventory & Raw Material Database</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Register New Product
        </Button>
      </div>

      <ProductTable
        products={state.products}
        onEdit={handleEdit}
        onDelete={handleDelete}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Confirm Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolute certain you want to delete product &quot;{selectedProduct?.name}&quot;?
              <br />
              This action strictly permanently removes the record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Discard</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
