// A build passing cannot certify a place as visually complete.
export const REQUIRED_CHECKS=['frontages','accesses_and_steps','retaining_walls','terrain_connections','street_level_comparison','walkthrough'];
export function completionProblems(sector){
  const problems=[];
  for(const key of REQUIRED_CHECKS){
    const check=sector.checks?.[key];
    if(!check||!['verified','not_applicable'].includes(check.status))problems.push(key+': non verificato');
    else if(check.status==='not_applicable'&&!check.reason?.trim())problems.push(key+': manca motivazione');
    else if(check.status==='verified'&&(!check.evidence?.length||!check.reviewedAt))problems.push(key+': manca evidenza datata');
  }
  if(!sector.observations?.length)problems.push('inventario visivo assente');
  if(sector.visualAudit!=='complete')problems.push('audit visivo incompleto');
  return problems;
}
