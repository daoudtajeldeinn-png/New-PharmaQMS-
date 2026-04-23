import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  GraduationCap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { QualitySystem } from '@/types';
import { cn } from '@/lib/utils';

interface QualitySystemCardProps {
  system: QualitySystem;
  onViewDocuments?: () => void;
  onViewTraining?: () => void;
}

const statusColors = {
  Active: 'bg-green-100 text-green-800 border-green-300',
  Under_Review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Superseded: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusLabels = {
  Active: 'نشط',
  Under_Review: 'قيد المراجعة',
  Superseded: 'ملغي',
};

export function QualitySystemCard({
  system,
  onViewDocuments,
  onViewTraining,
}: QualitySystemCardProps) {
  return (
    <Card className="h-full transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-bold text-lg px-3 py-1">
                {system.code}
              </Badge>
              <Badge
                variant="outline"
                className={cn(statusColors[system.status])}
              >
                {statusLabels[system.status]}
              </Badge>
            </div>
            <CardTitle className="text-lg">{system.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 line-clamp-3">
          {system.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">الإصدار:</span>
            <span className="font-medium">{system.version}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">تاريخ النفاذ:</span>
            <span className="font-medium">
              {new Date(system.effectiveDate).toLocaleDateString('ar-SA')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">الوثائق:</span>
            <span className="font-medium">{system.documents.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">التدريب مطلوب:</span>
            <span className="font-medium">
              {system.trainingRequired ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="ml-1 h-4 w-4" />
                  نعم
                </span>
              ) : (
                <span className="flex items-center text-slate-400">
                  <AlertCircle className="ml-1 h-4 w-4" />
                  لا
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDocuments}
          >
            <FileText className="ml-2 h-4 w-4" />
            الوثائق
          </Button>
          {system.trainingRequired && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onViewTraining}
            >
              <GraduationCap className="ml-2 h-4 w-4" />
              التدريب
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
