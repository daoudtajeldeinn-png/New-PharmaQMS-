import { useState } from 'react';
import { Key, ShieldCheck, Copy, Terminal, Calendar as CalendarIcon, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateLicenseKey } from '@/services/LicenseManager';
import { toast } from 'sonner';

export function DevPortal() {
    const [expiryDate, setExpiryDate] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');

    const handleGenerate = () => {
        if (!expiryDate) {
            toast.error('Please select an expiration date');
            return;
        }

        const date = new Date(expiryDate);
        const key = generateLicenseKey(date);
        setGeneratedKey(key);
        toast.success('License key generated successfully');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedKey);
        toast.success('Key copied to clipboard');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-600 rounded-xl">
                    <Terminal className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Developer Licensing Portal</h1>
                    <p className="text-slate-500 font-medium">Generate cryptographic access keys for client deployments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-sm font-black uppercase text-slate-600 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-400">Expiration Date</Label>
                            <Input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="bg-white"
                            />
                            <p className="text-[10px] text-slate-500 italic">
                                The license will expire at 00:00:00 on the selected date.
                            </p>
                        </div>

                        <Button onClick={handleGenerate} className="w-full bg-indigo-600 hover:bg-slate-900 font-black uppercase tracking-widest text-[10px] h-12 transition-all">
                            Generate Encrypted Key
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b text-indigo-600">
                        <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Cryptographic Output
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-400">Generated Integration Key</Label>
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={generatedKey}
                                    placeholder="Key will appear here..."
                                    className="w-full h-24 p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 resize-none focus:outline-none"
                                />
                                {generatedKey && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-2 bottom-2 text-slate-500 hover:text-white"
                                        onClick={copyToClipboard}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <p className="text-[10px] text-amber-700 font-bold uppercase flex items-center gap-1 mb-1">
                                <Code className="h-3 w-3" />
                                Security Notice
                            </p>
                            <p className="text-[9px] text-amber-600 leading-relaxed italic">
                                Keys are unique to the SALT defined in the system. Changing the salt will invalidate all existing keys generated with it.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-slate-400">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <Key className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider leading-none mt-1">GXP LICENSING GUIDELINES</h3>
                            <p className="text-xs leading-relaxed">
                                Provide the generated key to the client during installation. If a trial is needed, generate a key for 14-30 days. For full licensing, use the contract duration (e.g., 365 days). The client can input this key in the Activation Portal which appears automatically upon expiry.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
