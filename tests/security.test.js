import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerMutation} from '../lib/services/owner.js';
import {assertOrigin} from '../lib/services/http.js';
function fakeIdentity(data){
    const writes=[];
    const db={collection:name=>({doc:id=>({path:`${name}/${id}`,id})}),runTransaction:async fn=>fn({get:async ref=>({id:ref.id,exists:ref.path in data,data:()=>data[ref.path]}),set:(...args)=>writes.push(args),update:(...args)=>writes.push(args)})};
    return {identity:{db,uid:'owner'},writes};
}
const base={'users/owner':{active:true,role:'owner',establishmentIds:['own']},'establishments/own':{active:true,cityId:'san-luis',pricesByType:{5:18000}},'courts/court':{active:true,establishmentId:'own',weeklySchedule:{},configVersion:1}};
test('rechaza modificaciones a establecimientos ajenos antes de escribir',async()=>{
    const {identity,writes}=fakeIdentity({...base,'establishments/other':{active:true,cityId:'san-luis',pricesByType:{5:18000}}});
    await assert.rejects(ownerMutation(identity,{action:'prices',establishmentId:'other',prices:{5:1},expectedVersion:0}),error=>error.status===403);assert.equal(writes.length,0);
});
test('un propietario desactivado no conserva permisos por datos previos del cliente',async()=>{
    const {identity,writes}=fakeIdentity({...base,'users/owner':{active:false,role:'owner',establishmentIds:['own']}});
    await assert.rejects(ownerMutation(identity,{action:'schedule',courtId:'court',weeklySchedule:{},expectedVersion:1}),error=>error.status===403);assert.equal(writes.length,0);
});
test('las acciones no permiten cambiar permisos o modalidades comerciales',async()=>{
    const {identity,writes}=fakeIdentity(base);await assert.rejects(ownerMutation(identity,{action:'assignOwner',establishmentId:'own'}));assert.equal(writes.length,0);
});
test('rechaza configuración desactualizada sin sobrescribir otra sesión',async()=>{
    const {identity,writes}=fakeIdentity(base);await assert.rejects(ownerMutation(identity,{action:'schedule',courtId:'court',weeklySchedule:{},expectedVersion:0}),error=>error.status===409);assert.equal(writes.length,0);
});
test('un precio y la invalidación de la ciudad se escriben en la misma transacción',async()=>{
    const {identity,writes}=fakeIdentity(base);await ownerMutation(identity,{action:'prices',establishmentId:'own',prices:{5:22000},expectedVersion:0});assert.equal(writes.length,2);assert.equal(writes[0][0].path,'establishments/own');assert.equal(writes[0][1].pricesByType[5],22000);assert.equal(writes[1][0].path,'cityState/san-luis');
});
test('las mutaciones públicas rechazan orígenes diferentes',()=>{
    const request=new Request('http://localhost:3000/api/contact',{method:'POST',headers:{Origin:'https://evil.test'}});assert.throws(()=>assertOrigin(request),error=>error.status===403);
});
