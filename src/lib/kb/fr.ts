import type { KbLocale, KbText } from "./types";

// Platform menu names keep the English label in parentheses: we don't know the language of
// the owner's admin. Verify paths against each platform before launch.
const titleFixes: KbText["platformFixes"] = {
  wordpress:
    "Installez une extension SEO gratuite comme Yoast SEO ou Rank Math. Modifiez votre page d'accueil, descendez jusqu'au bloc de l'extension sous l'éditeur et remplissez le titre SEO (\"SEO title\"). Cliquez sur Mettre à jour.",
  wix: "Dans l'éditeur, ouvrez Pages et menu (\"Pages & Menu\"), cliquez sur ⋯ à côté de votre page d'accueil, choisissez Bases du SEO (\"SEO basics\") et modifiez le titre (\"Title tag\"). Publiez votre site.",
  shopify:
    "Dans l'administration Shopify, allez dans Boutique en ligne › Préférences (\"Online Store › Preferences\"), remplissez le titre de la page d'accueil (\"Homepage title\") et enregistrez.",
  squarespace:
    "Ouvrez Pages, survolez votre page d'accueil et cliquez sur l'icône d'engrenage. Dans l'onglet SEO, remplissez le titre SEO (\"SEO title\") et enregistrez.",
  webflow:
    "Dans le Designer, ouvrez le panneau Pages, survolez Home et cliquez sur l'engrenage. Dans les réglages SEO (\"SEO settings\"), remplissez le titre (\"Title tag\"), puis publiez.",
};

const descriptionFixes: KbText["platformFixes"] = {
  wordpress:
    "Avec Yoast SEO ou Rank Math installé, modifiez votre page d'accueil, descendez jusqu'au bloc de l'extension sous l'éditeur et remplissez la description (\"Meta description\"). Cliquez sur Mettre à jour.",
  wix: "Dans l'éditeur, ouvrez Pages et menu (\"Pages & Menu\"), cliquez sur ⋯ à côté de votre page d'accueil, choisissez Bases du SEO (\"SEO basics\") et modifiez la description (\"Meta description\"). Publiez votre site.",
  shopify:
    "Dans l'administration Shopify, allez dans Boutique en ligne › Préférences (\"Online Store › Preferences\"), remplissez la description de la page d'accueil (\"Homepage meta description\") et enregistrez.",
  squarespace:
    "Ouvrez Pages, survolez votre page d'accueil et cliquez sur l'icône d'engrenage. Dans l'onglet SEO, remplissez la description SEO (\"SEO description\") et enregistrez.",
  webflow:
    "Dans le Designer, ouvrez le panneau Pages, survolez Home et cliquez sur l'engrenage. Dans les réglages SEO (\"SEO settings\"), remplissez la description (\"Meta description\"), puis publiez.",
};

export const fr = {
  "seo.title.missing": {
    title: "Votre page n'a pas de titre pour les résultats de recherche",
    what: "Votre page d'accueil ne donne pas de titre aux moteurs de recherche : le titre bleu sur lequel on clique dans Google.",
    why: "Sans titre, Google en invente un à partir de votre page, souvent peu parlant.",
    businessImpact: "Moins de personnes cliquent sur votre site depuis Google.",
    fix: "Ajoutez un titre court qui dit ce que vous faites et où, par exemple « Boulangerie Rosa : pain frais à Lyon ».",
    platformFixes: titleFixes,
  },
  "seo.title.too-short": {
    title: "Le titre de votre page est très court",
    what: "Le titre de votre page est trop court pour dire ce que vous proposez.",
    why: "On choisit un résultat de recherche en une seconde. Un titre d'un seul mot comme « Accueil » ne donne aucune raison de vous choisir.",
    businessImpact: "Vous perdez des clics au profit de concurrents aux titres plus clairs.",
    fix: "Écrivez un titre de 30 à 60 caractères avec le nom de votre activité, ce que vous faites et où.",
    platformFixes: titleFixes,
  },
  "seo.title.too-long": {
    title: "Le titre de votre page est coupé dans Google",
    what: "Le titre de votre page est plus long que ce que Google affiche, et la fin est remplacée par « … ».",
    why: "Les mots qui donnent envie de vous choisir risquent d'être cachés.",
    businessImpact: "Les gens ne voient pas ce qui fait votre différence et cliquent ailleurs.",
    fix: "Gardez un titre de moins de 60 caractères et placez les mots les plus importants au début.",
    platformFixes: titleFixes,
  },
  "seo.meta-description.missing": {
    title: "Votre page n'a pas de résumé pour les résultats de recherche",
    what: "Votre page d'accueil ne fournit pas le court texte affiché sous votre titre dans Google.",
    why: "Google choisit alors un extrait au hasard de votre page, qui ne met pas forcément votre activité en valeur.",
    businessImpact: "Avec un résumé peu convaincant, moins de personnes choisissent votre site.",
    fix: "Écrivez une ou deux phrases (environ 120 à 160 caractères) sur ce que vous proposez et pourquoi vous choisir.",
    platformFixes: descriptionFixes,
  },
  "seo.meta-description.too-short": {
    title: "Le résumé de votre page dans Google est très court",
    what: "Le texte affiché sous votre titre dans Google est trop court pour être utile.",
    why: "Quelques mots ne disent ni ce que vous proposez, ni ce qui vous distingue.",
    businessImpact: "Les gens passent à un résultat qui en dit plus.",
    fix: "Allongez-le à une ou deux phrases (environ 120 à 160 caractères) avec votre service principal et votre ville.",
    platformFixes: descriptionFixes,
  },
  "seo.meta-description.too-long": {
    title: "Le résumé de votre page est coupé dans Google",
    what: "Le texte affiché sous votre titre est plus long que ce que Google montre.",
    why: "La fin est coupée, parfois au milieu de votre meilleur argument.",
    businessImpact: "Votre message arrive incomplet.",
    fix: "Gardez-le sous 160 caractères environ et dites l'essentiel en premier.",
    platformFixes: descriptionFixes,
  },
  "seo.h1.missing": {
    title: "Votre page n'a pas de titre principal",
    what: "Aucun titre de votre page n'est marqué comme titre principal.",
    why: "Les moteurs de recherche et les lecteurs d'écran s'en servent pour comprendre le sujet de la page.",
    businessImpact: "Google peut moins bien vous classer pour les services que vous proposez.",
    fix: "Ajoutez en haut de la page un titre clair qui dit ce que vous faites, et réglez-le sur « Titre 1 » (Heading 1) dans votre éditeur.",
  },
  "seo.h1.multiple": {
    title: "Votre page a plusieurs titres principaux",
    what: "Plusieurs titres de votre page sont marqués comme titre principal.",
    why: "Les moteurs de recherche et les lecteurs d'écran ne savent pas lequel représente le vrai sujet.",
    businessImpact: "Votre message est moins clair pour Google, ce qui peut nuire à votre classement.",
    fix: "Gardez un seul « Titre 1 » pour votre message principal et passez les autres en « Titre 2 ».",
  },
  "seo.headings.skipped-level": {
    title: "Vos titres sautent un niveau",
    what: "Vos titres sautent des niveaux, par exemple d'un titre principal directement à un titre de niveau 3.",
    why: "Les titres fonctionnent comme une table des matières. Les trous rendent la structure difficile à suivre.",
    businessImpact: "Les visiteurs qui utilisent un lecteur d'écran s'y perdent, et les moteurs de recherche comprennent moins bien votre page.",
    fix: "Utilisez les niveaux dans l'ordre : Titre 1, puis Titre 2, puis Titre 3. Choisissez le niveau selon la structure, pas selon la taille du texte.",
  },
  "seo.canonical.missing": {
    title: "Votre page n'indique pas son adresse principale",
    what: "Votre page n'indique pas aux moteurs de recherche quelle adresse web est la bonne.",
    why: "Une même page est souvent accessible par plusieurs adresses (avec ou sans « www », avec des codes de suivi). Google peut répartir votre classement entre elles.",
    businessImpact: "Votre page peut apparaître plus bas dans Google qu'elle ne le devrait.",
    fix: "La plupart des créateurs de sites le font automatiquement une fois votre domaine connecté. Sinon, demandez à votre développeur de définir l'adresse principale de votre page d'accueil.",
  },
  "seo.viewport.missing": {
    title: "Votre page risque de mal s'afficher sur téléphone",
    what: "Votre page ne demande pas aux téléphones de l'adapter à la taille de leur écran.",
    why: "Les téléphones affichent alors une version d'ordinateur minuscule qu'il faut agrandir avec les doigts.",
    businessImpact: "La plupart des visiteurs sont sur téléphone. Beaucoup partiront, et Google classe moins bien les pages mal adaptées aux mobiles.",
    fix: "Utilisez un thème ou un modèle adapté aux mobiles. Un développeur peut ajouter la ligne standard indiquée dans les détails techniques.",
  },
  "seo.open-graph.incomplete": {
    title: "Votre page est peu attrayante quand on la partage",
    what: "Il manque à votre page le titre, la description ou l'image utilisés quand quelqu'un partage votre lien.",
    why: "Sans eux, Facebook, WhatsApp et LinkedIn devinent, et affichent souvent un texte inadapté ou aucune image.",
    businessImpact: "Les liens partagés sont moins cliqués, et le bouche-à-oreille vous amène moins de visiteurs.",
    fix: "Dans les réglages de partage sur les réseaux sociaux de votre site, ajoutez un titre, une courte description et une image (1200 × 630 pixels conviennent bien).",
  },
  "seo.noindex": {
    title: "Votre page est cachée de Google",
    what: "Votre page demande aux moteurs de recherche de ne pas l'afficher dans leurs résultats.",
    why: "Ce réglage est souvent oublié après la création du site.",
    businessImpact: "Personne ne peut vous trouver sur Google.",
    fix: "Désactivez le réglage qui cache votre site des moteurs de recherche. Dans WordPress, décochez « Demander aux moteurs de recherche de ne pas indexer ce site » dans Réglages › Lecture. Ailleurs, cherchez « masquer des moteurs de recherche » ou « visibilité du site ».",
  },

  "technical.https.missing": {
    title: "Votre site n'est pas sécurisé (pas de cadenas)",
    what: "Votre site s'affiche sans le cadenas de sécurité (HTTPS) dans la barre d'adresse.",
    why: "Les navigateurs affichent « Non sécurisé », et ce que les visiteurs saisissent peut être lu par d'autres sur le même réseau.",
    businessImpact: "Les visiteurs perdent confiance et partent, surtout avant de remplir un formulaire ou de payer. Google classe aussi mieux les sites sécurisés.",
    fix: "Activez le certificat de sécurité gratuit proposé par votre hébergeur ou votre créateur de site, puis assurez-vous que tous les visiteurs arrivent sur l'adresse sécurisée.",
    platformFixes: {
      wordpress:
        "Dans le panneau de votre hébergeur, activez le certificat gratuit (souvent appelé SSL ou Let's Encrypt). Puis, dans WordPress, allez dans Réglages › Général et faites commencer les deux adresses par https://. Demandez à votre hébergeur d'envoyer tous les visiteurs vers l'adresse en https://.",
      wix: "Wix active le HTTPS pour vous. S'il est désactivé, ouvrez les paramètres de votre tableau de bord et cherchez « SSL » ou « HTTPS » pour l'activer. Un domaine connecté récemment peut demander jusqu'à 48 heures.",
      shopify:
        "Shopify inclut le HTTPS gratuitement. Allez dans Paramètres › Domaines (\"Settings › Domains\") et vérifiez l'état du certificat. S'il est en attente, vérifiez que votre domaine pointe vers Shopify comme indiqué sur cette page.",
      squarespace:
        "Squarespace inclut le HTTPS gratuitement. Ouvrez les paramètres, cherchez « SSL » et choisissez l'option sécurisée (\"Secure\"). Un domaine connecté récemment peut demander jusqu'à 72 heures.",
      webflow:
        "Ouvrez Site settings › Publishing, vérifiez que le SSL est activé dans les options de publication avancées (\"Advanced publishing options\"), puis republiez votre site.",
    },
  },
  "technical.status.error": {
    title: "Votre page renvoie une erreur",
    what: "Lors de notre visite, votre serveur a répondu par une erreur au lieu d'afficher votre page.",
    why: "Les moteurs de recherche peuvent retirer les pages qui renvoient des erreurs.",
    businessImpact: "Les visiteurs et Google risquent de voir un message d'erreur au lieu de votre activité.",
    fix: "Ouvrez votre site dans une fenêtre de navigation privée pour vérifier qu'il s'affiche. Sinon, contactez votre hébergeur ou votre développeur avec le code d'erreur indiqué dans les détails techniques.",
  },
  "technical.redirects.too-many": {
    title: "Votre adresse fait faire plusieurs détours aux visiteurs",
    what: "Avant d'arriver sur votre page d'accueil, les visiteurs passent par plusieurs autres adresses.",
    why: "Chaque détour ajoute du temps d'attente, surtout sur téléphone.",
    businessImpact: "Un démarrage plus lent fait abandonner plus de visiteurs avant l'affichage de votre page.",
    fix: "Faites aller chaque version de votre adresse directement vers l'adresse finale, en une seule étape. Votre hébergeur ou votre développeur peut modifier ces renvois.",
  },
  "technical.mixed-content": {
    title: "Des éléments de votre page sécurisée se chargent sans sécurité",
    what: "Votre page est sécurisée, mais certaines images ou certains fichiers se chargent depuis des adresses non sécurisées.",
    why: "Les navigateurs peuvent bloquer ces fichiers ou retirer le cadenas.",
    businessImpact: "Des parties de votre page peuvent ne pas s'afficher ou montrer des alertes de sécurité, ce qui nuit à la confiance.",
    fix: "Remplacez les fichiers listés par des adresses commençant par https://, ou importez-les à nouveau sur votre site. La liste est dans les détails techniques.",
  },
  "technical.headers.hsts.missing": {
    title: "Les navigateurs ne sont pas obligés d'utiliser la version sécurisée",
    what: "Votre site ne demande pas aux navigateurs de toujours s'y connecter de façon sécurisée.",
    why: "Quelqu'un qui tape votre adresse sans « https » peut se connecter brièvement sans sécurité.",
    businessImpact: "Une petite faille que les clients attentifs et les outils d'analyse de sécurité peuvent remarquer.",
    fix: "Demandez à votre hébergeur ou à votre développeur d'activer le réglage « toujours utiliser une connexion sécurisée ». La ligne exacte est dans les détails techniques.",
  },
  "technical.headers.csp.missing": {
    title: "Votre site n'a pas de protection supplémentaire contre le code malveillant",
    what: "Votre site n'indique pas aux navigateurs quelles sources de code et de contenu sont fiables.",
    why: "Cette protection limite les dégâts si quelqu'un parvient à glisser du code malveillant dans votre page.",
    businessImpact: "Si votre site est un jour piraté, vos visiteurs sont plus exposés.",
    fix: "Demandez à votre développeur d'ajouter une liste de sources fiables pour votre site et de la tester d'abord en mode « rapport uniquement », car une liste erronée peut casser une partie de la page.",
  },
  "technical.headers.frame-options.missing": {
    title: "D'autres sites peuvent afficher votre page dans la leur",
    what: "Votre site n'empêche pas d'autres sites d'afficher vos pages à l'intérieur des leurs.",
    why: "Des escrocs peuvent s'en servir pour faire cliquer vos visiteurs sur des boutons cachés.",
    businessImpact: "Votre marque pourrait servir à une arnaque à votre insu.",
    fix: "Demandez à votre hébergeur ou à votre développeur d'interdire aux autres sites d'intégrer le vôtre. C'est une ligne, indiquée dans les détails techniques.",
  },
  "technical.headers.content-type-options.missing": {
    title: "Les navigateurs peuvent deviner la nature de vos fichiers",
    what: "Votre site ne demande pas aux navigateurs d'arrêter de deviner le type des fichiers reçus.",
    why: "Deviner peut permettre à un fichier malveillant déguisé de s'exécuter.",
    businessImpact: "Une petite faille de sécurité, rapide à corriger.",
    fix: "Demandez à votre hébergeur ou à votre développeur d'ajouter le réglage d'une ligne indiqué dans les détails techniques.",
  },
  "technical.favicon.missing": {
    title: "Nous n'avons pas trouvé l'icône de votre site",
    what: "Votre page n'indique pas d'icône de site : la petite image affichée dans les onglets et les favoris.",
    why: "Les navigateurs trouvent parfois une icône à un emplacement standard que nous ne vérifions pas : votre site en a peut-être déjà une.",
    businessImpact: "Sans icône, votre site paraît moins soigné dans les onglets et sur l'écran d'accueil des téléphones.",
    fix: "Importez une image carrée (au moins 512 × 512 pixels) dans les réglages de votre site, souvent appelée « favicon » ou « icône du site ».",
  },
  "technical.robots-txt.missing": {
    title: "Votre site n'a pas de fichier d'instructions pour les moteurs de recherche",
    what: "Nous n'avons pas trouvé de fichier robots.txt : le petit fichier qui indique aux moteurs de recherche ce qu'ils peuvent visiter.",
    why: "Il n'est pas obligatoire, mais c'est l'endroit habituel pour indiquer aux moteurs de recherche la liste de vos pages.",
    businessImpact: "Les moteurs de recherche peuvent mettre plus de temps à découvrir toutes vos pages.",
    fix: "La plupart des créateurs de sites en créent un automatiquement. Sinon, demandez à votre développeur d'ajouter la version simple indiquée dans les détails techniques.",
  },
  "technical.sitemap.missing": {
    title: "Les moteurs de recherche ne trouvent pas la liste de vos pages",
    what: "Nous n'avons pas trouvé de plan du site (sitemap) : le fichier qui liste vos pages pour les moteurs de recherche.",
    why: "Un plan du site aide Google à trouver plus vite vos pages nouvelles ou modifiées.",
    businessImpact: "Vos nouveaux services ou pages peuvent mettre plus de temps à apparaître dans Google.",
    fix: "Activez le plan du site de votre créateur de site, puis ajoutez son adresse dans Google Search Console (gratuit).",
    platformFixes: {
      wordpress:
        "WordPress crée un plan du site automatiquement, et les extensions comme Yoast SEO ou Rank Math en créent un meilleur. Vérifiez que « Demander aux moteurs de recherche de ne pas indexer ce site » est décoché dans Réglages › Lecture, puis ajoutez l'adresse du plan dans Google Search Console.",
      wix: "Wix crée votre plan du site automatiquement une fois le site publié sur un domaine connecté. Utilisez la liste de configuration SEO de votre tableau de bord (\"SEO Setup Checklist\") pour connecter Google Search Console.",
      shopify:
        "Shopify crée votre plan du site automatiquement à l'adresse /sitemap.xml. Il ne fonctionne que si votre boutique n'est pas protégée par un mot de passe (\"Online Store › Preferences\"). Ajoutez l'adresse dans Google Search Console.",
      squarespace:
        "Squarespace crée votre plan du site automatiquement à l'adresse /sitemap.xml. Vérifiez que votre site est public et sans mot de passe, puis ajoutez l'adresse dans Google Search Console.",
      webflow:
        "Ouvrez Site settings › SEO, activez la création automatique du plan du site (\"Auto-generate sitemap\") et publiez. Ajoutez ensuite l'adresse dans Google Search Console.",
    },
  },

  "accessibility.img-alt.missing": {
    title: "Certaines images n'ont pas de description",
    what: "Certaines images n'ont pas de courte description textuelle (appelée texte alternatif).",
    why: "Les visiteurs aveugles qui utilisent un lecteur d'écran n'entendent rien pour ces images, et Google ne les comprend pas.",
    businessImpact: "Vous excluez certains clients et perdez des visiteurs venus de Google Images.",
    fix: "Ajoutez une courte description à chaque image utile, par exemple « Gâteau d'anniversaire au chocolat avec bougies ». Laissez sans description les images purement décoratives.",
    platformFixes: {
      wordpress:
        "Allez dans Médias › Bibliothèque, cliquez sur une image et remplissez « Texte alternatif ». Dans l'éditeur de page, vous pouvez aussi sélectionner un bloc image et remplir « Texte alternatif » dans le panneau latéral.",
      wix: "Dans l'éditeur, cliquez sur l'image, ouvrez ses paramètres et remplissez le champ qui demande ce que montre l'image (\"What's in the image?\"). Publiez votre site.",
      shopify:
        "Pour les images de produits, ouvrez le produit, cliquez sur l'image et choisissez « Ajouter un texte alternatif » (\"Add alt text\"). Pour les images du thème, ouvrez Boutique en ligne › Thèmes › Personnaliser et cherchez le champ de texte alternatif de l'image.",
      squarespace:
        "Modifiez la page, cliquez sur le bloc image et remplissez le champ de description ou de texte alternatif (\"alt text\") dans les réglages du bloc. Enregistrez.",
      webflow:
        "Ouvrez le panneau Assets, cliquez sur l'engrenage d'une image et remplissez « Alt text ». Vous pouvez aussi sélectionner une image sur la page et le régler dans le panneau Settings. Puis publiez.",
    },
  },
  "accessibility.form-label.missing": {
    title: "Certains champs de formulaire n'ont pas d'intitulé",
    what: "Certains champs de vos formulaires n'ont pas de nom que les lecteurs d'écran peuvent annoncer.",
    why: "Le texte grisé dans un champ disparaît pendant la saisie et ne remplace pas un vrai intitulé.",
    businessImpact: "Certains visiteurs ne peuvent pas remplir votre formulaire de contact ou de commande, et vous perdez des demandes.",
    fix: "Donnez à chaque champ un intitulé visible, comme « Adresse e-mail », dans votre éditeur de formulaire.",
  },
  "accessibility.link-name.missing": {
    title: "Certains liens n'ont pas de texte",
    what: "Certains liens, souvent des icônes ou des images, n'ont pas de texte qui dit où ils mènent.",
    why: "Les lecteurs d'écran disent simplement « lien », sans préciser à quoi il sert.",
    businessImpact: "Les visiteurs qui utilisent un lecteur d'écran peuvent manquer des pages clés comme votre boutique ou votre page de contact.",
    fix: "Ajoutez du texte à chaque lien, ou donnez aux liens en forme d'icône un nom comme « Instagram » ou « Panier ».",
  },
  "accessibility.button-name.missing": {
    title: "Certains boutons n'ont pas de texte",
    what: "Certains boutons, souvent des icônes, n'ont pas de texte qui dit ce qu'ils font.",
    why: "Les lecteurs d'écran disent simplement « bouton », sans dire ce qui va se passer.",
    businessImpact: "Certains visiteurs ne peuvent pas ouvrir votre menu, fermer une fenêtre ou envoyer un formulaire.",
    fix: "Ajoutez du texte à chaque bouton, ou donnez aux boutons en forme d'icône un nom comme « Ouvrir le menu » ou « Fermer ».",
  },
  "accessibility.lang.missing": {
    title: "Votre page n'indique pas sa langue",
    what: "Votre page ne déclare pas dans quelle langue elle est écrite.",
    why: "Les lecteurs d'écran peuvent la lire avec une mauvaise prononciation, et les moteurs de recherche peuvent la montrer au mauvais public.",
    businessImpact: "Certains visiteurs ne comprennent pas votre page, et vous touchez moins de personnes qui parlent votre langue.",
    fix: "Réglez la langue du site dans les paramètres de votre créateur de site. Un développeur peut l'ajouter en une ligne (voir les détails techniques).",
  },

  "performance.lcp.slow": {
    title: "Le contenu principal s'affiche lentement sur téléphone",
    what: "Sur un téléphone ordinaire, la plus grande partie de votre page (souvent l'image principale ou le titre) met trop de temps à apparaître.",
    why: "On juge un site en quelques secondes. Une page blanche ou à moitié chargée paraît cassée.",
    businessImpact: "Les visiteurs partent avant que votre page ne se charge, et Google classe moins bien les pages lentes.",
    fix: "Commencez par l'image du haut : réduisez-la et compressez-la, et évitez les grands diaporamas ou vidéos en haut de page.",
  },
  "performance.cls.high": {
    title: "Votre page bouge pendant le chargement",
    what: "Le texte et les boutons se déplacent pendant que les images, bannières ou polices se chargent.",
    why: "Les gens appuient au mauvais endroit ou perdent le fil de leur lecture.",
    businessImpact: "Les visiteurs agacés partent, et les appuis accidentels peuvent vous coûter des ventes.",
    fix: "Demandez à votre développeur de réserver la place des images et bannières pour que rien ne bouge. Évitez les fenêtres et bandeaux qui repoussent le contenu.",
  },
  "performance.interactivity.slow": {
    title: "Votre page réagit lentement",
    what: "Une fois la page affichée, elle met du temps à réagir quand on appuie ou qu'on tape.",
    why: "Les modules trop lourds occupent le téléphone, qui ne peut plus répondre.",
    businessImpact: "Votre site paraît lent et les visiteurs abandonnent.",
    fix: "Supprimez les extensions, applications, bulles de discussion et outils de suivi inutilisés. Chacun ajoute du travail au téléphone.",
  },
  "performance.first-paint.slow": {
    title: "Votre page reste blanche trop longtemps",
    what: "Sur un téléphone ordinaire, il faut un moment avant que quoi que ce soit n'apparaisse.",
    why: "Un écran blanc fait croire que le site ne fonctionne pas.",
    businessImpact: "Les visiteurs reviennent en arrière avant d'avoir vu votre activité.",
    fix: "Réduisez ce qui doit se charger en premier : moins d'extensions, de polices et de modules. Un hébergement plus rapide peut aussi aider.",
  },
  "performance.server.slow": {
    title: "Votre serveur met du temps à répondre",
    what: "Votre hébergement met longtemps à envoyer la première partie de votre page.",
    why: "Tout le reste de la page attend cette première réponse.",
    businessImpact: "Chaque visiteur attend plus longtemps, sur chaque page.",
    fix: "Activez l'option de vitesse ou de cache de votre hébergeur, ou passez à un hébergement plus rapide. Vous pouvez aussi demander à votre hébergeur d'où vient la lenteur.",
  },
  "performance.images.unoptimized": {
    title: "Vos images sont plus lourdes que nécessaire",
    what: "Certaines images sont plus grandes, en poids ou en dimensions, que ce dont votre page a besoin.",
    why: "Les images trop lourdes sont la cause la plus fréquente des sites lents, surtout en données mobiles.",
    businessImpact: "Les visiteurs attendent plus longtemps et consomment plus de données, et beaucoup partent.",
    fix: "Redimensionnez les images à leur taille d'affichage (rarement plus de 2000 pixels de large), compressez-les, et utilisez un format moderne comme WebP si votre outil le permet.",
    platformFixes: {
      wordpress:
        "Compressez les images avant de les importer (des outils gratuits comme Squoosh fonctionnent bien), ou installez une extension d'optimisation d'images qui les compresse et les convertit en WebP automatiquement.",
      wix: "Wix compresse les images pour vous : l'essentiel est la taille d'origine. Évitez les photos énormes et les grands GIF, et limitez le nombre d'images en haut de page.",
      shopify:
        "Shopify redimensionne les images, mais de grands originaux ralentissent quand même les pages. Compressez les grandes photos avant de les importer, et retirez de la page d'accueil les diaporamas avec beaucoup de grandes images.",
      squarespace:
        "Redimensionnez les images entre 1500 et 2500 pixels de large et compressez-les avant de les importer. Visez moins de 500 Ko par fichier.",
      webflow:
        "Ouvrez le panneau Assets et utilisez l'option pour compresser les images ou les convertir en WebP. Vérifiez que les grandes images plus bas dans la page se chargent en différé (\"Lazy\"), puis publiez.",
    },
  },
  "performance.render-blocking": {
    title: "Certains fichiers retardent l'affichage de votre page",
    what: "Certains fichiers doivent finir de se charger avant que votre page puisse s'afficher.",
    why: "L'écran reste blanc pendant que le téléphone les attend.",
    businessImpact: "Les visiteurs voient votre page plus tard, et certains partent.",
    fix: "Supprimez les extensions et applications inutilisées. Votre développeur peut charger les fichiers restants sans bloquer la page.",
  },
  "performance.unused-code": {
    title: "Votre page charge du code inutile",
    what: "Votre page télécharge du code dont elle n'a pas besoin.",
    why: "Ce code en trop prend du temps à télécharger et à traiter, surtout sur téléphone.",
    businessImpact: "Une page plus lente et plus lourde pour chaque visiteur.",
    fix: "Désinstallez les extensions, applications et widgets que vous n'utilisez plus. Votre développeur peut supprimer le code restant.",
  },
  "performance.text-compression": {
    title: "Vos fichiers ne sont pas compressés",
    what: "Votre serveur envoie les fichiers texte sans les réduire.",
    why: "La compression peut rendre ces fichiers plusieurs fois plus légers, gratuitement.",
    businessImpact: "Les pages se chargent plus lentement que nécessaire, surtout en données mobiles.",
    fix: "Activez la compression dans le panneau de votre hébergeur, ou demandez-lui de le faire. C'est en général un simple interrupteur.",
  },
  "performance.caching": {
    title: "Les visiteurs qui reviennent retéléchargent tout",
    what: "Votre site ne demande pas aux navigateurs de garder les fichiers déjà téléchargés.",
    why: "Les visiteurs qui reviennent téléchargent les mêmes images et fichiers à chaque fois.",
    businessImpact: "Vos clients fidèles ont un site plus lent à chaque visite.",
    fix: "Activez l'option de cache navigateur de votre hébergeur ou d'une extension de cache, ou demandez à votre hébergeur de la configurer.",
  },
  "performance.other": {
    title: "Une autre façon d'accélérer votre page",
    what: "Le test de vitesse de Google a trouvé autre chose qui ralentit votre page.",
    why: "Les petits délais s'additionnent, surtout sur téléphone.",
    businessImpact: "Un site plus lent fait partir plus de visiteurs avant qu'ils ne voient votre offre.",
    fix: "Envoyez les détails techniques à votre développeur. Ils montrent exactement ce que le test de Google a trouvé.",
  },

  "local.schema.missing": {
    title: "Google ne peut pas lire les informations de votre commerce",
    what: "Votre page n'inclut pas les informations de votre commerce (nom, adresse, téléphone, horaires) sous une forme que Google lit automatiquement.",
    why: "Google utilise ces informations pour afficher votre commerce dans les résultats locaux et sur les cartes.",
    businessImpact: "Vous apparaissez moins souvent quand les gens cherchent un commerce comme le vôtre à proximité.",
    fix: "Ajoutez les informations de votre commerce dans les réglages SEO ou « entreprise locale » de votre créateur de site, ou demandez à votre développeur d'ajouter le bloc des détails techniques. Complétez aussi votre fiche Google Business Profile gratuite.",
  },
  "local.phone.missing": {
    title: "Votre numéro de téléphone n'est pas cliquable",
    what: "Votre page n'a pas de lien pour appeler d'un simple appui.",
    why: "Sur téléphone, on s'attend à appuyer sur un numéro pour appeler. Le recopier est pénible.",
    businessImpact: "Vous perdez les appels de personnes prêtes à réserver ou à acheter.",
    fix: "Transformez votre numéro en lien pour que les téléphones proposent de l'appeler. La plupart des éditeurs permettent de lier un texte à un numéro de téléphone.",
  },
  "local.address.missing": {
    title: "Votre adresse n'est pas sur votre page d'accueil",
    what: "Nous n'avons pas trouvé votre adresse sur la page.",
    why: "Les clients du coin comme Google la cherchent pour savoir où vous êtes.",
    businessImpact: "Les gens risquent de ne pas venir, et Google peut hésiter à vous montrer dans les recherches locales.",
    fix: "Affichez votre adresse complète, par exemple en bas de page, écrite exactement comme sur votre fiche Google Business Profile.",
  },
  "local.hours.missing": {
    title: "Google ne peut pas lire vos horaires d'ouverture",
    what: "Vos horaires d'ouverture ne font pas partie des informations que Google lit.",
    why: "Google peut afficher vos horaires directement dans les résultats et sur les cartes.",
    businessImpact: "Des clients peuvent vous croire fermé, ou appeler pour demander au lieu de venir.",
    fix: "Ajoutez vos horaires aux informations de votre commerce (voir les détails techniques) et tenez-les à jour sur votre fiche Google Business Profile.",
  },
  "local.map.missing": {
    title: "Aucune carte n'aide les clients à vous trouver",
    what: "Votre page ne montre pas de carte et n'y renvoie pas.",
    why: "Une carte permet d'obtenir l'itinéraire d'un simple appui.",
    businessImpact: "Les clients qui ne vous trouvent pas facilement peuvent aller ailleurs.",
    fix: "Ajoutez une carte Google Maps ou un lien « Itinéraire » dans votre section contact.",
  },
} satisfies KbLocale;
