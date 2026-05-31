# Guía de Despliegue en Cloudflare Pages - GANANCY SaaS

Esta guía detalla los pasos exactos para desplegar tu aplicación en **Cloudflare Pages**, la plataforma de hosting estático más rápida, segura y **100% gratuita con ancho de banda ilimitado**.

---

## 🚀 Paso 1: Crear e importar tu repositorio en GitHub

Cloudflare Pages se conecta directamente a tu cuenta de GitHub. Cada vez que subas cambios a tu repositorio (`git push`), Cloudflare compilará y actualizará el sitio en producción automáticamente.

1. Asegúrate de tener tu código subido a un repositorio en **GitHub** (puede ser público o privado).

---

## 🧡 Paso 2: Crear el proyecto en Cloudflare Pages

1. Ingresa a tu panel de **[Cloudflare](https://dash.cloudflare.com/)** (inicia sesión o regístrate gratis).
2. En la barra lateral izquierda, ve a la sección **"Workers & Pages"**.
3. Haz clic en el botón **"Create"** (o "Create application").
4. Selecciona la pestaña **"Pages"** (al lado de Workers).
5. Haz clic en **"Connect to Git"** (Conectarse a Git).
6. Inicia sesión en tu cuenta de GitHub y autoriza a Cloudflare a acceder a tus repositorios.
7. Selecciona el repositorio de **financy-game** (o el nombre que tenga en tu GitHub) y haz clic en **"Begin setup"**.

---

## 🛠️ Paso 3: Configurar los ajustes de compilación (Build Settings)

En la pantalla de configuración del despliegue, completa los siguientes campos técnicos para compilar con Vite:

1. **Project name**: `ganancy-app` (puedes elegir el nombre que prefieras).
2. **Production branch**: `main` (o la rama principal de tu repositorio).
3. **Framework preset**: Selecciona **"Vite"** en la lista desplegable.
4. **Build command**: `npm run build` *(se autocompletará solo al elegir Vite)*.
5. **Build output directory**: `dist` *(se autocompletará solo al elegir Vite)*.

---

## 🔑 Paso 4: Agregar Variables de Entorno (Conectar Supabase)

> [!IMPORTANT]
> Debes agregar las llaves de tu Supabase en esta pantalla de configuración para que la aplicación en vivo pueda conectarse con tu base de datos y autenticar usuarios en producción.

En la misma pantalla de configuración, despliega la sección **"Environment variables (advanced)"** y añade las siguientes dos variables:

1. **VITE_SUPABASE_URL**:
   - *Variable name*: `VITE_SUPABASE_URL`
   - *Value*: *(Introduce la URL del proyecto que encuentras en Supabase > Settings > API)*
2. **VITE_SUPABASE_ANON_KEY**:
   - *Variable name*: `VITE_SUPABASE_ANON_KEY`
   - *Value*: *(Introduce la Anon Key pública de Supabase)*

Una vez completado esto, haz clic en **"Save and Deploy"** (Guardar y desplegar).

---

## 🕒 Paso 5: ¡Listo! Tu sitio está en vivo

Cloudflare comenzará a descargar y compilar tu proyecto en sus servidores de alta velocidad.
- En aproximadamente **1 minuto**, el despliegue se completará con éxito.
- Te otorgarán una dirección URL pública gratuita de por vida, como por ejemplo: `ganancy-app.pages.dev`.

---

## 🔗 Paso 6: Configurar tu dominio personalizado (ej: `app.ganancy.cl`)

Para que tus clientes accedan directamente a través de tu marca comercial:

1. Dentro de tu proyecto en el panel de Cloudflare Pages, ve a la pestaña **"Custom domains"** (Dominios personalizados).
2. Haz clic en **"Set up a custom domain"**.
3. Escribe tu subdominio profesional (ej: `app.ganancy.cl`) y haz clic en **"Continue"**.
4. **Si tu dominio ya usa Cloudflare**:
   - Haz clic en **"Activate domain"**. Cloudflare creará el registro DNS CNAME por ti de forma automática.
5. **Si tu dominio está en otro proveedor (como NIC Chile, GoDaddy, Namecheap, etc.)**:
   - Ve al panel de control de tu proveedor de dominio e ingresa este registro DNS:
     - **Tipo**: `CNAME`
     - **Nombre / Host**: `app` (o el subdominio que elijas)
     - **Valor / Destino**: `ganancy-app.pages.dev` (la dirección de Pages)
   - Una vez guardado, regresa a Cloudflare y haz clic en **"Check progress"**.

Una vez validado, Cloudflare Pages activará de inmediato el **certificado SSL/HTTPS de forma automática, gratuita e ilimitada**.
