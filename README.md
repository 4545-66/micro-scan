# Micro Scan

Appli caméra pour cadrage manuel + analyse macro d'échantillons (avec clip
microscope smartphone 100x–300x). Analyse indicative, pas un diagnostic.

## Structure

```
micro-scan/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── components/
│       └── MicroScanScreen.jsx   ← écran caméra + résultat
└── public/
    ├── icon-192.png              ← à ajouter
    ├── icon-512.png              ← à ajouter
    └── icon-512-maskable.png     ← à ajouter
```

## Publier ce projet (flux habituel : GitHub → Netlify → PWABuilder)

### 1. Pousser sur GitHub (depuis le téléphone)

- Crée un nouveau dépôt sur GitHub, nom suggéré : `micro-scan`
- Ajoute tous les fichiers de ce dossier dans le dépôt (via l'app GitHub
  ou l'interface web GitHub — upload de fichiers si pas de terminal git)

### 2. Connecter à Netlify

- Sur Netlify : "Add new site" → "Import an existing project" → choisir
  le dépôt `micro-scan`
- Build command : `npm run build`
- Publish directory : `dist`
- Déployer

### 3. Avant de publier sur le Play Store — 3 icônes manquantes

Il faut ajouter dans `public/` :
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512, avec marge de sécurité pour le
  masquage adaptatif Android)

Même étape que pour Sou par Sou — tu peux réutiliser ton procédé habituel
pour générer ces 3 PNG.

### 4. PWABuilder

Une fois le site Netlify en ligne (ex: `micro-scan-xxxx.netlify.app`) :
- Va sur pwabuilder.com
- Colle l'URL Netlify
- Génère le package Android (TWA)
- Publie sur Google Play Store

## Prochaines étapes techniques (pas encore faites)

- [ ] Brancher la vraie caméra du téléphone (API `getUserMedia`) —
      pour l'instant le viseur est une texture simulée
- [ ] Logique d'analyse d'image réelle (formes, couleurs, textures)
      une fois le clip microscope reçu et testé
- [ ] Bibliothèque de référence (images annotées) pour comparaison
