import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import api from '@/lib/apiServerClient';
import { cn } from '@/lib/utils';

const CategoryCombobox = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get('/api/categorias').then(setCategories).catch(() => {});
  }, []);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const newCat = await api.post('/api/categorias', { name });
      setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(newCat.name);
      setOpen(false);
      setSearch('');
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = categories.some(c => c.name.toLowerCase() === search.trim().toLowerCase());
  const showCreate = search.trim().length > 0 && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? <span>{value}</span>
            : <span className="text-muted-foreground">Seleccionar categoría...</span>
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar o crear categoría..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !showCreate && (
              <CommandEmpty>
                {categories.length === 0
                  ? 'Escribe para crear la primera categoría'
                  : 'Sin resultados. Escribe para crear una nueva.'
                }
              </CommandEmpty>
            )}
            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.map(cat => (
                  <CommandItem
                    key={cat.id}
                    value={cat.name}
                    onSelect={() => handleSelect(cat.name)}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === cat.name ? 'opacity-100' : 'opacity-0')} />
                    {cat.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreate}
                  disabled={creating}
                  className="text-primary font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {creating ? 'Creando...' : `Crear "${search.trim()}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryCombobox;
