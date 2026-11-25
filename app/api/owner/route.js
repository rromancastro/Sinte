import { ownerIdentity,limitRequest,assertOrigin,readBody,json,failure } from '@/lib/services/http';
import { ownerData,ownerMutation } from '@/lib/services/owner';
import { dateInRange } from '@/lib/validations';
export const runtime='nodejs';
export async function GET(request){try{limitRequest(request,'owner',60);const identity=await ownerIdentity(request);return json(await ownerData(identity,dateInRange(new URL(request.url).searchParams.get('date'))));}catch(error){return failure(error);}}
export async function POST(request){try{assertOrigin(request);limitRequest(request,'owner-write',90);const body=await readBody(request);const identity=await ownerIdentity(request);return json(await ownerMutation(identity,body));}catch(error){return failure(error);}}
