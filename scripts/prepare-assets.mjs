import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve(import.meta.dirname, '..');
const components = await fs.readFile(path.join(root, 'design/components.svg'), 'utf8');
const home = await fs.readFile(path.join(root, 'design/home.svg'), 'utf8');
const login = await fs.readFile(path.join(root, 'design/login.svg'), 'utf8');
async function save(relative, bytes) { const target = path.join(root, 'public', relative); await fs.mkdir(path.dirname(target), {recursive:true}); await fs.writeFile(target, bytes); }
function group(svg, id) {
    const start = svg.indexOf(`<g id="${id}"`);
    if (start < 0) throw new Error(`No se encontró ${id}`);
    const tags = /<g\b[^>]*>|<\/g>/g; tags.lastIndex = start;
    let depth = 0;
    for (let match; (match = tags.exec(svg));) {
        depth += match[0].startsWith('</') ? -1 : 1;
        if (depth === 0) return svg.slice(start, tags.lastIndex);
    }
    throw new Error('SVG incompleto');
}
const names = ['pin','calendar','clock','ball','chevron','back','search','roof','car','hanger','bulb','edit','filter','whatsapp','handshake'];
const clips = [...components.matchAll(/<clipPath\b[^>]*>[\s\S]*?<\/clipPath>/g)].map(v=>v[0]).join('');
for (const [index, name] of names.entries()) {
    const body = group(components, `Icono/${name}`);
    await save(`images/icons/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="${24+index*32} 72 18 18" fill="none">${body}<defs>${clips}</defs></svg>`);
}
for(const [name,prefix,x,y] of [['mail','M58.25 257.273',56,252.773],['lock','M62 320.023',56,311.773],['eye','M316.5 320.773',315,311.773]]){
    const original=[...login.matchAll(/<path\b[^>]*\/>/g)].map(match=>match[0]).find(value=>value.includes(`d="${prefix}`));
    if(!original)throw new Error(`Falta el icono original ${name}`);
    const circle=name==='eye'?(login.match(/<circle\b[^>]*cx="324"[^>]*\/>/)?.[0]||''):'';
    await save(`images/icons/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="${x} ${y} 18 18" fill="none">${original}${circle}</svg>`);
}
const logo = (await fs.readFile(path.join(root, 'design/logo.svg'), 'utf8')).replace(/<rect\b[^>]*\/>/, '');
const { data, info } = await sharp(Buffer.from(logo)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let x0=info.width,y0=info.height,x1=0,y1=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>0){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
const width=x1-x0+3,height=y1-y0+3;
await save('images/brand/logo.svg', logo.replace(/width="1024" height="1024" viewBox="0 0 1024 1024"/,`width="${width}" height="${height}" viewBox="${x0-1} ${y0-1} ${width} ${height}"`));
const images = [...home.matchAll(/<image\b[^>]*xlink:href="data:image\/[^;]+;base64,([^"]+)"[^>]*\/?\s*>/g)].map(v=>Buffer.from(v[1],'base64'));
if(images.length !== 3) throw new Error('Se esperaban tres fotografías originales del inicio.');
for(const [index,slug] of ['la-estacion','potrero-norte','club-5','el-galpon','la-redonda','punto-gol','tercer-tiempo'].entries()) {
    await save(`images/establishments/${slug}/main.avif`, await sharp(images[index%3]).resize({width:1000,withoutEnlargement:true}).avif({quality:65}).toBuffer());
}
const gallery = [...components.matchAll(/<image\b[^>]*xlink:href="data:image\/[^;]+;base64,([^"]+)"[^>]*\/?\s*>/g)].map(v=>Buffer.from(v[1],'base64'));
if(gallery.length)await save('images/establishments/la-estacion/cancha-1.avif',await sharp(gallery[0]).resize({width:1100,withoutEnlargement:true}).avif({quality:65}).toBuffer());
await save('images/placeholders/court.avif', await sharp(images[0]).resize({width:600,withoutEnlargement:true}).avif({quality:55}).toBuffer());
await fs.mkdir(path.join(root,'public/fonts'),{recursive:true});
const paymentId=components.match(/<g id="([^"]*Reservar y pagar[^"]*)"/)?.[1];
if(paymentId){
    const body=group(components,paymentId);
    const definitions=[];const seen=new Set();
    function includeRefs(content){for(const match of content.matchAll(/(?:url\(#|href="#)([^)"\s]+)/g)){const id=match[1];if(seen.has(id))continue;seen.add(id);const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const matchDef=components.match(new RegExp(`<((?:pattern|image|clipPath|linearGradient))\\b[^>]*id="${escaped}"[^>]*(?:/>|>[\\s\\S]*?</\\1>)`));if(matchDef){definitions.push(matchDef[0]);includeRefs(matchDef[0]);}}}
    includeRefs(body);
    let fontStyle='';try{const font=await fs.readFile(path.join(root,'public/fonts/inter.woff2'));fontStyle=`<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font.toString('base64')});font-weight:700;}text{font-family:Inter,sans-serif;}</style>`;}catch{}
    await save('images/brand/payment-demo.svg',`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="304" height="44" viewBox="24 1635.77 304 44">${fontStyle}${body}<defs>${definitions.join('')}</defs></svg>`);
}
// Las fuentes se incorporan manualmente o con fetch-fonts.mjs, nunca en runtime.
console.log('Recursos originales exportados y fotografías optimizadas.');
