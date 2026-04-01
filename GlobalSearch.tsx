import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Package,
    Settings,
    AlertTriangle,
    Beaker,
    Building2,
    ClipboardList,
    Cpu,
    History,
    Camera,
} from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { QRScannerDialog } from '@/components/ui/QRScannerDialog';
import { useStore } from '@/hooks/useStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);
    const { state } = useStore();
    const navigate = useNavigate();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const onSelect = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const handleScan = (decodedText: string) => {
        // 1. Try to find a matching material
        const material = state.rawMaterials.find(m => m.id === decodedText || m.batchNumber === decodedText);
        if (material) {
            toast.success(`Found Material: ${material.name}`);
            navigate('/materials');
            return;
        }

        // 2. Try to find a matching equipment
        const equipment = state.equipment.find(e => e.id === decodedText || e.assetTag === decodedText);
        if (equipment) {
            toast.success(`Found Equipment: ${equipment.name}`);
            navigate('/equipment');
            return;
        }

        // 3. Try to find a product
        const product = state.products.find(p => p.id === decodedText || p.batchNumber === decodedText);
        if (product) {
            toast.success(`Found Product: ${product.name}`);
            navigate('/products');
            return;
        }

        toast.error(`No record found for: ${decodedText}`);
    };

    return (
        <>
            <div className="relative group">
                <button
                    onClick={() => setOpen((open) => !open)}
                    className="relative flex h-11 w-96 items-center gap-3 rounded-2xl border border-white/20 bg-white/50 px-4 text-sm text-slate-400 transition-all hover:bg-white/80 dark:bg-slate-950/50 dark:hover:bg-slate-950/80 group"
                >
                    <Search className="h-4 w-4 transition-colors group-hover:text-indigo-500" />
                    <span className="flex-1 text-left">Search Intelligence Hub...</span>
                    <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100 sm:flex dark:bg-slate-800 dark:border-slate-700">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsScannerOpen(true);
                    }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                    title="Scan QR/Barcode"
                >
                    <Camera className="h-4 w-4" />
                </button>
            </div>

            <QRScannerDialog
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onScan={handleScan}
            />

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type to search across PQMS data..." />
                <CommandList className="max-h-[500px]">
                    <CommandEmpty>No results found for your search.</CommandEmpty>

                    <CommandGroup heading="Production & Materials">
                        {state.products.slice(0, 5).map((product) => (
                            <CommandItem
                                key={product.id}
                                onSelect={() => onSelect('/products')}
                                className="flex items-center gap-3 p-3"
                            >
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-sm uppercase">{product.name}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{product.batchNumber} • {product.category}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">{product.status}</Badge>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-2 h-7 px-2 text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        navigate(`/batch-trace`, { state: { batchNumber: product.batchNumber } });
                                    }}
                                >
                                    <History className="h-3 w-3 mr-1" /> Trace
                                </Button>
                            </CommandItem>
                        ))}

                        {state.rawMaterials.slice(0, 5).map((material) => (
                            <CommandItem
                                key={material.id}
                                onSelect={() => onSelect('/materials')}
                                className="flex items-center gap-3 p-3"
                            >
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                    <Beaker className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-sm uppercase">{material.name}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{material.batchNumber} • {material.supplier}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">{material.status}</Badge>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-2 h-7 px-2 text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        navigate(`/batch-trace`, { state: { batchNumber: material.batchNumber } });
                                    }}
                                >
                                    <History className="h-3 w-3 mr-1" /> Trace
                                </Button>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Quality & Compliance">
                        {state.deviations.slice(0, 3).map((dev) => (
                            <CommandItem
                                key={dev.id}
                                onSelect={() => onSelect('/deviations')}
                                className="flex items-center gap-3 p-3"
                            >
                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-sm uppercase">{dev.title}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{dev.id} • {dev.type} Deviation</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">{dev.status}</Badge>
                            </CommandItem>
                        ))}

                        {state.capas.slice(0, 3).map((capa) => (
                            <CommandItem
                                key={capa.id}
                                onSelect={() => onSelect('/capa')}
                                className="flex items-center gap-3 p-3"
                            >
                                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-600">
                                    <ClipboardList className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-sm uppercase">{capa.title}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{capa.id} • {capa.priority} Priority</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">{capa.status}</Badge>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Assets & Suppliers">
                        {state.equipment.slice(0, 5).map((eq) => (
                            <CommandItem
                                key={eq.id}
                                onSelect={() => onSelect('/equipment')}
                                className="flex items-center gap-3 p-3"
                            >
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                                    <Cpu className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-sm uppercase">{eq.name}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{eq.assetTag} • {eq.location}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">{eq.status}</Badge>
                            </CommandItem>
                        ))}

                        {state.suppliers.slice(0, 5).map((sup) => (
                            <CommandItem
                                key={sup.id}
                                onSelect={() => onSelect('/suppliers')}
                                className="flex items-center gap-3 p-3"
                            >
                                <div className="p-2 bg-slate-500/10 rounded-lg text-slate-600">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-sm uppercase">{sup.name}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{sup.contactPerson} • {sup.email}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] uppercase font-black">{sup.status}</Badge>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => onSelect('/')} className="flex gap-3 p-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><History className="h-4 w-4" /></div>
                            <span className="font-bold text-sm uppercase">Operations Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => onSelect('/settings')} className="flex gap-3 p-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><Settings className="h-4 w-4" /></div>
                            <span className="font-bold text-sm uppercase">Intelligence Center Settings</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
