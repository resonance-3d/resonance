# Resonance — istruzioni permanenti per le ambientazioni

Prima di modificare terreno, edifici, strade, arredi o copertura geografica leggere
`docs/WORLD_RECONSTRUCTION.md` e il registro della zona in `docs/world-production/`.
Applicare quelle direttive anche alle correzioni piccole; le istruzioni esplicite più
recenti dell'utente prevalgono. Non aggiungere richieste di approvazione di routine.

- L'obiettivo è la riconoscibilità reale alla scala del personaggio, in terza persona.
- Conservare la modalità unica, la facciata del municipio approvata e lo spawn frontale.
- Scale, basamenti, pianerottoli, muri e accessi sono struttura, non decorazione facoltativa.
- Non sostituire geometrie già verificate con estrusioni generiche durante un'importazione.
- Registrare fonti/data, osservazioni, stime e parti sconosciute separatamente.
- Un test tecnico superato non dimostra fedeltà; confrontare viste reali e rendering.
- Non dichiarare completo un settore con accessi non verificati o inventario incompleto.
- Non incorporare credenziali, foto o dati senza averne verificato la provenienza e l'uso.
- Misurare ogni lotto: tempo, input/output, build, prestazioni e utilizzo account disponibile.
  Il consumo Codex è dell'account: differenze percentuali non sono token o costo per settore.
- Documentare lavoro residuo concretamente; non nasconderlo dietro la dicitura «procedurale».
- Eseguire `npm run audit:world`; prima di dichiarare completa l'intera area, usare anche
  `node scripts/check-world-quality.mjs --require-complete` e risolverne i rilievi.
