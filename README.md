# Société Iftin — Site vitrine

Site vitrine one-page pour Société Iftin (SARL Import Export, Djibouti, Est. 1990),
spécialisée dans l'export de bétail (dromadaires, bovins, caprins, ovins).

## Structure

```
index.html        Page unique (accueil, présentation, galerie, contact)
css/style.css      Styles
js/i18n.js         Traductions (FR / EN / AR / SO / AM)
js/main.js         Comportements (nav, scroll reveal, langue, formulaire)
images/            Logos + visuels (photos des animaux à ajouter)
audio/             Présentation audio à ajouter (voir ci-dessous)
```

## À compléter plus tard

- **Photos des animaux** : remplacer les blocs "Photo à venir" dans la section
  galerie (`index.html`, classes `card__photo--camel/cattle/goat/sheep/logistics`)
  par de vraies images (idéalement format 4:3, ~1200px de large).
- **Audio de présentation** : déposer le fichier dans `audio/presentation-fr.mp3`
  (le lecteur est déjà en place dans la section "La société"). Prévoir une
  version par langue si besoin (`presentation-en.mp3`, etc.), à brancher dans
  `index.html` et `js/main.js` selon la langue active.
- **Footer KLIK** : à intégrer dans la balise `<footer>` de `index.html`
  (commentaire déjà présent à l'endroit prévu).

## Formulaire de contact

Le site est 100% statique (pas de serveur). Le formulaire ne peut donc pas
envoyer un email automatiquement en arrière-plan : au clic sur "Envoyer par
email", il ouvre le client mail par défaut du visiteur avec le message
pré-rempli (`mailto:`) ; au clic sur "Envoyer par WhatsApp", il ouvre WhatsApp
Web/App avec le message pré-rempli (`wa.me`). Le visiteur doit cliquer sur
Envoyer dans son client mail / WhatsApp pour finaliser.

Pour un envoi automatique côté serveur (sans action du visiteur), il faudrait
un petit backend ou un service tiers (Formspree, EmailJS, etc.) — possible à
ajouter plus tard si besoin.

## Langues

5 langues disponibles via la bulle en bas à droite : Français, English,
العربية (RTL), Soomaali, አማርኛ.
