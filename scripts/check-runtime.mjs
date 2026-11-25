// Detectar incompatibilidades al construir, antes de publicar funciones que fallen.
if (Number(process.versions.node.split('.')[0]) !== 24 || !process.features.require_module) {
    console.error(`Runtime incompatible: Node ${process.version}. Sinte requiere Node 24 con soporte require(ESM). Revisá la versión de Node en el hosting y que NODE_OPTIONS no desactive ese soporte.`);
    process.exit(1);
}
try {
    await import('firebase-admin/auth');
    await import('firebase-admin/firestore');
    console.log(`Node ${process.version}: Firebase Admin Auth y Firestore cargan correctamente.`);
} catch (error) {
    console.error(`No se pudieron cargar las dependencias del servidor: ${error.code || error.name}.`);
    process.exit(1);
}
