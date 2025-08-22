# Accessibilité

## Référentiel Choisi

**RGAA 4.1** - Choisi pour :

- Connaissance personnelle (déjà utilisé professionnellement)
- Basé sur WCAG 2.1 (standard international)
- Parce qu'il fallait bien un référentiel

## Actions Mises en Œuvre

- Textes alternatifs sur images (`alt="Logo Sortir - Retour à l'accueil"`)
- Navigation clavier fonctionnelle (`tabindex`, `aria-selected`)
- Structure sémantique (`h1`, `h2`, landmarks ARIA)
- Applications des aria-label ou title
- Des icones sont ignorées par le lecteur des écrans avec aria-hidden
- Contraste suffisant (DaisyUI conformes)
- Zoom 200% sans perte d'information
- Navigation cohérente entre pages

**Outils :**

- Axe Accessibility Linter dans VScode
- Test avec l'extension Lighthouse
- Interface responsive (DaisyUI)
- La liste des critères qui est disponible ici : https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/
