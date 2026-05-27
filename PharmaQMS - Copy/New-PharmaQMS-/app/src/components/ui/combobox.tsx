import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    allowCustom?: boolean;
    disabled?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    allowCustom = true,
    disabled = false,
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const selectedLabel = React.useMemo(() => {
        const found = options.find((opt) => opt.value === value);
        if (found) return found.label;
        // If value is a custom entry (not in options), show it directly
        if (value && value.startsWith('custom:')) return value.slice(7);
        if (value) {
            // Fallback: maybe value itself is a label
            const byLabel = options.find((opt) => opt.label === value);
            if (byLabel) return byLabel.label;
        }
        return '';
    }, [options, value]);

    const trimmedSearch = search.trim();
    const isCustomEntry =
        allowCustom &&
        trimmedSearch.length > 0 &&
        !options.some(
            (opt) =>
                opt.label.toLowerCase() === trimmedSearch.toLowerCase() ||
                opt.value.toLowerCase() === trimmedSearch.toLowerCase()
        );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCustom && trimmedSearch.length > 0 ? (
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                                    onClick={() => {
                                        onValueChange(`custom:${trimmedSearch}`);
                                        setSearch('');
                                        setOpen(false);
                                    }}
                                >
                                    <Plus className="h-4 w-4 text-indigo-500" />
                                    <span>
                                        Add: <strong className="text-indigo-600">{trimmedSearch}</strong>
                                    </span>
                                </button>
                            ) : (
                                emptyText
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onValueChange(option.value === value ? '' : option.value);
                                        setSearch('');
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === option.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        {isCustomEntry && options.length > 0 && (
                            <CommandGroup heading="Custom">
                                <CommandItem
                                    value={`__custom__${trimmedSearch}`}
                                    onSelect={() => {
                                        onValueChange(`custom:${trimmedSearch}`);
                                        setSearch('');
                                        setOpen(false);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4 text-indigo-500" />
                                    Add: <strong className="ml-1 text-indigo-600">{trimmedSearch}</strong>
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
