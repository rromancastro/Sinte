import fs from 'node:fs/promises';
import path from 'node:path';
const destination=path.resolve(import.meta.dirname,'../public/fonts');
await fs.mkdir(destination,{recursive:true});
for(const family of ['Inter','Montserrat']) {
    const response=await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700;800;900&display=swap`,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}});
    if(!response.ok)throw new Error(`No se pudo obtener ${family}`);
    const css=await response.text();
    const match=[...css.matchAll(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\((https:[^)]+)\)/g)].at(-1);
    if(!match)throw new Error('No se encontró la fuente variable.');
    const font=await fetch(match[2]);if(!font.ok)throw new Error('No se pudo descargar la fuente');
    await fs.writeFile(path.join(destination,`${family.toLowerCase()}.woff2`),Buffer.from(await font.arrayBuffer()));
    const license=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family.toLowerCase()}/OFL.txt`);
    if(!license.ok)throw new Error('No se pudo obtener la licencia de la fuente.');
    await fs.writeFile(path.join(destination,`${family.toLowerCase()}-OFL.txt`),await license.text());
}
console.log('Fuentes guardadas localmente.');
