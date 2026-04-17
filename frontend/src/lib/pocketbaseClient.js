// Archivo temporal para evitar errores del import mientras se cambia a Axios/Fetch.
const pb = {
    authStore: {
        isValid: false,
        model: null,
        token: '',
        clear: () => {},
        onChange: (callback) => {
            // Mock de la suscripcion de authStore
            return () => {}; 
        }
    },
    collection: (name) => ({
        getFullList: () => Promise.resolve([]),
        getList: () => Promise.resolve({ items: [], totalItems: 0 }),
        getOne: () => Promise.resolve({}),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(true),
        authWithPassword: () => Promise.resolve({ record: {}, token: 'mock-token' }),
        authRefresh: () => Promise.resolve({ record: {}, token: 'mock-token' }),
    })
};

export default pb;
