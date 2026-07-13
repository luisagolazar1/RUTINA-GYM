# RUTINA — App de registro de entrenamiento

App multiusuario basada en `RUTINA_LO-1-1-1.xlsx`. Funciona sola (local) o con
sincronización en la nube entre dispositivos.

## Archivos

* `index.html` — app completa (UI + lógica + datos de la rutina).
* `api/data.js` — función serverless para guardar/leer en la nube (Vercel KV).
* `package.json`, `vercel.json` — configuración de despliegue.
* `manifest.json` — permite "instalar" la app en el celular.

---

## 1. Subir a GitHub

```bash
cd rutina-app
git init
git add .
git commit -m "App inicial de rutina"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/rutina-app.git
git push -u origin main
```

*(Creá antes el repositorio vacío en github.com → "New repository".)*

## 2. Desplegar en Vercel

1. Entrá a vercel.com → **Add New → Project**.
2. Elegí el repo `rutina-app` de GitHub.
3. Framework preset: **Other**. No requiere build command.
4. **Deploy**. En 1–2 min tenés una URL tipo `https://rutina-app.vercel.app`.

Con esto ya podés abrir la app desde el celular — funciona en modo local
(cada dispositivo guarda sus propios datos).

## 3. Activar almacenamiento en la nube (opcional, multi-dispositivo)

1. En el dashboard del proyecto en Vercel → pestaña **Storage**.
2. **Create Database → KV** (Redis, gratis en plan Hobby).
3. Conectala al proyecto (Vercel agrega las variables de entorno solo).
4. Redeploy (Vercel → Deployments → ⋯ → Redeploy).

Desde ese momento `/api/data` funciona y la app sincroniza automáticamente
al guardar cada sesión. Sin este paso, la app sigue funcionando 100% local
en `localStorage` (sin romperse).

## 4. Instalar en el celular

* Abrí la URL de Vercel en Chrome/Safari del celular.
* Menú del navegador → **Agregar a pantalla de inicio / Instalar app**.
* Queda como ícono normal, pantalla completa, sin barra del navegador.

## 5. Uso

* Primer ingreso: crear usuario (nombre). Cada usuario tiene su propio historial.
* Elegí el día (LUN a VIE) → aparecen los ejercicios de ese día agrupados por músculo.
* Editá series / repeticiones / peso si hiciste distinto a lo planeado.
* Tocá el check ✓ en cada ejercicio completado.
* **Guardar sesión** → queda en el historial (y se sincroniza a la nube si está activa).
* Botón **Historial** → ver registros anteriores por fecha.
* Tocar el usuario arriba a la derecha → cambiar/crear otro usuario.

## Notas técnicas

* Datos base cargados desde la hoja `RUTINA` del Excel (38 ejercicios, 5 días).
* Sin nube configurada: cero dependencias externas, cero costos.
* Con nube: Vercel KV free tier alcanza sobra para uso personal/familiar.
* Para agregar más ejercicios o cambiar pesos objetivo: editar el array
  `ROUTINE` dentro de `index.html`.
