import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type {
  TestResult,
  TestMethod,
  PharmaceuticalProduct,
  ParameterResult,
} from '@/types';
import { cn } from '@/lib/utils';

interface TestResultFormProps {
  products: PharmaceuticalProduct[];
  testMethods: TestMethod[];
  testResult?: TestResult;
  onSubmit: (testResult: Partial<TestResult>) => void;
  onCancel: () => void;
}

export function TestResultForm({
  products,
  testMethods,
  testResult,
  onSubmit,
  onCancel,
}: TestResultFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    testResult?.productId || ''
  );
  const [selectedTestMethodId, setSelectedTestMethodId] = useState<string>(
    testResult?.testMethodId || ''
  );
  const [parameterResults, setParameterResults] = useState<ParameterResult[]>(
    testResult?.parameters || []
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedTestMethod = testMethods.find((t) => t.id === selectedTestMethodId);

  const productOptions = useMemo(() =>
    products.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.batchNumber})`,
    })),
    [products]
  );

  const testMethodOptions = useMemo(() =>
    testMethods.map((m) => ({
      value: m.id,
      label: `${m.name} (${m.standardProcedure})`,
    })),
    [testMethods]
  );

  const [formData, setFormData] = useState<Partial<TestResult>>(
    testResult || {
      batchNumber: '',
      sampleId: '',
      analystId: '',
      testDate: new Date(),
      status: 'Scheduled',
    }
  );

  const handleTestMethodChange = (testMethodId: string) => {
    setSelectedTestMethodId(testMethodId);
    const testMethod = testMethods.find((t) => t.id === testMethodId);
    if (testMethod) {
      const newResults: ParameterResult[] = testMethod.parameters.map((param) => ({
        parameterId: param.id,
        parameterName: param.name,
        value: '',
        unit: param.unit,
        result: 'Pending',
      }));
      setParameterResults(newResults);
    }
  };

  const updateParameterResult = (index: number, value: string | number) => {
    const updated = [...parameterResults];
    const param = selectedTestMethod?.parameters[index];
    if (!param) return;

    let result: 'Pass' | 'Fail' | 'Pending' = 'Pending';

    if (param.isQualitative) {
      result = value === param.qualitativeOptions?.[0] ? 'Pass' : 'Fail';
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        if (param.minValue !== undefined && numValue < param.minValue) {
          result = 'Fail';
        } else if (param.maxValue !== undefined && numValue > param.maxValue) {
          result = 'Fail';
        } else if (param.minValue !== undefined || param.maxValue !== undefined) {
          result = 'Pass';
        }
      }
    }

    updated[index] = {
      ...updated[index],
      value,
      result,
    };
    setParameterResults(updated);
  };

  const getOverallResult = (): 'Pass' | 'Fail' | 'Pending' | 'OOS' => {
    if (parameterResults.length === 0) return 'Pending';
    if (parameterResults.some((p) => p.result === 'Fail')) return 'OOS';
    if (parameterResults.every((p) => p.result === 'Pass')) return 'Pass';
    return 'Pending';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overallResult = getOverallResult();
    onSubmit({
      ...formData,
      productId: selectedProductId,
      testMethodId: selectedTestMethodId,
      parameters: parameterResults,
      overallResult,
      id: testResult?.id || crypto.randomUUID(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات الاختبار</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product">المنتج *</Label>
            <Combobox
              options={productOptions}
              value={selectedProductId}
              onValueChange={setSelectedProductId}
              placeholder="اختر المنتج أو اكتب اسم جديد"
              searchPlaceholder="ابحث أو اكتب اسم المنتج..."
              emptyText="لا توجد نتائج"
              allowCustom={true}
              disabled={!!testResult}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testMethod">طريقة الاختبار *</Label>
            <Combobox
              options={testMethodOptions}
              value={selectedTestMethodId}
              onValueChange={handleTestMethodChange}
              placeholder="اختر طريقة الاختبار أو اكتب جديدة"
              searchPlaceholder="ابحث أو اكتب طريقة الاختبار..."
              emptyText="لا توجد نتائج"
              allowCustom={true}
              disabled={!!testResult}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNumber">رقم الدفعة *</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber || selectedProduct?.batchNumber || ''}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
              placeholder="أدخل رقم الدفعة"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sampleId">رقم العينة *</Label>
            <Input
              id="sampleId"
              value={formData.sampleId || ''}
              onChange={(e) =>
                setFormData({ ...formData, sampleId: e.target.value })
              }
              placeholder="أدخل رقم العينة"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analystId">رقم المحلل *</Label>
            <Input
              id="analystId"
              value={formData.analystId || ''}
              onChange={(e) =>
                setFormData({ ...formData, analystId: e.target.value })
              }
              placeholder="أدخل رقم/اسم المحلل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testDate">تاريخ الاختبار *</Label>
            <Input
              id="testDate"
              type="date"
              value={
                formData.testDate
                  ? new Date(formData.testDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({ ...formData, testDate: new Date(e.target.value) })
              }
              required
            />
          </div>
        </CardContent>
      </Card>

      {selectedTestMethod && parameterResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج المعايير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTestMethod.parameters.map((param, index) => {
                const result = parameterResults[index];
                return (
                  <div
                    key={param.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{param.name}</h4>
                        <p className="text-sm text-slate-500">
                          المعيار:{' '}
                          {param.minValue !== undefined &&
                            `من ${param.minValue}`}{' '}
                          {param.maxValue !== undefined &&
                            `إلى ${param.maxValue}`}{' '}
                          {param.unit}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          result?.result === 'Pass' &&
                          'bg-green-50 text-green-700 border-green-300',
                          result?.result === 'Fail' &&
                          'bg-red-50 text-red-700 border-red-300',
                          result?.result === 'Pending' &&
                          'bg-yellow-50 text-yellow-700 border-yellow-300'
                        )}
                      >
                        {result?.result === 'Pass' && (
                          <CheckCircle className="ml-1 h-3 w-3" />
                        )}
                        {result?.result === 'Fail' && (
                          <XCircle className="ml-1 h-3 w-3" />
                        )}
                        {result?.result === 'Pending' && (
                          <AlertTriangle className="ml-1 h-3 w-3" />
                        )}
                        {result?.result === 'Pass'
                          ? 'مطابق'
                          : result?.result === 'Fail'
                            ? 'غير مطابق'
                            : 'معلق'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        type={param.isQualitative ? 'text' : 'number'}
                        step="0.01"
                        value={result?.value || ''}
                        onChange={(e) =>
                          updateParameterResult(
                            index,
                            param.isQualitative
                              ? e.target.value
                              : parseFloat(e.target.value)
                          )
                        }
                        placeholder={
                          param.isQualitative
                            ? 'أدخل النتيجة النوعية'
                            : 'أدخل القيمة العددية'
                        }
                        className="flex-1"
                      />
                      {param.unit && (
                        <span className="text-sm text-slate-500 w-16">
                          {param.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">النتيجة الكلية:</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-lg px-4 py-2',
                    getOverallResult() === 'Pass' &&
                    'bg-green-50 text-green-700 border-green-300',
                    getOverallResult() === 'Fail' &&
                    'bg-red-50 text-red-700 border-red-300',
                    getOverallResult() === 'OOS' &&
                    'bg-red-50 text-red-700 border-red-300',
                    getOverallResult() === 'Pending' &&
                    'bg-yellow-50 text-yellow-700 border-yellow-300'
                  )}
                >
                  {getOverallResult() === 'Pass'
                    ? 'مطابق'
                    : getOverallResult() === 'Fail'
                      ? 'غير مطابق'
                      : getOverallResult() === 'OOS'
                        ? 'OOS - خارج المواصفة'
                        : 'معلق'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="أي ملاحظات إضافية حول الاختبار..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={!selectedProductId || !selectedTestMethodId}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {testResult ? 'تحديث النتيجة' : 'حفظ النتيجة'}
        </Button>
      </div>
    </form>
  );
}
