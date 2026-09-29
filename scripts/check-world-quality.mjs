import fs from 'node:fs';
import {completionProblems} from '../shared/world-quality.mjs';
const manifest=JSON.parse(fs.readFileSync('public/data/world/manifest.json'));
let invalid=0,complete=0;
for(const sector of manifest.sectors){
 const problems=completionProblems(sector);
 if(!problems.length)complete++;
 if(sector.status==='verified'&&problems.length){invalid++;console.error(sector.id,problems.join('; '));}
}
console.log(`${complete}/${manifest.sectors.length} settori verificati; ${manifest.sectors.length-complete} da completare.`);
console.log('Base geografica presente ≠ fedeltà visiva completa.');
if(invalid||(process.argv.includes('--require-complete')&&complete!==manifest.sectors.length))process.exitCode=1;
