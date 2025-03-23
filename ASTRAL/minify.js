// Script de minification pour CSS et JavaScript
// Nécessite les dépendances suivantes:
// npm install terser clean-css fs path

// Pour exécuter: node minify.js

const { minify } = require('terser');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    css: {
        files: ['styles.css'],
        outputDir: 'dist/css'
    },
    js: {
        files: ['script.js'],
        outputDir: 'dist/js'
    },
    html: {
        files: ['index.html', 'merci.html', 'privacy-policy.html', '404.html'],
        outputDir: 'dist'
    },
    assets: {
        dirs: ['assets'],
        outputDir: 'dist/assets'
    }
};

// Créer les répertoires de sortie s'ils n'existent pas
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Minifier CSS
async function minifyCSS() {
    ensureDirectoryExists(config.css.outputDir);
    
    for (const file of config.css.files) {
        const css = fs.readFileSync(file, 'utf8');
        const result = new CleanCSS({
            level: 2, // Niveau de compression maximal
            compatibility: 'ie11',
            format: 'keep-breaks' // Pour faciliter le débogage
        }).minify(css);
        
        const outputPath = path.join(config.css.outputDir, file.replace('.css', '.min.css'));
        fs.writeFileSync(outputPath, result.styles);
        
        console.log(`CSS minifié: ${file} -> ${outputPath} (Économie: ${Math.round((1 - result.stats.minifiedSize / result.stats.originalSize) * 100)}%)`);
    }
}

// Minifier JavaScript
async function minifyJS() {
    ensureDirectoryExists(config.js.outputDir);
    
    for (const file of config.js.files) {
        const js = fs.readFileSync(file, 'utf8');
        const result = await minify(js, {
            compress: {
                drop_console: true,
                drop_debugger: true
            },
            mangle: true,
            format: {
                comments: false
            }
        });
        
        const outputPath = path.join(config.js.outputDir, file.replace('.js', '.min.js'));
        fs.writeFileSync(outputPath, result.code);
        
        console.log(`JS minifié: ${file} -> ${outputPath} (Économie: ${Math.round((1 - result.code.length / js.length) * 100)}%)`);
    }
}

// Copier et mettre à jour les fichiers HTML pour utiliser les versions minifiées
function processHTML() {
    ensureDirectoryExists(config.html.outputDir);
    
    for (const file of config.html.files) {
        if (fs.existsSync(file)) {
            let html = fs.readFileSync(file, 'utf8');
            
            // Remplacer les liens vers les fichiers CSS et JS par leurs versions minifiées
            html = html.replace(/href="styles\.css"/g, 'href="css/styles.min.css"');
            html = html.replace(/src="script\.js"/g, 'src="js/script.min.js"');
            
            // Mettre à jour les liens vers les assets
            html = html.replace(/src="assets\//g, 'src="assets/');
            
            const outputPath = path.join(config.html.outputDir, file);
            fs.writeFileSync(outputPath, html);
            
            console.log(`HTML traité: ${file} -> ${outputPath}`);
        } else {
            console.warn(`Fichier HTML non trouvé: ${file}`);
        }
    }
}

// Copier les assets
function copyAssets() {
    for (const dir of config.assets.dirs) {
        const outputDir = path.join(config.assets.outputDir);
        ensureDirectoryExists(outputDir);
        
        if (fs.existsSync(dir)) {
            // Lire récursivement tous les fichiers dans le répertoire
            copyRecursive(dir, outputDir);
            console.log(`Assets copiés: ${dir} -> ${outputDir}`);
        } else {
            console.warn(`Répertoire d'assets non trouvé: ${dir}`);
        }
    }
}

// Fonction récursive pour copier un répertoire
function copyRecursive(src, dest) {
    if (fs.statSync(src).isDirectory()) {
        const destDir = path.join(dest, path.basename(src));
        ensureDirectoryExists(destDir);
        
        const files = fs.readdirSync(src);
        for (const file of files) {
            copyRecursive(path.join(src, file), destDir);
        }
    } else {
        const destFile = path.join(dest, path.basename(src));
        fs.copyFileSync(src, destFile);
    }
}

// Copier les fichiers supplémentaires importants
function copyExtraFiles() {
    const files = ['.htaccess', 'robots.txt', 'sitemap.xml'];
    
    for (const file of files) {
        if (fs.existsSync(file)) {
            const outputPath = path.join(config.html.outputDir, file);
            fs.copyFileSync(file, outputPath);
            console.log(`Fichier copié: ${file} -> ${outputPath}`);
        } else {
            console.warn(`Fichier non trouvé: ${file}`);
        }
    }
}

// Exécuter toutes les tâches
async function buildForProduction() {
    console.log('🚀 Début de la minification pour la production...');
    
    try {
        await minifyCSS();
        await minifyJS();
        processHTML();
        copyAssets();
        copyExtraFiles();
        
        console.log('✅ Build pour la production terminé avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors de la minification:', error);
    }
}

buildForProduction(); 