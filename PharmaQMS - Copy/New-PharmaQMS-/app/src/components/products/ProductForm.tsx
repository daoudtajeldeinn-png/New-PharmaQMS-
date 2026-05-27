import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import type {
  PharmaceuticalProduct,
  ProductCategory,
  DosageForm,
  StorageCondition,
  PharmacopeiaStandard,
} from '@/types';

interface ProductFormProps {
  product?: PharmaceuticalProduct;
  onSubmit: (product: Partial<PharmaceuticalProduct>) => void;
  onCancel: () => void;
}

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'API', label: 'Active Pharmaceutical Ingredient (API)' },
  { value: 'Finished_Product', label: 'Finished Product' },
  { value: 'Excipient', label: 'Excipient' },
  { value: 'Packaging_Material', label: 'Packaging Material' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Biological', label: 'Biological' },
  { value: 'Vaccine', label: 'Vaccine' },
  { value: 'Herbal', label: 'Herbal Product' },
  { value: 'Radiopharmaceutical', label: 'Radiopharmaceutical' },
];

const dosageForms: { value: DosageForm; label: string }[] = [
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Capsule', label: 'Capsule' },
  { value: 'Injection', label: 'Injection' },
  { value: 'Syrup', label: 'Syrup' },
  { value: 'Suspension', label: 'Suspension' },
  { value: 'Cream', label: 'Cream' },
  { value: 'Ointment', label: 'Ointment' },
  { value: 'Gel', label: 'Gel' },
  { value: 'Powder', label: 'Powder' },
  { value: 'Solution', label: 'Solution' },
  { value: 'Inhaler', label: 'Inhaler' },
  { value: 'Patch', label: 'Patch' },
  { value: 'Suppository', label: 'Suppository' },
  { value: 'Drops', label: 'Drops' },
];

const storageConditions: { value: StorageCondition; label: string }[] = [
  { value: 'Room_Temperature', label: 'Room Temperature (15-25°C)' },
  { value: 'Refrigerated_2_8', label: 'Refrigerated (2-8°C)' },
  { value: 'Frozen_-20', label: 'Frozen (-20°C)' },
  { value: 'Frozen_-80', label: 'Deep Frozen (-80°C)' },
  { value: 'Protect_From_Light', label: 'Protect From Light' },
  { value: 'Protect_From_Moisture', label: 'Protect From Moisture' },
  { value: 'Controlled_Room_Temperature', label: 'Controlled Room Temperature' },
];

const pharmacopeias: { value: PharmacopeiaStandard; label: string }[] = [
  { value: 'USP', label: 'USP (United States)' },
  { value: 'BP', label: 'BP (British)' },
  { value: 'EP', label: 'EP (European)' },
  { value: 'JP', label: 'JP (Japanese)' },
  { value: 'IP', label: 'IP (Indian)' },
  { value: 'PhInt', label: 'PhInt (International)' },
  { value: 'Company_Specification', label: 'Company Specification' },
];

// Helper: check if a value is a known option in a list
function isKnownValue<T extends string>(value: T | undefined, list: { value: T }[]): boolean {
  if (!value) return true;
  return list.some((item) => item.value === value);
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<PharmaceuticalProduct>>(
    product || {
      category: 'Finished_Product',
      dosageForm: 'Tablet',
      storageConditions: 'Room_Temperature',
      pharmacopeiaStandard: 'USP',
      status: 'Quarantine',
      quantity: 0,
    }
  );

  // Track which fields are in "custom" mode
  const [customCategory, setCustomCategory] = useState(
    product?.category && !isKnownValue(product.category, categories) ? product.category : ''
  );
  const [showCustomCategory, setShowCustomCategory] = useState(
    !!product?.category && !isKnownValue(product.category, categories)
  );

  const [customDosageForm, setCustomDosageForm] = useState(
    product?.dosageForm && !isKnownValue(product.dosageForm, dosageForms) ? product.dosageForm : ''
  );
  const [showCustomDosageForm, setShowCustomDosageForm] = useState(
    !!product?.dosageForm && !isKnownValue(product.dosageForm, dosageForms)
  );

  const [customStorage, setCustomStorage] = useState(
    product?.storageConditions && !isKnownValue(product.storageConditions, storageConditions)
      ? product.storageConditions
      : ''
  );
  const [showCustomStorage, setShowCustomStorage] = useState(
    !!product?.storageConditions &&
    !isKnownValue(product.storageConditions, storageConditions)
  );

  const [customPharmacopeia, setCustomPharmacopeia] = useState(
    product?.pharmacopeiaStandard &&
      !isKnownValue(product.pharmacopeiaStandard, pharmacopeias)
      ? product.pharmacopeiaStandard
      : ''
  );
  const [showCustomPharmacopeia, setShowCustomPharmacopeia] = useState(
    !!product?.pharmacopeiaStandard &&
    !isKnownValue(product.pharmacopeiaStandard, pharmacopeias)
  );

  const [customFields, setCustomFields] = useState<
    { key: string; value: string }[]
  >([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Merge custom values
    const finalData = { ...formData };
    if (showCustomCategory && customCategory) {
      finalData.category = customCategory as ProductCategory;
    }
    if (showCustomDosageForm && customDosageForm) {
      finalData.dosageForm = customDosageForm as DosageForm;
    }
    if (showCustomStorage && customStorage) {
      finalData.storageConditions = customStorage as StorageCondition;
    }
    if (showCustomPharmacopeia && customPharmacopeia) {
      finalData.pharmacopeiaStandard = customPharmacopeia as PharmacopeiaStandard;
    }

    onSubmit({
      ...finalData,
      id: product?.id || crypto.randomUUID(),
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, key: string, value: string) => {
    const updated = [...customFields];
    updated[index] = { key, value };
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genericName">Generic Name *</Label>
            <Input
              id="genericName"
              value={formData.genericName || ''}
              onChange={(e) =>
                setFormData({ ...formData, genericName: e.target.value })
              }
              placeholder="Enter generic / scientific name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={formData.brandName || ''}
              onChange={(e) =>
                setFormData({ ...formData, brandName: e.target.value })
              }
              placeholder="Enter brand name (if applicable)"
            />
          </div>

          {/* Category — with custom option */}
          <div className="space-y-2">
            <Label htmlFor="category">Product Category *</Label>
            {!showCustomCategory ? (
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setShowCustomCategory(true);
                    setCustomCategory('');
                  } else {
                    setFormData({ ...formData, category: value as ProductCategory });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-indigo-600 font-semibold border-t mt-1 pt-1">
                    ➕ Other (Custom)...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type custom category..."
                  className="flex-1 border-indigo-300 focus:border-indigo-500"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setCustomCategory('');
                    setFormData({ ...formData, category: 'Finished_Product' });
                  }}
                  title="Back to list"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Dosage Form — with custom option */}
          <div className="space-y-2">
            <Label htmlFor="dosageForm">Dosage Form *</Label>
            {!showCustomDosageForm ? (
              <Select
                value={formData.dosageForm}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setShowCustomDosageForm(true);
                    setCustomDosageForm('');
                  } else {
                    setFormData({ ...formData, dosageForm: value as DosageForm });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dosage form" />
                </SelectTrigger>
                <SelectContent>
                  {dosageForms.map((form) => (
                    <SelectItem key={form.value} value={form.value}>
                      {form.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-indigo-600 font-semibold border-t mt-1 pt-1">
                    ➕ Other (Custom)...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customDosageForm}
                  onChange={(e) => setCustomDosageForm(e.target.value)}
                  placeholder="Type custom dosage form..."
                  className="flex-1 border-indigo-300 focus:border-indigo-500"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCustomDosageForm(false);
                    setCustomDosageForm('');
                    setFormData({ ...formData, dosageForm: 'Tablet' });
                  }}
                  title="Back to list"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="strength">Strength / Concentration *</Label>
            <Input
              id="strength"
              value={formData.strength || ''}
              onChange={(e) =>
                setFormData({ ...formData, strength: e.target.value })
              }
              placeholder="e.g. 500mg, 10mg/mL"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manufacturing & Supply Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer *</Label>
            <Input
              id="manufacturer"
              value={formData.manufacturer || ''}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
              placeholder="Enter manufacturer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier || ''}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch / Lot Number *</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber || ''}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              placeholder="Enter batch number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input
              id="registrationNumber"
              value={formData.registrationNumber || ''}
              onChange={(e) =>
                setFormData({ ...formData, registrationNumber: e.target.value })
              }
              placeholder="Product registration number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturingDate">Manufacturing Date *</Label>
            <Input
              id="manufacturingDate"
              type="date"
              value={
                formData.manufacturingDate
                  ? new Date(formData.manufacturingDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  manufacturingDate: new Date(e.target.value),
                })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={
                formData.expiryDate
                  ? new Date(formData.expiryDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: new Date(e.target.value) })
              }
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage, Quantity & Standards</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit of Measurement *</Label>
            <Input
              id="unit"
              value={formData.unit || ''}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g. Tablets, Capsules, kg"
              required
            />
          </div>

          {/* Storage Conditions — with custom option */}
          <div className="space-y-2">
            <Label htmlFor="storageConditions">Storage Conditions *</Label>
            {!showCustomStorage ? (
              <Select
                value={formData.storageConditions}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setShowCustomStorage(true);
                    setCustomStorage('');
                  } else {
                    setFormData({ ...formData, storageConditions: value as StorageCondition });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select storage conditions" />
                </SelectTrigger>
                <SelectContent>
                  {storageConditions.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-indigo-600 font-semibold border-t mt-1 pt-1">
                    ➕ Other (Custom)...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customStorage}
                  onChange={(e) => setCustomStorage(e.target.value)}
                  placeholder="Type custom storage conditions..."
                  className="flex-1 border-indigo-300 focus:border-indigo-500"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCustomStorage(false);
                    setCustomStorage('');
                    setFormData({ ...formData, storageConditions: 'Room_Temperature' });
                  }}
                  title="Back to list"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Pharmacopeia Standard — with custom option */}
          <div className="space-y-2">
            <Label htmlFor="pharmacopeiaStandard">Pharmacopeial Standard *</Label>
            {!showCustomPharmacopeia ? (
              <Select
                value={formData.pharmacopeiaStandard}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setShowCustomPharmacopeia(true);
                    setCustomPharmacopeia('');
                  } else {
                    setFormData({ ...formData, pharmacopeiaStandard: value as PharmacopeiaStandard });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pharmacopeial standard" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacopeias.map((ph) => (
                    <SelectItem key={ph.value} value={ph.value}>
                      {ph.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-indigo-600 font-semibold border-t mt-1 pt-1">
                    ➕ Other (Custom)...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={customPharmacopeia}
                  onChange={(e) => setCustomPharmacopeia(e.target.value)}
                  placeholder="Type custom standard..."
                  className="flex-1 border-indigo-300 focus:border-indigo-500"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCustomPharmacopeia(false);
                    setCustomPharmacopeia('');
                    setFormData({ ...formData, pharmacopeiaStandard: 'USP' });
                  }}
                  title="Back to list"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Product Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Quarantine">Quarantine</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Released">Released</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Under_Test">Under Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Custom Fields</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No custom fields. Click "Add Field" to include additional information.
            </p>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    placeholder="Field name"
                    value={field.key}
                    onChange={(e) =>
                      updateCustomField(index, e.target.value, field.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) =>
                      updateCustomField(index, field.key, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes about the product..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {product ? 'Update Product' : 'Add New Product'}
        </Button>
      </div>
    </form>
  );
}
