import {ResultsView} from './ResultsView/ResultsView';
export const metadata={title:'Canchas disponibles',robots:{index:false,follow:true}};
export default async function SearchPage({searchParams}){return <ResultsView criteria={await searchParams}/>;}
