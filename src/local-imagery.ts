import {Credit,GeographicTilingScheme,Rectangle,SingleTileImageryProvider,UrlTemplateImageryProvider} from 'cesium';
// Cesium stretches the first imagery layer over the globe. A global neutral base
// lets the actual orthophoto remain clipped to its surveyed rectangle.
export function neutralBaseProvider(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const context=canvas.getContext('2d')!;context.fillStyle='#4d5a4e';context.fillRect(0,0,1,1);
  return new SingleTileImageryProvider({url:canvas.toDataURL(),tileWidth:1,tileHeight:1});
}
export async function localOrthoProvider(){
  const response=await fetch('/data/imagery/manifest.json');if(!response.ok)throw Error('Ortofoto locali non disponibili');
  const m=await response.json(),b=m.bounds,rectangle=Rectangle.fromDegrees(b.west,b.south,b.east,b.north);
  return new UrlTemplateImageryProvider({url:'/data/imagery/{z}/{x}/{y}.jpg',rectangle,
    tilingScheme:new GeographicTilingScheme({rectangle,numberOfLevelZeroTilesX:1,numberOfLevelZeroTilesY:1}),
    minimumLevel:0,maximumLevel:m.maximumLevel,tileWidth:m.tileSize,tileHeight:m.tileSize,
    credit:new Credit('Ortofoto 2024/2025: Regione Toscana · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>',true),
  });
}
