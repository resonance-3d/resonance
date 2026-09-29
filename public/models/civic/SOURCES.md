# Resonance — campione del centro di Montemurlo

Studio geometrico originale, 22 settembre 2026. Non è una scansione, un rilievo
architettonico o una ricostruzione certificata dello stato attuale.

## Elementi e provenienza

- **Municipio**: sagoma OSM `way/282884818`, mantenuta nel modello e nelle
  collisioni. Due piani, undici campate della facciata principale, persiane,
  cornici, due balconi, copertura a padiglione e bandiera: studio visivo da
  [Catalogo generale dei Beni Culturali, scheda 0901333267](https://catalogo.beniculturali.it/detail/ArchitecturalOrLandscapeHeritage/0901333267).
  Altezza di gronda 8,6 m e colmo 10,85 m **stimati**, non misurati.
  Fronti laterali semplificati, retro non documentato; nessun interno.
- **Casa affacciata sulla piazza**: sagoma OSM `way/282884592`, tre livelli,
  due balconate e tre aperture per piano, sulla base del prospetto visibile
  nei riferimenti comunali del 2020 citati sotto. Abbinamento del prospetto alla
  sagoma interpretato dalla posizione; quota di gronda 9,8 m stimata.
  Fianchi e retro semplificati, da validare nel confronto con il luogo.
- **Fronte nord della piazza, estensione**: tre ulteriori sagome OSM interpretate
  dalle fotografie comunali del 2020 dello stesso comunicato:
  - `way/282884503`, **casa bianca**: basamento scuro con vetrine, tapparelle
    marroni, piccolo balcone centrale e coperture sfalsate. Gronde 7,25–8,5 m stimate.
  - `way/282884494`, **casa d'angolo**: intonaco chiaro, serramenti verdi e
    balconata sui fronti rivolti verso lo spazio pubblico. Gronda 7,05 m stimata.
  - `way/282884764`, **casa ocra**: fronte a due piani, negozi e balconata,
    copertura in cotto. Gronda 7,3 m stimata.
  Abbinamento foto/sagoma **interpretativo e da validare**, in particolare per
  il fronte ocra più distante. Aperture, quote, falde, retro e fianchi non sono
  rilevati; insegne commerciali e dipinti non riprodotti. Non sono modelli
  ottenuti automaticamente dalle immagini né fotogrammetria.
- **Piazza della Libertà**: perimetro OSM `way/934962881`. Colonnato in mattoni,
  travi chiare e sei sedute/fioriere circolari ispirati agli elementi documentati
  dal Comune nelle fotografie e nel comunicato del 18 novembre 2020:
  [Comune di Montemurlo / pubblicazione gonews.it](https://www.gonews.it/2020/11/18/montemurlo-nuovi-arredi-in-piazza-della-liberta/).
  Posizioni, numero di colonne, dimensioni, materiali e vegetazione **approssimati**;
  i riferimenti del 2020 non provano l'aspetto preciso del 2026.
- **Piazza della Repubblica**: ampliamento visivo del percorso pedonale OSM
  `way/152974918` a 12 m (larghezza stimata), sulla base della trasformazione
  descritta nel [comunicato comunale del 2021](https://met.cittametropolitana.fi.it/news.aspx?n=343064).
  Sagoma completa della piazza e scalinata non ancora ricostruite.
- **Sala Banti e quartiere circostante**: restano i volumi della base OSM e il
  trattamento generico precedente, senza rivendicazione di fedeltà fotografica.

Le fotografie sono state consultate come riferimenti dell'edificio e degli arredi:
non sono incluse, ritagliate o redistribuite come texture. La licenza CC-BY 4.0
indicata dal Catalogo riguarda i metadati; le immagini hanno etichetta BCS,
che non va confusa con una licenza aperta sulle fotografie.
Le geometrie geografiche provengono da © OpenStreetMap contributors, ODbL:
https://www.openstreetmap.org/copyright — il database sorgente è /data/montemurlo.json.

## Comportamento della demo

- Municipio e quattro case sostituiscono le rispettive sagome Cesium/OSM, mantenendo lo stesso
  perimetro per le collisioni. Se il modello non si carica, resta il volume base.
- Modelli locali leggeri, geometrie accorpate per materiale, senza nuove API o
  abbonamenti. Gli arredi sono visibili entro 650 m; i cinque edifici entro 2.500 m.
- Quota campionata sul terreno Cesium per ogni collocazione; singolo basamento
  rigido per il municipio. Nessuna correzione artificiale del terreno globale.
- Sedute e pilastri hanno collisioni condivise tra client e server. Il confronto
  visivo disattiva i dettagli, conservando le collisioni dell'istanza multiplayer.
- Il pulsante Municipio/Piazza sposta solo la telecamera. “Prendi il controllo”
  oppure M torna al personaggio, senza teletrasportarlo.

Rigenerazione dei modelli: `node scripts/build-civic.mjs`.
Restano da verificare con dati più recenti le quote assolute, i dettagli delle
facciate, la collocazione degli arredi e l'estensione dell'area pavimentata.
Nessun dataset regionale o ortofoto è stato ancora importato.

## Strade e costo grafico — seconda prova

Asfalto e verde usano colori opachi senza rumore raster ad alta frequenza.
Le fughe della pavimentazione sono calcolate nello shader con antialiasing
tramite derivate dello schermo e scompaiono gradualmente sotto la dimensione
utile di un pixel. Non occorrono immagini a risoluzione maggiore né download.
FXAA attivo, MSAA invariato a 2 campioni e limite di rendering invariato
(1600 × 900, senza sovracampionamento del display Retina).
I tre nuovi modelli aggiungono circa 330 kB, 21 gruppi di materiale complessivi.
Non ci sono ombre dinamiche aggiuntive. La fluidità dipende comunque da GPU,
finestra, visuale, streaming e numero di client aperti.

## Street View e altri riferimenti

La variante originale descritta sopra non usa immagini Google. La successiva
prova opzionale `?piazza=studio` consulta Street View: provenienza e limiti sono
documentati separatamente in [STUDY.md](STUDY.md). Le
[linee guida Google, sezione Street View](https://about.google/brand-resource-center/products-and-services/geo-guidelines/)
vietano esplicitamente la creazione di dati dalle immagini mediante
digitalizzazione o tracciamento. La realtà fisica di un edificio non elimina
le condizioni di accesso al servizio; la liceità di una specifica consultazione
non va confusa con un permesso generale di ricostruzione sistematica.

[Mapillary pubblica immagini CC BY-SA](https://help.mapillary.com/hc/en-us/articles/115001770409-CC-BY-SA-license-for-open-data),
con obblighi di attribuzione e licenza da rispettare per gli usi pertinenti.
Nel controllo del 22 settembre 2026 è stata visualizzata una sequenza di
changchun1 del 27 giugno 2016 nel parco a ovest del municipio
(immagine 797186131157807): non documenta adeguatamente questi prospetti
né la sistemazione recente della piazza. Nessun asset Mapillary integrato.
Non si afferma che non esistano altre sequenze nell'area.

### Controllo locale della fluidità (22 settembre 2026)

Browser di prova, finestra 1280 × 720, personaggio fermo alla partenza,
streaming caricato, pannello impostazioni aperto, due client nell'istanza.
Brevi letture del contatore su finestre di due secondi: FXAA attivo 100–101 fps,
disattivo 103 fps; p95 11 ms in entrambi i casi. Nessuna variazione della camera
tra le letture. È una verifica indicativa del costo del filtro, non un benchmark
GPU né una garanzia durante movimento, caricamento o su altri dispositivi.
La precedente lettura di 51–54 fps aveva tre client attivi: non la usiamo per
attribuire un aumento di prestazioni a questa modifica.
