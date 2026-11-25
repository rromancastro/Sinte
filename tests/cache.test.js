import test from 'node:test';
import assert from 'node:assert/strict';
import {cached,versioned} from '../lib/services/cache.js';
test('las solicitudes concurrentes comparten una única consulta',async()=>{
    let reads=0;const load=async()=>{reads++;return ['result'];};await Promise.all(Array.from({length:10},()=>cached('same-test',load)));assert.equal(reads,1);
});
test('un cambio de versión invalida la caché incluso entre instancias que leen la misma versión',async()=>{
    let version=0,calls=0;const db={collection:()=>({doc:()=>({get:async()=>({data:()=>({version})})})})};
    const load=async()=>{calls++;return {price:version?22000:18000};};assert.equal((await versioned(db,'test-city','search',load)).price,18000);assert.equal((await versioned(db,'test-city','search',load)).price,18000);assert.equal(calls,1);version++;assert.equal((await versioned(db,'test-city','search',load)).price,22000);assert.equal(calls,2);
});
test('si hay cambios mientras se consulta, nunca publica una respuesta de la versión anterior',async()=>{
    let version=0,calls=0;const db={collection:()=>({doc:()=>({get:async()=>({data:()=>({version})})})})};
    const result=await versioned(db,'racing-city','search',async()=>{calls++;const result={version};if(calls===1)version++;return result;});assert.equal(result.version,1);assert.equal(calls,2);
});
