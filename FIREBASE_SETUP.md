# Guía de Configuración - Ricopan App

## 1. Crear proyecto Firebase

1. Ve a https://console.firebase.google.com/
2. Haz clic en **"Agregar proyecto"**
3. Nombre: `ricopan-app` (o el que prefieras)
4. Desactiva Google Analytics (no es necesario)
5. Haz clic en **"Crear proyecto"**

## 2. Configurar Authentication

1. En el menú lateral → **Authentication** → **Comenzar**
2. Pestaña **"Sign-in method"**
3. Activa **"Correo electrónico/Contraseña"**
4. Guarda los cambios

## 3. Configurar Firestore Database

1. En el menú lateral → **Firestore Database** → **Crear base de datos**
2. Selecciona **"Iniciar en modo de producción"**
3. Elige la ubicación más cercana (ej: `us-central1`)
4. Ve a la pestaña **"Reglas"** y pega estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }
    match /locales/{localId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }
    match /pedidos/{pedidoId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }
    match /facturas/{facturaId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Configurar Storage

1. En el menú lateral → **Storage** → **Comenzar**
2. Acepta las reglas por defecto
3. Ve a la pestaña **"Reglas"** y pega:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. Obtener credenciales

1. En la rueda de configuración (⚙️) → **"Configuración del proyecto"**
2. Baja hasta **"Tus apps"** → haz clic en **"</>"** (Web)
3. Nombre de la app: `ricopan-web`
4. **NO** marques Firebase Hosting
5. Copia el objeto `firebaseConfig`

## 6. Configurar variables de entorno

1. Copia el archivo `.env.example` a `.env.local`
2. Rellena con los valores de `firebaseConfig`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=ricopan-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ricopan-app
VITE_FIREBASE_STORAGE_BUCKET=ricopan-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 7. Crear el primer usuario administrador

Usa la consola Firebase directamente:

1. **Authentication** → **Agregar usuario**
   - Correo: `adm.pasteleriaricopan@gmail.com`
   - Contraseña: (elige una segura)
   - Copia el **UID** que aparece

2. **Firestore** → **Iniciar colección** → ID: `usuarios`
   - Agrega un documento con ID = el UID copiado
   - Campos:
     - `nombre`: "Administrador Ricopan"
     - `email`: "adm.pasteleriaricopan@gmail.com"
     - `rol`: "admin"
     - `local`: "Todos"
     - `activo`: true

## 8. Configurar EmailJS (para reportes automáticos)

1. Crea cuenta en https://www.emailjs.com/ (plan gratuito: 200 emails/mes)
2. **Email Services** → Conecta tu Gmail
3. **Email Templates** → Crea plantilla con estas variables:
   - `{{local_nombre}}` - nombre del local
   - `{{fecha}}` - fecha del reporte
   - `{{total_pedidos}}` - monto total pedidos
   - `{{total_facturado}}` - monto total facturas
   - `{{pendiente_pago}}` - monto pendiente de pago
   - `{{pendiente_nc}}` - monto pendiente nota crédito
   - `{{num_pedidos}}` - cantidad de pedidos
   - `{{num_facturas}}` - cantidad de facturas
4. Copia los IDs en `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_USER_ID=xxxxxxxxxxxxxx
   ```

## 9. Deploy a GitHub Pages

```bash
npm run deploy
```

La app quedará disponible en:
**https://[tu-usuario].github.io/ricopan-app/**

## Comandos útiles

```bash
npm run dev      # Desarrollo local
npm run build    # Construir para producción
npm run deploy   # Publicar en GitHub Pages
```
