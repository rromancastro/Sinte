'use client';
import Image from 'next/image';
import { useState } from 'react';
import { localImage,FALLBACK_IMAGE } from '@/lib/utils/media';
export const Photo=({src,alt,priority=false,sizes='(max-width: 600px) 140px, 240px',className=''})=>{
    const [failed,setFailed]=useState(false);
    return <Image className={className} src={failed?FALLBACK_IMAGE:localImage(src)} alt={alt} fill sizes={sizes} priority={priority} onError={()=>setFailed(true)} />;
};
