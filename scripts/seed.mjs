import {adminServices} from '../lib/firebase/admin-core.js';
import {demoCity,demoEstablishments,demoCourts,publicSettings} from '../lib/data/demo.js';
import {FieldValue} from 'firebase-admin/firestore';
const apply=process.argv.includes('--apply');
const expected=process.argv.find(arg=>arg.startsWith('--project='))?.slice(10);
console.log('Seed de demostración: 1 ciudad, 7 establecimientos ficticios y sus canchas.');
console.log('Identificadores demo-*; los documentos existentes nunca se sobrescriben.');
if(!apply){console.log('Simulación. No se conectó a Firebase ni se escribió ningún dato.');console.log('Para aplicar con autorización: npm run seed -- --apply --project=sinte-7dbec --demo-data-authorized');process.exit(0);}
if(!process.argv.includes('--demo-data-authorized')||expected!==(process.env.FIREBASE_ADMIN_PROJECT_ID||process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID))throw new Error('Falta indicar el proyecto exacto y la autorización explícita para datos ficticios.');
const {db,projectId}=adminServices();
if(projectId!==expected)throw new Error('El proyecto no coincide.');
const timestamp=FieldValue.serverTimestamp();
const entries=[['cities',demoCity.id,demoCity],['settings','public',publicSettings],['cityState',demoCity.id,{version:0}],...demoEstablishments.map(item=>['establishments',item.id,{...item,pricesVersion:0}]),...demoCourts.map(item=>['courts',item.id,{...item,configVersion:0}])];
const refs=entries.map(([collection,id])=>db.collection(collection).doc(id));
const count=await db.runTransaction(async tx=>{
    const docs=await tx.getAll(...refs);let created=0;
    for(const [index,doc] of docs.entries()){
        if(doc.exists){if(entries[index][0]==='establishments'&&!doc.data().isDemo)throw new Error('Se encontró un documento real con un identificador de demostración. No se escribió nada.');continue;}
        tx.create(refs[index],{...entries[index][2],createdAt:timestamp,updatedAt:timestamp});created++;
    }
    return created;
});
console.log(`Documentos creados: ${count}. Los documentos existentes se conservaron.`);
