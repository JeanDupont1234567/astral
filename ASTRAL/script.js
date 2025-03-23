// ASTRAL WEBSITE JAVASCRIPT - Ultra-optimisé
(() => {
    // Cache des éléments DOM fréquemment utilisés
    const DOM = {
        header: document.querySelector('header'),
        nav: {
            links: document.querySelector('.nav-links'),
            items: document.querySelectorAll('.nav-links a')
        },
        sections: document.querySelectorAll('section[id]'),
        scrollProgress: document.querySelector('.scroll-progress-bar'),
        // Référence au conteneur d'étoiles pour l'optimisation
        starsContainer: document.querySelector('.stars-container'),
        // Logo elements
        logos: {
            header: document.querySelector('header .logo img'),
            hero: document.querySelector('.hero-logo'),
            footer: document.querySelector('.footer-logo img')
        },
        // Mobile menu elements
        mobileToggle: document.querySelector('.mobile-menu-toggle'),
        mobileMenu: document.querySelector('.nav-links')
    };

    // Variables de performance pour le défilement
    let lastScrollPosition = 0;
    let ticking = false;
    let lastScrollPercent = 0;
    let resizeTimeout;

    // Optimisation de la mise en cache des dimensions
    const pageMetrics = {
        maxScroll: 0,
        updateMetrics() {
            this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        }
    };
    pageMetrics.updateMetrics();

    // Gestion du mode sombre/clair
    const themeManager = {
        // Clé pour le stockage local
        storageKey: 'astral-theme-preference',
        
        // Élément qui sera ajouté au DOM
        toggleBtn: null,
        toggleContainer: null,
        
        // Initialisation
        init() {
            this.createToggleButton();
            this.applyStoredTheme();
            
            // Écouter les changements de préférence système
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem(this.storageKey)) {
                    this.setTheme(e.matches ? 'dark' : 'light', false);
                }
            });
            
            // Repositionner le bouton de thème sur mobile
            this.positionToggleButtonForMobile();
            window.addEventListener('resize', () => {
                this.positionToggleButtonForMobile();
            });
        },
        
        // Crée le bouton de basculement du thème
        createToggleButton() {
            // Créer un conteneur pour le bouton
            this.toggleContainer = document.createElement('div');
            this.toggleContainer.className = 'theme-toggle-container';
            
            this.toggleBtn = document.createElement('button');
            this.toggleBtn.className = 'theme-toggle';
            this.toggleBtn.setAttribute('aria-label', 'Basculer le mode sombre/clair');
            this.toggleBtn.innerHTML = '<i class="fas fa-moon"></i><i class="fas fa-sun"></i>';
            
            this.toggleBtn.addEventListener('click', () => {
                const isDark = document.body.classList.contains('dark-theme');
                this.setTheme(isDark ? 'light' : 'dark', true);
            });
            
            this.toggleContainer.appendChild(this.toggleBtn);
            document.body.appendChild(this.toggleContainer);
        },
        
        // Positionne le bouton de thème différemment sur mobile
        positionToggleButtonForMobile() {
            if (document.body.contains(this.toggleContainer)) {
                this.toggleContainer.classList.add('fixed-position');
            }
        },
        
        // Applique le thème stocké ou utilise la préférence système
        applyStoredTheme() {
            const storedTheme = localStorage.getItem(this.storageKey);
            
            if (storedTheme) {
                this.setTheme(storedTheme, false);
            } else {
                // Forcer le mode sombre par défaut, quelle que soit la préférence système
                this.setTheme('dark', false);
            }
        },
        
        // Définit le thème et le stocke si demandé
        setTheme(theme, store = true) {
            // Appliquer la classe appropriée au body
            document.body.classList.remove('light-theme', 'dark-theme');
            document.body.classList.add(`${theme}-theme`);
            
            // Mettre à jour les logos
            this.updateLogos(theme);
            
            // Mettre à jour le bouton de basculement
            if (this.toggleBtn) {
                this.toggleBtn.setAttribute('aria-label', 
                    theme === 'dark' 
                        ? 'Passer au mode clair' 
                        : 'Passer au mode sombre'
                );
            }
            
            // Stocker la préférence si nécessaire
            if (store) {
                localStorage.setItem(this.storageKey, theme);
            }
        },

        // Function to update logos based on theme
        updateLogos(theme) {
            // Update all logo sources based on the current theme
            if (DOM.logos.header) {
                DOM.logos.header.src = theme === 'light' 
                    ? 'assets/astral-logo-blue.svg'
                    : 'assets/astral-logo-white.svg';
            }
            
            if (DOM.logos.hero) {
                DOM.logos.hero.src = theme === 'light'
                    ? 'assets/astral-logo-blue.svg'
                    : 'assets/astral-logo-white.svg';
            }
            
            if (DOM.logos.footer) {
                DOM.logos.footer.src = theme === 'light'
                    ? 'assets/astral-logo-blue.svg'
                    : 'assets/astral-logo-white.svg';
            }
        }
    };

    // Gestion du menu mobile
    const mobileMenuManager = {
        init() {
            if (!DOM.mobileToggle || !DOM.mobileMenu) return;
            
            DOM.mobileToggle.addEventListener('click', this.toggleMenu.bind(this));
            
            // Fermer le menu lors du clic sur un lien
            DOM.nav.items.forEach(item => {
                item.addEventListener('click', this.closeMenu.bind(this));
            });
            
            // Fermer le menu lors du défilement
            window.addEventListener('scroll', () => {
                if (DOM.mobileMenu.classList.contains('active')) {
                    this.closeMenu();
                }
            });
        },
        
        toggleMenu() {
            DOM.mobileToggle.classList.toggle('active');
            DOM.mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            const isExpanded = DOM.mobileToggle.getAttribute('aria-expanded') === 'true';
            DOM.mobileToggle.setAttribute('aria-expanded', !isExpanded);
        },
        
        closeMenu() {
            DOM.mobileToggle.classList.remove('active');
            DOM.mobileMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            DOM.mobileToggle.setAttribute('aria-expanded', 'false');
        }
    };

    // Gestion optimisée du défilement avec throttling
    const handleScroll = () => {
        lastScrollPosition = window.scrollY;
        
        if (!ticking) {
            requestAnimationFrame(() => {
                updateOnScroll(lastScrollPosition);
                ticking = false;
            });
            ticking = true;
        }
    };

    // Mise à jour basée sur le défilement
    const updateOnScroll = (scrollPos) => {
        // Header sticky
        DOM.header.classList.toggle('scrolled', scrollPos > 50);
        
        // Barre de progression
        if (DOM.scrollProgress) {
            const currentScrollPercent = Math.min(scrollPos / pageMetrics.maxScroll, 1);
            // Interpolation pour une animation fluide
            lastScrollPercent = lastScrollPercent + (currentScrollPercent - lastScrollPercent) * 0.1;
            DOM.scrollProgress.style.transform = `scaleX(${lastScrollPercent})`;
        }
        
        // Mise à jour des éléments actifs de navigation
        updateActiveNavItem(scrollPos);
    };

    // Mise en évidence de la navigation active
    const updateActiveNavItem = (scrollPos) => {
        // Gestion spéciale pour la section "Notre Différence"
        const comparaisonSection = document.getElementById('comparaison');
        if (comparaisonSection) {
            const comparaisonTop = comparaisonSection.offsetTop - 100;
            const comparaisonBottom = comparaisonTop + comparaisonSection.offsetHeight;
            
            if (scrollPos >= comparaisonTop && scrollPos < comparaisonBottom) {
                DOM.nav.items.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#avantages');
                });
                return;
            }
        }
        
        // Traitement normal des sections
        for (const section of DOM.sections) {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                const id = section.getAttribute('id');
                DOM.nav.items.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
                break; // Sortir de la boucle dès qu'une section active est trouvée
            }
        }
    };

    // Gestion des clics sur les liens d'ancrage
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        
        e.preventDefault();
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Défilement natif fluide
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, { passive: false });

    // Optimisation du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            pageMetrics.updateMetrics();
        }, 200);
    }, { passive: true });

    // Initialisation au chargement
    window.addEventListener('load', () => {
        pageMetrics.updateMetrics();
        handleScroll(); // Appliquer immédiatement l'état initial
        
        // Animation des éléments au chargement de la page
        document.body.classList.add('loaded');
        
        // Initialiser le gestionnaire de thème
        themeManager.init();

        // Initialiser le gestionnaire de menu mobile
        mobileMenuManager.init();
    });

    // Événement de défilement optimisé
    window.addEventListener('scroll', handleScroll, { passive: true });
})(); 