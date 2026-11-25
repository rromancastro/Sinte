import assert from 'node:assert/strict';
import {localDate,addDays} from '../lib/availability/date.js';
const base=process.env.SINTE_TEST_URL||'http://127.0.0.1:3000';
const date=addDays(localDate(),1);
async function get(path){const response=await fetch(`${base}${path}`,{signal:AbortSignal.timeout(15000)});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;}
const home=await get('/api/public?resource=home');
assert.equal(home.demo,true,'Esta prueba sólo puede ejecutarse sobre la demostración local.');
assert.equal(home.cities.length,1);assert.equal(home.featured.length,3);
const query=new URLSearchParams({resource:'search',city:'san-luis',date,time:'18:00',type:'5'});
const results=await get(`/api/public?${query}`);assert.ok(results.total>0);assert.equal(new Set(results.results.map(v=>v.id)).size,results.results.length);
const filtered=await get(`/api/public?${query}&amenities=roof,car`);assert.ok(filtered.total<results.total);
const descending=await get(`/api/public?${query}&order=desc`);assert.ok(descending.results[0].price>=descending.results.at(-1).price);
const detail=await get(`/api/public?resource=detail&id=demo-la-estacion&date=${date}`);assert.equal(detail.courts.length,3);
const owner=await fetch(`${base}/api/owner?date=${date}`,{signal:AbortSignal.timeout(15000)});assert.equal(owner.status,401);
const contact=await fetch(`${base}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3000'},signal:AbortSignal.timeout(15000),body:JSON.stringify({establishmentId:'demo-la-estacion',courtId:detail.courts[0].id,date,time:'18:00'})});
const link=await contact.json();assert.equal(contact.status,200,link.error);assert.equal(new URL(link.url).hostname,'wa.me');assert.equal(link.tracked,false);
const integrated=await get(`/api/public?resource=detail&id=demo-club-5&date=${date}`);assert.equal(integrated.establishment.bookingMode,'integrated');
const invalid=await fetch(`${base}/api/public?${query}&time=18:30`,{signal:AbortSignal.timeout(15000)});assert.equal(invalid.status,400);
console.log(`HTTP correcto: inicio, ${results.total} resultados agrupados, filtros, precios, detalle, panel protegido, WhatsApp y variante integrada. Sin escrituras en Firebase.`);
