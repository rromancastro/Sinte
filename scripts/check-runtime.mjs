import {spawnSync} from 'node:child_process';
// Probar también el cargador CommonJS restrictivo de las funciones serverless.
if (Number(process.versions.node.split('.')[0]) !== 24) {
    console.error(`Runtime incompatible: Node ${process.version}. Sinte requiere Node 24.`);
    process.exit(1);
}
try {
    await import('firebase-admin/auth');
    await import('firebase-admin/firestore');
    const restrictive=spawnSync(process.execPath,['--no-experimental-require-module','--input-type=module'],{
        cwd:process.cwd(),encoding:'utf8',timeout:15000,
        input:"await import('firebase-admin/auth'); await import('firebase-admin/firestore');"
    });
    if(restrictive.status!==0)throw Object.assign(new Error(),{code:'FIREBASE_COMMONJS_INCOMPATIBLE'});
    console.log(`Node ${process.version}: Firebase Admin Auth y Firestore cargan correctamente.`);
} catch (error) {
    console.error(`No se pudieron cargar las dependencias del servidor: ${error.code || error.name}.`);
    process.exit(1);
}
