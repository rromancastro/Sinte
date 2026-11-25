import {adminServices} from '../lib/firebase/admin-core.js';
import {FieldValue} from 'firebase-admin/firestore';
const option=name=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3);
const email=option('email');const name=option('name');const establishmentIds=(option('establishments')||'').split(',').filter(Boolean);
if(!email||!name||!establishmentIds.length)throw new Error('Uso: npm run owner -- --email=propietario@ejemplo.com --name=Nombre --establishments=id1,id2 [--apply --project=sinte-7dbec]');
if(!process.argv.includes('--apply')){console.log('Simulación: se creará o asignará una cuenta de propietario. No se escribió nada.');process.exit(0);}
const {db,auth,projectId}=adminServices();if(option('project')!==projectId)throw new Error('Confirmá el identificador exacto del proyecto.');
const establishments=await db.getAll(...establishmentIds.map(id=>db.collection('establishments').doc(id)));
if(establishments.some(doc=>!doc.exists||!doc.data().active))throw new Error('Todos los establecimientos deben existir y estar activos.');
let user;try{user=await auth.getUserByEmail(email);}catch(error){if(error.code!=='auth/user-not-found')throw error;user=await auth.createUser({email,displayName:name,disabled:false});}
await db.collection('users').doc(user.uid).set({uid:user.uid,email,name,role:'owner',active:true,establishmentIds,updatedAt:FieldValue.serverTimestamp()});
console.log('Propietario asignado. Puede establecer su contraseña usando la recuperación por email del login.');
