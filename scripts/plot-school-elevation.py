"""Render the regional terrain around Capoluogo and independent CTR spot heights."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
ROOT=Path(__file__).resolve().parents[1]
meta=json.loads((ROOT/'public/data/terrain/montemurlo-dtm.json').read_text());b=meta['bounds']
z=np.fromfile(ROOT/'public/data/terrain/montemurlo-dtm.bin',dtype='<u2').reshape(meta['height'],meta['width'])/100
lon=np.linspace(b['west'],b['east'],meta['width']);lat=np.linspace(b['north'],b['south'],meta['height'])
x=(lon-11.03865)*80150;y=(lat-43.92921)*111132
fig,ax=plt.subplots(figsize=(9,8));fig.patch.set_facecolor('#f5f4ed')
im=ax.pcolormesh(x,y,z,cmap='terrain',vmin=75,vmax=110,shading='nearest',rasterized=True)
cont=ax.contour(x,y,z,levels=[80,85,90,95,100,105,110],colors='#344e48',linewidths=.8)
ax.clabel(cont,fmt='%d m',fontsize=8)
ax.contour(x,y,z,levels=[100],colors='#bd452d',linewidths=2)
school=next(v for v in json.loads((ROOT/'public/data/montemurlo.json').read_text())['buildings'] if v['id']=='relation/3771891')
for i,ring in enumerate(school['rings']):
 p=np.array(ring);p=(p-[11.03865,43.92921])*[80150,111132]
 ax.add_patch(Polygon(p,fc='#ffffff88' if i==0 else '#75b785',ec='#142c3c',lw=1.4,zorder=4))
ax.scatter(0,0,c='#12283a',edgecolors='white',s=60,zorder=6)
ax.annotate('Cortile Capoluogo\nDTM: circa 89,7 m',xy=(0,0),xytext=(-120,-72),fontsize=11,weight='bold',bbox=dict(boxstyle='round,pad=.4',fc='white',ec='#12283a'),arrowprops=dict(arrowstyle='-',color='#12283a'),zorder=7)
points=json.loads((ROOT/'docs/elevation-research/school-ctr-spots.geojson').read_text())['features']
for p in points:
 h=p['properties']['height'];lon,lat=p['geometry']['coordinates'];xx=(lon-11.03865)*80150;yy=(lat-43.92921)*111132
 if not(-145<xx<150 and -90<yy<170):continue
 ax.scatter(xx,yy,c='#ba472f',s=28,edgecolor='white',zorder=6)
 ax.annotate(f'{h:.2f} m',xy=(xx,yy),xytext=(7,7),textcoords='offset points',fontsize=9,weight='bold',bbox=dict(boxstyle='round,pad=.15',fc='#ffffffe0',ec='none'),zorder=7)
ax.set(xlim=(-145,150),ylim=(-90,170),xlabel='Metri verso est dal cortile',ylabel='Metri verso nord dal cortile',aspect='equal')
ax.set_title('Scuola Capoluogo: quota assoluta e terreno circostante',fontsize=15,weight='bold',loc='left',pad=25)
fig.colorbar(im,ax=ax,pad=.025,shrink=.8,label='Quota regionale del terreno (m)')
fig.subplots_adjust(bottom=.21,top=.9,left=.1,right=.94)
fig.text(.1,.065,'Punto blu: campione DTM 2010. Punti rossi: quote indipendenti CTR 2000.\nCurva rossa: 100 m del DTM. Sagoma scuola: OpenStreetMap.\nFonte dei dati: Regione Toscana – Rilievi LIDAR (CC BY 4.0).\nCARTA TECNICA DELLA REGIONE TOSCANA, 20J02 (CC BY 3.0).\nDati storici: non certificano i pavimenti attuali. Allineamento planimetrico: accuratezza dichiarata 4 m.',fontsize=9,linespacing=1.5,color='#354947')
fig.savefig(ROOT/'docs/elevation-research/school-elevation-check.png',dpi=150,facecolor=fig.get_facecolor())
