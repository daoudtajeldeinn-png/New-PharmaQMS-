import { useStore } from '@/hooks/useStore';
import { QualitySystemCard } from '@/components/quality/QualitySystemCard';
import { PharmacopeiaReference } from '@/components/quality/PharmacopeiaReference';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText } from 'lucide-react';

export function QualitySystems() {
  const { state } = useStore();

  const gmpSystem = state.qualitySystems.find((s) => s.code === 'GMP');
  const gdpSystem = state.qualitySystems.find((s) => s.code === 'GDP');
  const glpSystem = state.qualitySystems.find((s) => s.code === 'GLP');
  const gspSystem = state.qualitySystems.find((s) => s.code === 'GSP');
  const ichSystem = state.qualitySystems.find((s) => s.code === 'ICH');
  const fdaSystem = state.qualitySystems.find((s) => s.code === 'FDA');
  const isoSystem = state.qualitySystems.find((s) => s.code === 'ISO');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regulatory QMS Frameworks</h1>
        <p className="text-slate-500">
          Governing Pharmaceutical Quality Systems (GMP, GDP, GLP, GSP, ICH, FDA, ISO)
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
          <TabsTrigger value="overview">Executive Summary</TabsTrigger>
          <TabsTrigger value="pharmacopeia">Pharmacopeial Standards</TabsTrigger>
          <TabsTrigger value="documents">Documentation Library</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gmpSystem && (
              <QualitySystemCard
                system={gmpSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
            {gdpSystem && (
              <QualitySystemCard
                system={gdpSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
            {glpSystem && (
              <QualitySystemCard
                system={glpSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
            {gspSystem && (
              <QualitySystemCard
                system={gspSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
            {ichSystem && (
              <QualitySystemCard
                system={ichSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
            {fdaSystem && (
              <QualitySystemCard
                system={fdaSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
            {isoSystem && (
              <QualitySystemCard
                system={isoSystem}
                onViewDocuments={() => { }}
                onViewTraining={() => { }}
              />
            )}
          </div>

          <div className="rounded-lg border bg-slate-50 p-6 dark:bg-slate-800">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-blue-900 uppercase">
              <Shield className="h-5 w-5 text-blue-600" />
              Global Quality System Narratives
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-bold mb-2 text-slate-900">GMP - Good Manufacturing Practices</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Guarantees that pharmaceutical products are consistently produced and controlled
                  according to quality standards appropriate for their intended use and as required
                  by the Marketing Authorization.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-slate-900">GDP - Good Distribution Practices</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ensures that the quality of pharmaceutical products is maintained throughout the
                  supply chain, from initial storage to final user delivery.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-slate-900">GLP - Good Laboratory Practices</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Defines the quality system concerned with the organizational process and the
                  conditions under which non-clinical health and environmental safety studies
                  are planned, performed and reported.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-slate-900">GSP - Good Storage Practices</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Maintains product integrity by ensuring appropriate environmental conditions
                  and inventory management during storage.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-slate-900">ICH - International Council for Harmonisation</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Harmonizes regulatory requirements for registration of pharmaceuticals to ensure
                  Quality, Safety and Efficacy globally.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 text-slate-900">FDA - US Food & Drug Administration</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enforces 21 CFR Parts 210 and 211, regulating manufacturing, facilities, and
                  controls for pharmaceutical products in the United States.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pharmacopeia">
          <PharmacopeiaReference monographs={state.pharmacopeiaMonographs} />
        </TabsContent>

        <TabsContent value="documents">
          <div className="rounded-md border p-8 text-center bg-slate-50">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium">Compliance Document Vault</h3>
            <p className="text-slate-500 mt-2">
              Managing controlled documents (SOPs, Protocols, Validation Reports)
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
