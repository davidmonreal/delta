"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Search, Loader2 } from "lucide-react";
import { searchManagerAliasesAction } from "./managerAliasActions";

type Option = {
    value: string;
    label: string;
};

type ManagerAliasSelectorProps = {
    initialAliases?: string[];
};

export default function ManagerAliasSelector({ initialAliases = [] }: ManagerAliasSelectorProps) {
    const [selected, setSelected] = useState<Option[]>([]);
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Load initial aliases
    useEffect(() => {
        if (initialAliases.length > 0) {
            setSelected(initialAliases.map(alias => ({ label: alias, value: alias })));
        }
    }, [initialAliases]);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await searchManagerAliasesAction(query);
                // Filter out already selected
                setOptions(results.filter(r => !selected.find(s => s.value === r.value)));
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, selected]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addAlias = (option: Option) => {
        setSelected(prev => [...prev, option]);
        setQuery("");
        setOptions([]);
        setIsOpen(false);
    };

    const removeAlias = (value: string) => {
        setSelected(prev => prev.filter(s => s.value !== value));
    };

    return (
        <div className="w-full space-y-3" ref={containerRef}>
            <div className="relative w-full">
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setTimeout(() => {
                                const input = containerRef.current?.querySelector('input');
                                if (input) input.focus();
                            }, 0);
                        }
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                    <span className="truncate text-slate-500">Afegir àlies...</span>
                    <Search size={18} className="text-slate-400" />
                </button>

                {isOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 px-3 py-2">
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1">
                                <Search size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full bg-transparent text-sm text-slate-800 focus:outline-none"
                                    placeholder="Cerca un gestor..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                            </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto py-1">
                            {!query && options.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400">
                                    Escriu per cercar...
                                </div>
                            ) : options.length === 0 && !loading ? (
                                <div className="px-4 py-3 text-sm text-slate-500">No s'han trobat resultats.</div>
                            ) : (
                                options.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => addAlias(option)}
                                        className="w-full px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option.label}</span>
                                            <Plus size={14} className="text-slate-400" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 divide-y divide-slate-100">
                {selected.map((alias) => (
                    <div
                        key={alias.value}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-slate-700"
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                                {alias.label}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeAlias(alias.value)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
                        >
                            Esborrar
                        </button>
                        <input type="hidden" name="managerAliases" value={alias.value} />
                    </div>
                ))}
                {selected.length === 0 && (
                    <p className="py-2 text-xs text-slate-400 italic">Cap àlies assignat.</p>
                )}
            </div>
        </div>
    );
}
