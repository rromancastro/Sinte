import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('Firebase carga y JWKS resuelve claves sin require(ESM), como en Vercel',()=>{
    const result=spawnSync(process.execPath,['--no-experimental-require-module','--input-type=module'],{
        encoding:'utf8',timeout:15000,input:`
            import assert from 'node:assert/strict';
            import {createRequire} from 'node:module';
            import {generateKeyPairSync,sign,verify} from 'node:crypto';
            await import('firebase-admin/auth');
            await import('firebase-admin/firestore');
            const require=createRequire(import.meta.url);
            const jwks=require('jwks-rsa');
            const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
            const client=new jwks.JwksClient({jwksUri:'https://unused.invalid'});
            client.getKeys=async()=>[{...publicKey.export({format:'jwk'}),kid:'test',alg:'RS256',use:'sig'}];
            const keys=await client.getSigningKeys();
            assert.equal(keys.length,1);
            const message=Buffer.from('prueba de compatibilidad');
            const signature=sign('RSA-SHA256',message,privateKey);
            assert.equal(verify('RSA-SHA256',message,keys[0].getPublicKey(),signature),true);
            assert.equal(verify('RSA-SHA256',Buffer.from('mensaje alterado'),keys[0].getPublicKey(),signature),false);
        `
    });
    assert.equal(result.status,0,result.stderr||result.error?.message);
});
