// Caché efímera acotada: no depende del disco ni de funciones exclusivas del hosting.
const entries = new Map();
const flights = new Map();
export async function cached(key, loader, ttl = 60000) {
    const entry = entries.get(key);
    if (entry && entry.until > Date.now()) return entry.value;
    if (flights.has(key)) return flights.get(key);
    const promise = Promise.resolve().then(loader).then(value => {
        if (entries.size >= 200) entries.delete(entries.keys().next().value);
        entries.set(key, { value, until: Date.now() + ttl });
        return value;
    }).finally(() => flights.delete(key));
    flights.set(key, promise);
    return promise;
}
export async function versioned(db, cityId, key, loader) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const ref = db.collection('cityState').doc(cityId);
        const before = (await ref.get()).data()?.version || 0;
        const result = await cached(`${cityId}:${before}:${key}`, async () => {
            const data = await loader();
            const after = (await ref.get()).data()?.version || 0;
            if (before !== after) { const error = new Error('La disponibilidad se está actualizando.'); error.retryVersion = true; throw error; }
            return data;
        }).catch(error => { if (error.retryVersion) return null; throw error; });
        if (result !== null) return result;
    }
    const error = new Error('La disponibilidad cambió. Volvé a consultar.'); error.status = 409; throw error;
}
