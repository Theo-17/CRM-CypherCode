// Esta es una versión de simulación (mock) mientras finalizamos la migración a PostgreSQL.
// Ya no deberíamos usar pocketbase client directamente.
const pb = {
    collection: () => ({
        getFullList: () => [],
        getFirstListItem: () => null,
        create: () => null,
        update: () => null,
        delete: () => null,
    })
};

export default pb;
