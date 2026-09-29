# Direttive permanenti — ricostruzione di Resonance

Richieste da Fabrizio il 24 settembre 2026. Ambito iniziale: cerchio di raggio
1.000 m centrato sul municipio, circa 3,142 km². Il raggio non equivale a un'area di 1 km².

## Risultato richiesto

Esterni contemporanei riconoscibili dagli abitanti, percorribili in terza persona.
Geometria semplice dove possibile, facciate in texture dove documentabili; balconi,
portici, scale e sagome che cambiano il percorso o la silhouette restano volumetrici.
Conservare terreno reale, scala metrica (robot circa 1,75 m), spawn e unica modalità.
Alternative medievale/futuristica restano annotate, non autorizzano a inventare il presente.

## 1. Preparare il settore prima di modellarlo

- Delimitare area, edifici e percorsi: identificativi stabili, coordinate e vicini.
- Consultare veduta dall'alto e viste a terra; registrare URL, autore/ente, data di ripresa
  quando disponibile (distinta dalla pubblicazione), uso consentito e copertura.
- Confrontare epoche: una facciata 2011, un DTM 2010 e un parco 2023 non sono un unico rilievo.
- Foto Google/Street View, se consultate, non sono automaticamente asset redistribuibili
  o una licenza per estrazione/derivazione. Verificare le condizioni della fonte per l'uso
  concreto. Preferire dati regionali aperti, foto autorizzate e riferimenti comunali.
- Per ciascun elemento assegnare: osservato / derivato da misura / stimato / sconosciuto.
  La mancata visibilità non dimostra l'assenza di un oggetto.
- Non dedurre un numero esatto di gradini dal solo DTM. Non dedurre altezze dei palazzi
  da quote assolute sul mare. Segnalare occlusioni, retro e fianchi non documentati.

## 2. Inventario visivo obbligatorio

Per ogni edificio e spazio pubblico verificare esplicitamente:

1. Sagoma, orientamento, corpo principale, annessi, numero di piani e forma del tetto.
2. Fronte strada, ingressi e portoni, balconi, logge, portici e passaggi coperti.
3. Rapporto edificio-suolo: basamento, soglie, marciapiedi, cortili e recinzioni.
4. Tutte le scale: frontali, laterali, gradonate ampie, gradini di soglia, pianerottoli,
   rampe alternative, muretti di contenimento e parapetti osservati.
5. Quote: mare/geoidiche vs ellissoidiche, pendenze continue vs terrazze orizzontali.
6. Strade: carreggiata, incroci, attraversamenti, cordoli, spartitraffico, parcheggi,
   pavimentazioni, accessi pedonali e percorsi interrotti.
7. Verde/arredi: aiuole, alberi rilevanti, sedute, lampioni, monumenti e fontane.
8. Raccordo ai settori confinanti, accessi alle destinazioni e ostacoli al personaggio.

Ogni voce deve riportare un riferimento o «non verificata / non applicabile motivato».
Un elenco generato dai soli tag OSM è inventario geografico, non inventario visivo completo.

## 3. Ordine di costruzione

Terreno e quote di controllo → terrazze/basamenti → scale, rampe e muri → strade e
marciapiedi → volumi edilizi e tetti → facciate → balconi/portici → arredi e vegetazione.
Ricostruire un sistema continuo edificio-accessi-piazza; evitare pezzi aggiunti senza
raccordo. Nei luoghi già curati prevalgono gli override verificati sul dato generico.
Tutte le stime vanno mantenute modificabili in dati, evitando coordinate disperse nel codice.

## 4. Movimento e rendering devono concordare

Un'unica definizione geometrica per quote del suolo e collisioni client/server. Gradini
orizzontali con alzate visibili; incassare il terreno sotto i manufatti senza buchi ai bordi.
Verificare salita/discesa, accessi dei portoni, muretti, cortili, camera e raccordi.
Non usare solo texture per ostacoli o dislivelli. Non abbassare/rialzare edifici indiscriminatamente.
Geometrie leggere, materiali condivisi, LOD e caricamento locale; niente dettagli minuscoli
in mesh se non contribuiscono alla riconoscibilità. Nessuna nuova modalità di confronto nella demo.

## 5. Verifica prima di chiamare un settore completo

- Confronto con riferimenti da almeno una vista frontale e una obliqua/a terra, più pianta.
- Controllare inventario intero: test e build non scoprono una scalinata dimenticata.
- Percorrere gli itinerari essenziali; controllare porte, attraversamenti e dislivelli.
- Nessun modello duplicato, fondazione flottante, terreno affiorante o superfici tremolanti.
- Build e test pertinenti; prove di regressione sul municipio già approvato.
- Misure locali FPS/p95 con viewport, fase di caricamento, posizione e data registrate.
- Registrare esito e limitazioni. «Base geografica», «bozza», «verificato» sono stati distinti.
  Il completamento richiede riferimenti e verifiche, non solo presenza di geometrie.

## 6. Misurazioni della produzione

Per ogni sessione: inizio/fine UTC, area e numero di elementi effettivamente lavorati,
fonti scaricate e byte, durata dei comandi pesanti, dimensioni degli asset, test, prestazioni.
Quando disponibile registrare l'utilizzo Codex all'inizio e alla fine nella stessa finestra:

delta in punti percentuali = percentuale usata finale − iniziale.

La misura è arrotondata e condivisa con altri task. Se avviene un reset la differenza
non è confrontabile. Non usare crediti di reset senza richiesta esplicita. Non stimare
consumo del chilometro completato da una lavorazione parziale. Le ore umane, i token,
il costo API, il tempo CPU e gli FPS sono grandezze diverse; indicare «non disponibile»
quando il sistema non fornisce la misura. Riportare separatamente infrastruttura e contenuti.

## 7. Espansione per settori

Settori indicativi 200 × 200 m, selezionati per intersezione con il cerchio. Conservare
un margine esterno per edifici e strade al bordo; il conteggio dell'obiettivo usa il cerchio.
Lavorare dal centro verso l'esterno e lungo percorsi continui, senza cancellare i dettagli
approvati. Non attribuire a tutto il chilometro il livello qualitativo del solo municipio.

## Controllo automatico dello stato

`npm run audit:world` controlla che un settore dichiarato verificato abbia evidenze datate per tutte le voci obbligatorie. `node scripts/check-world-quality.mjs --require-complete` fallisce finché restano settori incompleti. Non cambiare lo stato per far passare il comando: completare prima il lavoro e allegare le evidenze. Il generatore di inventario conserva i controlli per i settori invariati e richiede una nuova verifica quando i dati cambiano.
