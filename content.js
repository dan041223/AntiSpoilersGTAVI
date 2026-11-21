
const CONFIG = {
    keywords: [
        /\bGTA\s*6\b/i,
        /\bGTA\s*VI\b/i,
        /\bGTA\s*Ⅵ\b/i,
        /\bGrand\s*Theft\s*Auto\s*6\b/i,
        /\bGrand\s*Theft\s*Auto\s*VI\b/i
    ]
};

// Detectar el idioma del navegador.
const LANGUAGE = navigator.language.toLowerCase().startsWith('es')
    ? 'es'
    : 'en';

// Textos de la extensión.
const TEXTS = {
    es: {
        warningTitle: 'SPOILER GTA VI',
        warningSubtitle: 'Posible contenido del juego',
        revealButton: 'Mostrar vídeo',
        protectedTitle: 'Contenido protegido por spoiler'
    },
    en: {
        warningTitle: 'GTA VI SPOILER',
        warningSubtitle: 'Potential game content',
        revealButton: 'Show video',
        protectedTitle: 'Content hidden to prevent spoilers'
    }
};

const TEXT = TEXTS[LANGUAGE];

// Cada tarjeta se desbloquea de manera independiente.
const processedCards = new WeakSet();

function containsGTA6(title) {
    return CONFIG.keywords.some(regex => regex.test(title));
}

// Obtiene el título utilizando la estructura nueva y la antigua.
function getTitleElement(card) {
    return card.querySelector([
        '.ytLockupMetadataViewModelTitle',
        '.shortsLockupViewModelHostOutsideMetadataEndpoint',
        '#video-title',
        'a#video-title-link'
    ].join(','));
}

function getVideoTitle(card) {
    const element = getTitleElement(card);

    return element?.textContent?.trim() || '';
}

// Obtiene el enlace que contiene la miniatura.
function getThumbnailLink(card) {
    return card.querySelector([
        'a.ytLockupViewModelContentImage',
        'a.shortsLockupViewModelHostEndpoint.reel-item-endpoint',
        'a#thumbnail',
        'ytd-thumbnail'
    ].join(','));
}

// Crea la advertencia visual.
function createOverlay(card, thumbnailLink, titleElement) {
    if (thumbnailLink.querySelector('.gta6-spoiler-overlay')) {
        return;
    }

    thumbnailLink.style.position = 'relative';

    const overlay = document.createElement('div');
    overlay.className = 'gta6-spoiler-overlay';

    // Las tarjetas normales tienen 12 px adicionales en el enlace.
    if (card.matches('yt-lockup-view-model')) {
        overlay.classList.add('gta6-spoiler-video-overlay');
    }

    const warning = document.createElement('div');
    warning.className = 'gta6-spoiler-warning';

    const icon = document.createElement('div');
    icon.className = 'gta6-warning-icon';
    icon.textContent = '!';

    const title = document.createElement('div');
    title.className = 'gta6-warning-title';
    title.textContent = TEXT.warningTitle;

    const subtitle = document.createElement('div');
    subtitle.className = 'gta6-warning-subtitle';
    subtitle.textContent = TEXT.warningSubtitle;

    const button = document.createElement('button');
    button.className = 'gta6-reveal-button';
    button.textContent = TEXT.revealButton;
    button.type = 'button';

    warning.append(icon, title, subtitle, button);
    overlay.appendChild(warning);

    thumbnailLink.appendChild(overlay);

    // Sustituir también el título.
    const titleReplacement = document.createElement('span');
    titleReplacement.className = 'gta6-spoiler-title';
    titleReplacement.textContent = TEXT.protectedTitle;

    titleElement.insertAdjacentElement(
        'afterend',
        titleReplacement
    );

    // Ocultar el título original.
    titleElement.style.display = 'none';

    card.classList.add('gta6-spoiler-blocked');

    // Desbloqueo exclusivamente de esta tarjeta.
    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        overlay.remove();
        titleReplacement.remove();

        // Restaurar el título original.
        titleElement.style.removeProperty('display');

        card.classList.remove('gta6-spoiler-blocked');
        card.classList.add('gta6-spoiler-unlocked');
    });
}

// Procesa una tarjeta individual.
function protectCard(card) {
    if (processedCards.has(card)) return;

    // Evitar procesar el contenedor padre de los Shorts.
    if (
        card.matches('ytd-rich-item-renderer') &&
        card.querySelector('ytm-shorts-lockup-view-model')
    ) {
        return;
    }

    if (processedCards.has(card)) return;

    const titleElement = getTitleElement(card);

    if (!titleElement) return;

    const originalTitle = titleElement.textContent.trim();

    if (!containsGTA6(originalTitle)) return;

    const thumbnailLink = getThumbnailLink(card);

    if (!thumbnailLink) return;

    processedCards.add(card);

    createOverlay(card, thumbnailLink, titleElement);
}

// Examina las tarjetas de YouTube.
function scanVideos() {
    const selectors = [
        'yt-lockup-view-model',
        'ytm-shorts-lockup-view-model',
        'ytd-rich-item-renderer',
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-grid-video-renderer'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(card => {
        protectCard(card);
    });
}

// Detecta los vídeos que YouTube carga dinámicamente.
const observer = new MutationObserver(() => {
    scanVideos();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Primera exploración.
scanVideos();

console.log('[GTA VI Blocker] Motor iniciado correctamente.');
