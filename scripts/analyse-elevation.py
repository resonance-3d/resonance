"""Offline audit of Regione Toscana's 2010 1 m DTM; no game terrain is modified.
Dependencies: numpy, pyproj, matplotlib. Source ZIPs are retained with their licence.
"""
from pathlib import Path
import json, zipfile
import numpy as np
from pyproj import Transformer
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/elevation-research'
tr=Transformer.from_crs('EPSG:4326','EPSG:3003',always_xy=True,allow_ballpark=False)
rasters=[]
for tile in ['20j10','20j02']:
    path=OUT/'sources'/f'{tile}-dtm-2010.zip'
    with zipfile.ZipFile(path) as archive:
        name=next(n for n in archive.namelist() if n.endswith('.asc'))
        with archive.open(name) as f:
            header={}
            for _ in range(6):
                k,v=f.readline().decode().split();header[k]=float(v)
            values=np.loadtxt(f)
    assert values.shape==(int(header['nrows']),int(header['ncols']))
    rasters.append((tile,header,values))

def sample(lon,lat):
    x,y=tr.transform(lon,lat)
    for tile,h,a in rasters:
        c=round((x-h['xllcenter'])/h['cellsize'])
        r=round(h['nrows']-1-(y-h['yllcenter'])/h['cellsize'])
        if 1<=r<a.shape[0]-1 and 1<=c<a.shape[1]-1 and a[r,c]!=h['NODATA_value']:
            patch=a[r-1:r+2,c-1:c+2];patch=patch[patch!=h['NODATA_value']]
            return dict(tile=tile,dtm_height_m=round(float(a[r,c]),3),neighbourhood_3m_range=[round(float(patch.min()),3),round(float(patch.max()),3)])
    raise ValueError(f'No coverage at {lon}, {lat}')

points=[('Fronte municipio',11.03689,43.92705),('Piazza della Libertà',11.03684,43.92768),('Cortile scuola Capoluogo',11.03865,43.92921),('Strada a sud della scuola',11.03845,43.92894)]
features=[dict(type='Feature',geometry=dict(type='Point',coordinates=[lon,lat]),properties=dict(name=name,**sample(lon,lat),survey_year=2010)) for name,lon,lat in points]
(OUT/'sampled-heights.geojson').write_text(json.dumps(dict(type='FeatureCollection',source='Fonte dei dati: Regione Toscana – Rilievi LIDAR',license='CC BY 4.0',vertical_reference='Source geoid-related elevation; not WGS84 ellipsoidal height',features=features),indent=2)+'\n')

# Pixel-centre aligned crop, preserving the source's native 1 m resolution.
xs=np.arange(1663440.5,1663800.5,1);ys=np.arange(4865750.5,4866150.5,1)
X,Y=np.meshgrid(xs,ys);grid=np.full(X.shape,np.nan)
for tile,h,a in rasters:
    cols=np.rint((X-h['xllcenter'])/h['cellsize']).astype(int)
    rows=np.rint(h['nrows']-1-(Y-h['yllcenter'])/h['cellsize']).astype(int)
    ok=(cols>=0)&(cols<a.shape[1])&(rows>=0)&(rows<a.shape[0])
    candidates=a[rows[ok],cols[ok]]
    grid[ok]=np.where(candidates==h['NODATA_value'],np.nan,candidates)
assert np.isfinite(grid).all()
np.savez_compressed(OUT/'centre-dtm-2010.npz',x=xs,y=ys,height_m=grid.astype('float32'))

buildings=json.loads((ROOT/'public/data/montemurlo.json').read_text())['buildings']
x0,y0=tr.transform(11.03697,43.9272)
fig,axes=plt.subplots(1,2,figsize=(13,7),gridspec_kw={'width_ratios':[1.05,1]})
fig.patch.set_facecolor('#f7f6f1')
for ax in axes:
    ax.set_facecolor('#f7f6f1')
    im=ax.pcolormesh(X-x0,Y-y0,grid,cmap='terrain',shading='nearest',vmin=72,vmax=98,rasterized=True)
    ax.set_aspect('equal');ax.tick_params(labelsize=8)
    ax.set_xlabel('Metri verso est dal municipio',fontsize=9);ax.set_ylabel('Metri verso nord',fontsize=9)
    for building in buildings:
        pts=np.array([tr.transform(*p) for p in building['rings'][0]])
        if pts[:,0].max()<xs.min() or pts[:,0].min()>xs.max() or pts[:,1].max()<ys.min() or pts[:,1].min()>ys.max():continue
        ax.add_patch(Polygon(pts-[x0,y0],facecolor='#26384b22',edgecolor='#26384b',linewidth=.6))
    contours=ax.contour(X-x0,Y-y0,grid,levels=np.arange(70,103,1),colors='#314231',alpha=.45,linewidths=.45)
    ax.clabel(contours,fmt='%d m',fontsize=6)
axes[0].set(xlim=(-85,205),ylim=(-70,310),title='Municipio → scuola: quote del terreno')
axes[1].set(xlim=(-55,55),ylim=(-60,65),title='Dettaglio del centro — stato rilevato nel 2010')
for i,f in enumerate(features):
    x,y=tr.transform(*f['geometry']['coordinates']);h=f['properties']['dtm_height_m']
    for j,ax in enumerate(axes):
        if j==1 and i>1:continue
        ax.scatter([x-x0],[y-y0],s=30,c='#172d3a',edgecolor='white',zorder=8)
        dx,dy=((-60,18) if i==0 else (-70,12) if i==1 else (-95,28) if i==2 else (-80,-37))
        label=f['properties']['name'].replace('Piazza della Libertà','Piazza Libertà').replace('Cortile scuola Capoluogo','Cortile Capoluogo')
        ax.annotate(f'{label}\n{h:.1f} m',xy=(x-x0,y-y0),xytext=(dx,dy),textcoords='offset points',fontsize=8,weight='bold',bbox=dict(boxstyle='round,pad=.35',fc='#fffffff0',ec='#546777',lw=.6),arrowprops=dict(arrowstyle='-',color='#26384b'),zorder=9)
fig.suptitle('Resonance · verifica altimetrica di Montemurlo',fontsize=18,x=.06,ha='left',weight='bold')
fig.text(.06,.91,'DTM LiDAR 1 m · rilievo 2010 · quote indicative, precedenti alla riqualificazione della piazza',fontsize=10,color='#46565d')
fig.subplots_adjust(left=.065,right=.91,bottom=.22,top=.85,wspace=.28)
cax=fig.add_axes([.93,.22,.015,.52]);fig.colorbar(im,cax=cax,label='Quota del DTM (m)')
fig.text(.06,.055,'Fonte dei dati: Regione Toscana – Rilievi LIDAR · CC BY 4.0. Sagome: © OpenStreetMap contributors · ODbL.\nGriglia 1 m ≠ accuratezza 1 m. Trasformazione planimetrica disponibile: accuratezza dichiarata 4 m.\nLe quote sotto gli edifici sono interpolate: non rappresentano il pavimento. Gradini attuali da verificare separatamente.',fontsize=8,color='#46565d',linespacing=1.6)
fig.savefig(OUT/'elevation-audit.png',dpi=160,facecolor=fig.get_facecolor())
print(json.dumps(features,indent=2))
print('Transformation:',tr.get_last_used_operation().description,'accuracy_m:',tr.get_last_used_operation().accuracy)
