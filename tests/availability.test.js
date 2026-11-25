import test from 'node:test';
import assert from 'node:assert/strict';
import {availabilityFor,groupResults,filterResults,weeklyKeys} from '../lib/availability/engine.js';
import {validateSearch,slotInstant,localDate,isFuture,isDate} from '../lib/availability/date.js';
import {contactMessage,whatsappLink} from '../lib/utils/whatsapp.js';
import {mapsUrl,localImage,FALLBACK_IMAGE} from '../lib/utils/media.js';
import {weeklySchedule,prices,recurringBlocks} from '../lib/validations/index.js';
const now=new Date('2026-11-25T12:00:00Z');
const court={id:'one',establishmentId:'club',type:'5',active:true,amenities:['roof'],weeklySchedule:{3:['18:00','19:00','24:00']},recurringBlocks:[{weekday:3,time:'19:00',active:true,startDate:'2026-01-01'}]};
const establishment={id:'club',name:'Club',active:true,pricesByType:{5:18000},amenities:[]};
test('recurrencia, excepción individual y bloqueo diario tienen la prioridad definida',()=>{
    assert.deepEqual(availabilityFor(court,'2026-11-25',{},now).map(v=>v.available),[true,false,true]);
    const exception={slots:{'19:00':'available'}};
    assert.equal(availabilityFor(court,'2026-11-25',exception,now)[1].available,true);
    assert.ok(availabilityFor(court,'2026-11-25',{...exception,blocked:true},now).every(v=>!v.available));
});
test('una excepción de plantilla conserva ocupaciones explícitas',()=>{
    const override={scheduleSlots:['18:00','20:00'],slots:{'18:00':'occupied'}};
    assert.deepEqual(availabilityFor(court,'2026-11-25',override,now).map(v=>[v.time,v.available]),[['18:00',false],['20:00',true]]);
    assert.equal(availabilityFor({...court,weeklySchedule:{3:['20:00']}},'2026-11-25',override,now)[0].available,false);
});
test('la madrugada usa la jornada anterior y el instante real en San Luis',()=>{
    assert.equal(slotInstant('2026-11-27','24:00').toISOString(),'2026-11-28T03:00:00.000Z');
    assert.equal(localDate(slotInstant('2026-11-27','25:00')),'2026-11-28');
    assert.equal(isFuture('2026-11-27','24:00',new Date('2026-11-28T03:10Z')),false);
});
test('rechaza fechas inexistentes, turnos pasados, medias horas y fechas fuera del horizonte',()=>{
    assert.equal(isDate('2026-02-30'),false);
    for(const changes of [{time:'18:30'},{date:'2026-11-24',time:'18:00'},{date:'2026-12-25'}])assert.throws(()=>validateSearch({city:'san-luis',date:'2026-11-25',time:'18:00',type:'5',...changes},now));
    assert.equal(validateSearch({city:'san-luis',date:'2026-11-25',time:'18:00',type:'5'},now).time,'18:00');
});
test('agrupa varias canchas de un establecimiento sin incluir turnos ocupados',()=>{
    const results=groupResults([court,{...court,id:'two'}],[establishment],'2026-11-25','18:00',[{courtId:'one',slots:{'18:00':'occupied'}}],now);
    assert.equal(results.length,1);assert.equal(results[0].matchingCourts.length,1);assert.equal(results[0].matchingCourts[0].id,'two');
    assert.equal(groupResults([court],[{...establishment,active:false}],'2026-11-25','18:00',[],now).length,0);
});
test('los servicios deben coincidir en una misma cancha disponible',()=>{
    const results=[{...establishment,price:18000,matchingCourts:[{amenities:['roof']},{amenities:['car']}]}];
    assert.equal(filterResults(results,{amenities:['roof','car']}).length,0);
    assert.equal(filterResults(results,{amenities:['roof']})[0].matchingCourts.length,1);
    assert.deepEqual(filterResults([...results,{...results[0],id:'cheaper',price:12000}]).map(v=>v.price),[12000,18000]);
});
test('WhatsApp incluye cancha, precio y fecha real de madrugada, sin reservar',()=>{
    const message=contactMessage({...establishment,name:'Club de prueba'}, {...court,name:'Cancha 1'},'2026-11-27','24:00');
    assert.match(message,/sábado/);assert.match(message,/28 de noviembre/);assert.match(message,/Cancha 1/);assert.match(message,/18\.000/);
    const link=whatsappLink('+5492665036482',message);assert.equal(new URL(link).hostname,'wa.me');assert.equal(new URL(link).searchParams.get('text'),message);assert.equal(whatsappLink('javascript:alert(1)','hola'),null);
});
test('rechaza mapas y rutas de imágenes no permitidos',()=>{
    assert.ok(mapsUrl('https://www.google.com/maps/embed?pb=test'));
    for(const url of ['https://www.google.com.evil.test/maps/embed','javascript:alert(1)','https://evil.test/maps/embed','https://www.google.com@evil.test/maps/embed'])assert.equal(mapsUrl(url),null);
    assert.equal(localImage('https://example.com/photo.jpg'),FALLBACK_IMAGE);assert.equal(localImage('/images/../secrets.png'),FALLBACK_IMAGE);
});
test('valida configuración y genera claves semanales consultables',()=>{
    assert.deepEqual(weeklyKeys({3:['18:00']}),['3|18:00']);assert.equal(weeklySchedule({1:[]})[0].length,0);
    assert.throws(()=>weeklySchedule({7:['18:00']}));assert.throws(()=>prices({5:-1},['5']));assert.throws(()=>prices({7:100},['5']));assert.throws(()=>recurringBlocks([{id:'one',weekday:8,time:'18:00',startDate:'2026-11-25'}]));
});
