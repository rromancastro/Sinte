import './globals.scss';
export const metadata={
    metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),
    title:{default:'Sinte · Encontrá cancha rápido',template:'%s | Sinte'},
    description:'Encontrá canchas de fútbol 5, 7 y 11 disponibles en San Luis. Compará precios y consultá directamente por WhatsApp.',
    robots:process.env.SINTE_DEMO_MODE==='true'?{index:false,follow:false}:{index:true,follow:true},
    openGraph:{title:'Sinte · Encontrá cancha rápido',description:'Elegí ciudad, día, hora y tipo de cancha.',locale:'es_AR',type:'website'}
};
export default function RootLayout({children}){return <html lang='es-AR'><body>{children}</body></html>;}
