# Dados — Guía de publicación en Google Play Store

## Arquitectura de monetización

### Flujos de ingresos implementables

**1. AdMob (Anuncios)**
- Banner fijo en la parte inferior durante el juego normal
- Interstitial tras cada 5 lanzamientos o al salir de Farkle
- Rewarded video: "Mira un anuncio para desbloquear efectos especiales temporales"

**2. Compra única — "Dados Premium" (€3.99)**
- Elimina todos los anuncios de por vida
- Desbloquea presets ilimitados (gratis: máx. 5)
- Desbloquea colores de mesa premium y materiales extra (translucent, etc.)
- Desbloquea tema "Tavern Mode" (iluminación ambiente de taberna medieval)

---

## Pasos para empaquetar como PWA → Android (Trusted Web Activity)

### Opción A: TWA con Bubblewrap (recomendado, sin Capacitor)

```bash
# 1. Instala Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Inicializa el proyecto TWA
bubblewrap init --manifest https://tu-dominio.com/dados/manifest.json

# 3. Configura en twa-manifest.json:
{
  "packageId": "com.tuempresa.dados",
  "host": "tu-dominio.com",
  "startUrl": "/dados/",
  "name": "Dados — Lanzador de mesa",
  "shortName": "Dados",
  "display": "fullscreen",
  "orientation": "landscape",
  "themeColor": "#0a0d0c",
  "backgroundColor": "#0a0d0c",
  "iconUrl": "https://tu-dominio.com/dados/icon-512.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": { ... }
}

# 4. Compila el APK
bubblewrap build

# 5. Firma y sube a Play Console
bubblewrap install
```

### Opción B: Capacitor (más control nativo)

```bash
npm init @capacitor/app dados-capacitor
cd dados-capacitor
npm install @capacitor/core @capacitor/android
npm install @capacitor/admob  # Para anuncios
npx cap add android

# En capacitor.config.ts:
{
  appId: 'com.tuempresa.dados',
  appName: 'Dados',
  webDir: 'public',
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  }
}
```

---

## Añadir AdMob (anuncios)

### En el HTML, antes del cierre </body>:
```html
<!-- Google AdMob via Capacitor -->
<script>
  // Se inicializa solo cuando está en entorno nativo
  if (window.Capacitor) {
    import('@capacitor/admob').then(({ AdMob }) => {
      AdMob.initialize({ testingDevices: [] });
      window.__adMob = AdMob;
    });
  }
</script>
```

### En app.jsx, añadir lógica de anuncios:
```javascript
// Contador de tiradas para activar interstitial
const rollCountRef = useRef(0);
const ROLLS_BEFORE_AD = 5; // cada 5 lanzamientos

function roll(strength) {
  rollCountRef.current += 1;
  if (!isPremium && rollCountRef.current % ROLLS_BEFORE_AD === 0) {
    showInterstitial();
  }
  // ... resto de la lógica de lanzamiento
}

async function showInterstitial() {
  if (!window.__adMob) return;
  await window.__adMob.prepareInterstitial({ adId: 'ca-app-pub-TU_ID/INTERSTITIAL_ID' });
  await window.__adMob.showInterstitial();
}
```

---

## Sistema de Premium con Google Play Billing

### Verificación de compra en app.jsx:
```javascript
const [isPremium, setIsPremium] = useState(false);

useEffect(() => {
  // Comprueba compra existente al iniciar
  checkPurchase();
}, []);

async function checkPurchase() {
  if (!window.Capacitor) return;
  const { GooglePlay } = await import('@capacitor/google-play');
  const purchases = await GooglePlay.queryPurchases({ productType: 'inapp' });
  const hasPremium = purchases.purchases?.some(p => p.productId === 'dados_premium');
  setIsPremium(hasPremium);
}

async function purchasePremium() {
  if (!window.Capacitor) return;
  try {
    const { GooglePlay } = await import('@capacitor/google-play');
    const result = await GooglePlay.purchase({ productId: 'dados_premium' });
    if (result.purchaseState === 'PURCHASED') {
      setIsPremium(true);
      savePrefs({ ...loadPrefs(), isPremium: true });
    }
  } catch (e) {
    console.error('Purchase failed', e);
  }
}
```

---

## Checklist de publicación en Google Play

### Assets necesarios:
- [ ] Icono 512×512 px (sin bordes redondeados, Google los añade)
- [ ] Feature graphic 1024×500 px
- [ ] Capturas de pantalla: mín. 2, recomendado 8 (teléfono 16:9 o 9:16)
- [ ] Descripción corta (máx. 80 chars)
- [ ] Descripción completa (máx. 4000 chars)
- [ ] Video de presentación (YouTube, opcional)

### Configuración en Play Console:
1. Cuenta de desarrollador: $25 USD única vez
2. Nuevo app → "Aplicación de juegos"
3. Clasificación de contenido: PEGI 3 (sin violencia, sin compras en juego agresivas)
4. Precios: Gratis + IAP
5. Políticas: Declarar uso de anuncios, datos recopilados (ninguno personal)

### manifest.json para PWA:
```json
{
  "name": "Dados — Lanzador de mesa",
  "short_name": "Dados",
  "description": "Lanzador de dados 3D para juegos de mesa. Farkle incluido.",
  "start_url": "/dados/",
  "display": "fullscreen",
  "orientation": "landscape-primary",
  "theme_color": "#0a0d0c",
  "background_color": "#0a0d0c",
  "icons": [
    { "src": "/dados/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/dados/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["games", "utilities"],
  "lang": "es",
  "screenshots": [
    { "src": "/dados/screenshot1.png", "sizes": "1280x720", "type": "image/png" }
  ]
}
```

### Digital Asset Links (para TWA):
Crea el archivo `/.well-known/assetlinks.json` en tu servidor:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.tuempresa.dados",
    "sha256_cert_fingerprints": ["TU_FINGERPRINT_SHA256"]
  }
}]
```

---

## Estimación de ingresos

| Métrica          | Conservador | Optimista |
|-----------------|-------------|-----------|
| DAU (año 1)     | 500         | 5.000     |
| Conversión IAP  | 2%          | 5%        |
| Precio premium  | €3.99       | €3.99     |
| ARPU ads/mes    | €0.05       | €0.25     |
| **Ingreso/mes** | **~€30**    | **~€625** |

La monetización es respetuosa: anuncios no intrusivos y premium razonable.
Un jugador de Farkle habitual (uso diario) verá 1-2 anuncios/sesión máximo.
