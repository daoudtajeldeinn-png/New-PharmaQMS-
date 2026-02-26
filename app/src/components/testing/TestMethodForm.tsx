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
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import type { TestMethod, TestCategory, TestParameter } from '@/types';

interface TestMethodFormProps {
  testMethod?: TestMethod;
  onSubmit: (testMethod: Partial<TestMethod>) => void;
  onCancel: () => void;
}

const testCategories: { value: TestCategory; label: string }[] = [
  { value: 'Identity', label: 'الهوية' },
  { value: 'Assay', label: 'النقاوة/القوة' },
  { value: 'Dissolution', label: 'الذوبان' },
  { value: 'Uniformity', label: 'تجانس الجرعات' },
  { value: 'Impurities', label: 'الشوائب' },
  { value: 'Microbial', label: 'ميكروبيولوجي' },
  { value: 'Physical', label: 'فيزيائي' },
  { value: 'Chemical', label: 'كيميائي' },
  { value: 'Biological', label: 'بيولوجي' },
  { value: 'Stability', label: 'الاستقرارية' },
  { value: 'Other', label: 'أخرى' },
];

export function TestMethodForm({ testMethod, onSubmit, onCancel }: TestMethodFormProps) {
  const [formData, setFormData] = useState<Partial<TestMethod>>(
    testMethod || {
      category: 'Assay',
      parameters: [],
      equipmentRequired: [],
      reagentsRequired: [],
      status: 'Active',
    }
  );

  const [parameters, setParameters] = useState<TestParameter[]>(
    testMethod?.parameters || []
  );
  const [equipment, setEquipment] = useState<string[]>(
    testMethod?.equipmentRequired || []
  );
  const [reagents, setReagents] = useState<string[]>(
    testMethod?.reagentsRequired || []
  );

  const [newEquipment, setNewEquipment] = useState('');
  const [newReagent, setNewReagent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parameters,
      equipmentRequired: equipment,
      reagentsRequired: reagents,
      id: testMethod?.id || crypto.randomUUID(),
      createdAt: testMethod?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  };

  const addParameter = () => {
    const newParam: TestParameter = {
      id: crypto.randomUUID(),
      name: '',
      isQualitative: false,
    };
    setParameters([...parameters, newParam]);
  };

  const updateParameter = (index: number, updates: Partial<TestParameter>) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], ...updates };
    setParameters(updated);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const addEquipment = () => {
    if (newEquipment.trim()) {
      setEquipment([...equipment, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const addReagent = () => {
    if (newReagent.trim()) {
      setReagents([...reagents, newReagent.trim()]);
      setNewReagent('');
    }
  };

  const removeReagent = (index: number) => {
    setReagents(reagents.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>المعلومات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">اسم طريقة الاختبار *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: Assay by HPLC"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">فئة الاختبار *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: TestCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {testCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="وصف مختصر لطريقة الاختبار..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pharmacopeiaReference">المرجع الدستوري</Label>
            <Input
              id="pharmacopeiaReference"
              value={formData.pharmacopeiaReference || ''}
              onChange={(e) =>
                setFormData({ ...formData, pharmacopeiaReference: e.target.value })
              }
              placeholder="مثال: USP <621>"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="standardProcedure">رقم الإجراء القياسي *</Label>
            <Input
              id="standardProcedure"
              value={formData.standardProcedure || ''}
              onChange={(e) =>
                setFormData({ ...formData, standardProcedure: e.target.value })
              }
              placeholder="مثال: HPLC-001-ASSAY"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'Active' | 'Inactive') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">نشط</SelectItem>
                <SelectItem value="Inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>معايير القبول</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addParameter}>
            <Plus className="mr-2 h-4 w-4" />
            إضافة معيار
          </Button>
        </CardHeader>
        <CardContent>
          {parameters.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              لا توجد معايير. انقر على "إضافة معيار" لإضافة معايير القبول.
            </p>
          ) : (
            <div className="space-y-4">
              {parameters.map((param, index) => (
                <div
                  key={param.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">المعيار {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>اسم المعيار *</Label>
                      <Input
                        value={param.name}
                        onChange={(e) =>
                          updateParameter(index, { name: e.target.value })
                        }
                        placeholder="مثال: Content"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>الوحدة</Label>
                      <Input
                        value={param.unit || ''}
                        onChange={(e) =>
                          updateParameter(index, { unit: e.target.value })
                        }
                        placeholder="مثال: %"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>القيمة الدنيا</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={param.minValue || ''}
                        onChange={(e) =>
                          updateParameter(index, {
                            minValue: parseFloat(e.target.value) || undefined,
                          })
                        }
                        placeholder="أدخل القيمة الدنيا"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>القيمة القصوى</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={param.maxValue || ''}
                        onChange={(e) =>
                          updateParameter(index, {
                            maxValue: parseFloat(e.target.value) || undefined,
                          })
                        }
                        placeholder="أدخل القيمة القصوى"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>القيمة الاسمية</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={param.nominalValue || ''}
                        onChange={(e) =>
                          updateParameter(index, {
                            nominalValue: parseFloat(e.target.value) || undefined,
                          })
                        }
                        placeholder="أدخل القيمة الاسمية"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>السماح</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={param.tolerance || ''}
                        onChange={(e) =>
                          updateParameter(index, {
                            tolerance: parseFloat(e.target.value) || undefined,
                          })
                        }
                        placeholder="أدخل قيمة السماح"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`qualitative-${index}`}
                      checked={param.isQualitative}
                      onChange={(e) =>
                        updateParameter(index, { isQualitative: e.target.checked })
                      }
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor={`qualitative-${index}`} className="text-sm">
                      معيار نوعي (Qualitative)
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المعدات المطلوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              placeholder="أدخل اسم المعدات"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
            />
            <Button type="button" onClick={addEquipment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipment.map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => removeEquipment(index)}
                  className="mr-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المواد الكيميائية المطلوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input
              value={newReagent}
              onChange={(e) => setNewReagent(e.target.value)}
              placeholder="أدخل اسم المادة الكيميائية"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReagent())}
            />
            <Button type="button" onClick={addReagent}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {reagents.map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {item}
                <button
                  type="button"
                  onClick={() => removeReagent(index)}
                  className="mr-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">
          {testMethod ? 'تحديث طريقة الاختبار' : 'إضافة طريقة اختبار'}
        </Button>
      </div>
    </form>
  );
}
