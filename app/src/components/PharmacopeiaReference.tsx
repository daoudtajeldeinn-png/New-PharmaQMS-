import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, BookOpen, ExternalLink, FileText, Paperclip, Link as LinkIcon, Trash2, Plus } from 'lucide-react';
import type { PharmacopeiaMonograph, PharmacopeiaStandard } from '@/types';

interface PharmacopeiaReferenceProps {
  monographs: PharmacopeiaMonograph[];
}

const pharmacopeiaLabels: Record<PharmacopeiaStandard, string> = {
  USP: 'United States Pharmacopeia',
  BP: 'British Pharmacopeia',
  EP: 'European Pharmacopeia',
  JP: 'Japanese Pharmacopeia',
  IP: 'Indian Pharmacopeia',
  PhInt: 'International Pharmacopeia',
  Company_Specification: 'Company Specification',
  Other: 'Other',
};

export function PharmacopeiaReference({ monographs }: PharmacopeiaReferenceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pharmacopeiaFilter, setPharmacopeiaFilter] = useState<string>('all');
  const [selectedMonograph, setSelectedMonograph] = useState<PharmacopeiaMonograph | null>(null);

  const filteredMonographs = monographs.filter((mono) => {
    const matchesSearch =
      mono.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mono.monographNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mono.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPharmacopeia =
      pharmacopeiaFilter === 'all' || mono.pharmacopeia === pharmacopeiaFilter;

    return matchesSearch && matchesPharmacopeia;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>البحث في المعايير الدستورية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="البحث بالمنتج أو رقم المونوغراف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={pharmacopeiaFilter} onValueChange={setPharmacopeiaFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر المعيار الدستوري" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المعايير</SelectItem>
                {Object.entries(pharmacopeiaLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>قائمة المونوغرافات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المعيار</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonographs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        لا توجد نتائج مطابقة
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMonographs.map((mono) => (
                      <TableRow
                        key={mono.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => setSelectedMonograph(mono)}
                      >
                        <TableCell>
                          <Badge variant="secondary">{mono.pharmacopeia}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{mono.productName}</p>
                            <p className="text-xs text-slate-500">
                              {mono.monographNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{mono.category}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {selectedMonograph ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedMonograph.productName}</CardTitle>
                <Badge variant="secondary">{selectedMonograph.pharmacopeia}</Badge>
              </div>
              <p className="text-sm text-slate-500">
                {selectedMonograph.monographNumber} | {selectedMonograph.category}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">الاختبارات المطلوبة:</h4>
                  <div className="space-y-3">
                    {selectedMonograph.tests.map((test, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{test.testName}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-slate-500">الطريقة: </span>
                            {test.procedure}
                          </p>
                          <p>
                            <span className="text-slate-500">معايير القبول: </span>
                            <Badge variant="outline" className="font-mono">
                              {test.acceptanceCriteria}
                            </Badge>
                          </p>
                          {test.reference && (
                            <p>
                              <span className="text-slate-500">المرجع: </span>
                              {test.reference}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-base font-bold text-slate-900 mb-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-indigo-600" />
                      المرفقات والمراجع (Attachments)
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-indigo-600">
                      <Plus className="h-3 w-3 mr-1" /> إضافة
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedMonograph.attachments && selectedMonograph.attachments.length > 0 ? (
                      selectedMonograph.attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white rounded border border-slate-200">
                              {attachment.type === 'Link' ? <LinkIcon className="h-3 w-3 text-blue-500" /> :
                                attachment.type === 'File' ? <FileText className="h-3 w-3 text-orange-500" /> :
                                  <BookOpen className="h-3 w-3 text-green-500" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{attachment.name}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{attachment.url}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 text-slate-400" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-[10px] text-slate-400">لا توجد مرفقات مرتبطة بهذا المونوغراف</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">الإصدار:</span>
                    <span className="font-mono">{selectedMonograph.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-500 font-medium">تاريخ النفاذ:</span>
                    <span className="font-bold">
                      {new Date(selectedMonograph.effectiveDate).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <FileText className="ml-2 h-4 w-4" />
                    تحميل المونوغراف
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="ml-2 h-4 w-4" />
                    فتح المرجع
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center text-slate-400">
              <BookOpen className="mx-auto h-12 w-12 mb-2" />
              <p>اختر مونوغراف لعرض التفاصيل</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
