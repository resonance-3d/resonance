"""Run a local build/import command and append measured resource usage. Never pass secrets."""
import sys,subprocess,time,resource,json,datetime,platform
from pathlib import Path
name=sys.argv[1];command=sys.argv[2:];start=time.perf_counter();before=resource.getrusage(resource.RUSAGE_CHILDREN)
result=subprocess.run(command);usage=resource.getrusage(resource.RUSAGE_CHILDREN)
record=dict(label=name,endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),command=command,exitCode=result.returncode,wallSeconds=round(time.perf_counter()-start,3),userCpuSeconds=round(usage.ru_utime-before.ru_utime,3),systemCpuSeconds=round(usage.ru_stime-before.ru_stime,3),peakChildRssBytes=int(usage.ru_maxrss if platform.system()=='Darwin' else usage.ru_maxrss*1024))
p=Path('docs/world-production/runs/commands.jsonl');p.parent.mkdir(parents=True,exist_ok=True)
with p.open('a') as f:f.write(json.dumps(record)+'\n')
print(json.dumps(record));sys.exit(result.returncode)
