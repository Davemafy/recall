import PublicTrace from '../../components/PublicTrace';
export default async function TracePage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const params=await searchParams;
  return <PublicTrace initialInput={String(params?.q||'')}/>;
}
