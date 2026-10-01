import { getCoffinData } from '@/lib/coffin-data';
export async function GET(_request: Request, {params}: {params: Promise<{slug:string}>}) {
  const data = await getCoffinData((await params).slug);
  if (!data) return Response.json({error:'Exhibit not found'}, {status:404});
  return Response.json(data, {headers:{'Cache-Control':'public, max-age=3600', 'X-Content-Type-Options':'nosniff'}});
}
