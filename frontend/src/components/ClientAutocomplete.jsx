import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/apiServerClient';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Search, X, Building2, Mail } from 'lucide-react';

const ClientAutocomplete = ({ value, onChange, placeholder = "Buscar cliente..." }) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      api.get(`/api/clientes/${value}`).then(setSelectedClient).catch(() => setSelectedClient(null));
    } else {
      setSelectedClient(null);
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const data = await api.get(`/api/clientes?q=${encodeURIComponent(query)}`);
        setResults(data.slice(0, 5));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (client) => {
    setSelectedClient(client);
    onChange(client.id);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedClient(null);
    onChange('');
    setQuery('');
  };

  if (selectedClient) {
    return (
      <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
        <div className="flex flex-col overflow-hidden">
          <span className="font-medium text-sm truncate">{selectedClient.nombre}</span>
          {(selectedClient.empresa || selectedClient.email) && (
            <span className="text-xs text-muted-foreground truncate">{selectedClient.empresa} {selectedClient.empresa && selectedClient.email && '•'} {selectedClient.email}</span>
          )}
        </div>
        <button type="button" onClick={handleClear} className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="text" placeholder={placeholder} value={query} onChange={e => { setQuery(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} className="pl-9" />
      </div>
      {isOpen && query.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map(client => (
                <li key={client.id} onClick={() => handleSelect(client)} className="px-4 py-2 hover:bg-muted cursor-pointer flex flex-col">
                  <span className="font-medium text-sm">{client.nombre}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {client.empresa && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{client.empresa}</span>}
                    {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No se encontraron clientes</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientAutocomplete;
