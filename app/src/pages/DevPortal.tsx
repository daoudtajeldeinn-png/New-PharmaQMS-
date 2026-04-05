import { Terminal, Key, Code, Info, FileCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DevPortal() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto py-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-600 rounded-xl">
                    <Terminal className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Developer Licensing Portal</h1>
                    <p className="text-slate-500 font-medium">System security and commercial configuration</p>
                </div>
            </div>

            <Alert className="bg-indigo-50 border-indigo-200 text-indigo-900 mb-8 p-6 rounded-[24px]">
                <Info className="h-5 w-5 text-indigo-600" />
                <AlertTitle className="font-black uppercase tracking-tight mb-2">Commercial Security Update</AlertTitle>
                <AlertDescription className="text-sm font-medium leading-relaxed">
                    For maximum security, license key generation has been removed from the client application. This prevents customers from self-activating the product.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm overflow-hidden rounded-[30px]">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-sm font-black uppercase text-slate-600 flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            How to Generate Keys
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600">
                        <p>To generate a hardware-locked activation key for a customer, use the private generator script included in the server root:</p>
                        <div className="p-4 bg-slate-950 text-emerald-400 font-mono rounded-xl border border-slate-800">
                            node license_generator.js
                        </div>
                        <ul className="list-disc list-inside space-y-1 mt-4">
                            <li>Ask the customer for their <span className="font-bold text-slate-900">Machine ID</span>.</li>
                            <li>Run the script and follow the interactive prompts.</li>
                            <li>Send the generated hash to the customer.</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden rounded-[30px]">
                    <CardHeader className="bg-slate-50 border-b text-indigo-600">
                        <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Audit Integrity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="text-[10px] text-amber-700 font-bold uppercase flex items-center gap-1 mb-1">
                                Secure Salt Protection
                            </p>
                            <p className="text-[11px] text-amber-600 leading-relaxed italic">
                                Keys are uniquely bound to the hardware ID and the master salt. Do not expose your private generator script or the internal salt configuration to unauthorized personnel.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-slate-400 rounded-[30px]">
                <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl">
                            <Key className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider leading-none mt-1">GXP COMMERCIAL POLICY</h3>
                            <p className="text-xs leading-relaxed">
                                Licensing is a critical component of software validation (CSV). Ensure that all issued keys are logged in your internal asset register for auditability. For enterprise deployments, always issue keys for the specific duration specified in the commercial agreement.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
