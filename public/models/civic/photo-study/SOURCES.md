# Municipio — facciata fotografica sperimentale

Variante approvata del 24 settembre 2026, ora predefinita. i vecchi parametri di confronto sono ignorati e la demo usa sempre questa facciata.

## Fotografie e licenza

Autore: **Massimiliano Galardi (Massimilianogalardi)**. Foto del **20 agosto 2011**,
pubblicate su Wikimedia Commons sotto **CC BY-SA 3.0**.

- [Municipio (Montemurlo) 10.jpg](https://commons.wikimedia.org/wiki/File:Municipio_(Montemurlo)_10.jpg): riferimento della facciata completa.
- [Municipio (Montemurlo) 01.jpg](https://commons.wikimedia.org/wiki/File:Municipio_(Montemurlo)_01.jpg): dettagli di persiane, intonaco e aperture.
- [Municipio (Montemurlo) 04.jpg](https://commons.wikimedia.org/wiki/File:Municipio_(Montemurlo)_04.jpg) e [09.jpg](https://commons.wikimedia.org/wiki/File:Municipio_(Montemurlo)_09.jpg): consultate per verifica, non inviate alla generazione della texture.
- [Licenza CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Le copie originali sono nella sottocartella `references/`, senza alterazioni.
`facade.png` è un adattamento di Resonance, con assistenza IA tramite lo strumento
integrato imagegen: raddrizzamento, ricostruzione delle occlusioni, rimozione di ombre,
vegetazione, cartelli, bandiere e balconi, uniformazione della luce. **Non è un semplice
ritaglio fotografico**: alcuni dettagli sono ricostruiti e possono differire dal reale.
Texture derivata distribuita **CC BY-SA 3.0**, con autore e modifiche indicati qui.
Anche il modello `../municipio-photo.glb` è offerto CC BY-SA 3.0 per questa variante;
la provenienza geografica OSM e gli obblighi sul database restano documentati in
`../SOURCES.md`. Questa nota non cambia la licenza del codice di gioco.

## Contenuto della prova

Sagoma geografica del municipio già presente, senza modifiche alle collisioni.
Facciata principale a undici campate: persiane, finestre, cornici, porte e intonaco
sono un'unica texture. Balconi, cornice del tetto, tetto e bandiera restano geometrici.
Fianchi e retro riutilizzano una campata: **interpretativi**, non documentati da foto
specifiche. Data della foto, colori rielaborati e dettagli generati non certificano
l'aspetto attuale del municipio.

Questa prova usa fotografie Wikimedia, **non immagini Google Street View** e non
texture estratte dalle Photorealistic 3D Tiles. Dimostra il metodo foto → texture →
modello semplice. Non dimostra una copertura fotografica uniforme di altre città.

Rigenerazione della geometria: `node scripts/build-photo-municipio.mjs`.
Prompt conservato in `PROMPT.txt`. La texture è salvata localmente e non viene
rigenerata all'avvio. Il pulsante di confronto ricarica la demo e la sessione.

## Peso misurato degli asset

| Variante | Triangoli | Gruppi di materiale | Download modello + texture |
|---|---:|---:|---:|
| Municipio precedente | 17.532 | 9 | circa 1,21 MiB |
| Facciata fotografica | 548 | 8 | circa 0,57 MiB |

La texture di runtime è `facade.jpg`, 2132 × 738, circa 540 KiB. Il PNG mantiene
il risultato generato originale, ma non viene caricato nel gioco. Le immagini
sorgenti non vengono caricate nella scena. La variante riduce i triangoli del 96,9%;
questo **non significa 96,9% di FPS in più**. La texture decodificata RGBA con mipmap
richiede indicativamente 8 MiB di memoria, variabili con il renderer. Nessun benchmark
FPS controllato ancora eseguito. Nessuna normal map in questa prima prova.
