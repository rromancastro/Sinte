import {OwnerAuth} from './OwnerAuth/OwnerAuth';
export const metadata={title:'Propietarios',robots:{index:false,follow:false}};
export default function OwnerLayout({children}){return <OwnerAuth>{children}</OwnerAuth>;}
