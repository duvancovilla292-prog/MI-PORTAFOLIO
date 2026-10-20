(() => {
  "use strict";

  /* ============================================================
     CONFIG
     ============================================================ */
  const ADMIN_USER = "Ciel";
  const ADMIN_PASS = "123456"; // Demo / temporal. Cambiar antes de producción real.

  const SS_ADMIN = "portafolio:isAdmin";
  const LS_AETHERI = "portafolio:aetheri"; // "1" = activado, "0" = desactivado
  const CLASE_AETHERI = "aetheri-on";

  // Nombres de archivo reales dentro de /data, usados solo para nombrar
  // la descarga cuando el admin guarda cambios (ver descargarJSON).
  const FILE_NAMES = {
    perfil: "perfil.json",
    campus: "proyectos-campus.json",
    personal: "proyectos-personales.json",
  };

  const DATA_URLS = {
    perfil: "data/perfil.json",
    campus: "data/proyectos-campus.json",
    personal: "data/proyectos-personales.json",
  };

  // Etiqueta temática que se muestra en la cabecera de cada "Skill Card"
  const ETIQUETAS_TIPO = {
    campus: "Campus",
    personal: "Personal",
  };

  // Aplica la preferencia guardada antes de que cargue el resto del DOM
  document.documentElement.classList.toggle(CLASE_AETHERI, leerAetheri());

  let state = {
    perfil: null,
    campus: [],
    personal: [],
    isAdmin: false,
  };

  /* ============================================================
     UTILIDADES
     ============================================================ */

  /**
   * Devuelve la URL solo si usa http(s); si no, devuelve "".
   * Evita que un valor como "javascript:..." termine en un href.
   */
  function urlHttpSegura(valor) {
    const limpio = (valor || "").trim();
    if (!limpio) return "";
    try {
      const u = new URL(limpio);
      return u.protocol === "http:" || u.protocol === "https:" ? limpio : "";
    } catch {
      return "";
    }
  }

  /**
   * Crea un enlace-botón de tarjeta con icono decorativo + texto.
   */
  function crearEnlaceCard({ href, clase, icono, texto, etiquetaAria }) {
    const a = document.createElement("a");
    a.className = `card-link ${clase}`;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (etiquetaAria) a.setAttribute("aria-label", etiquetaAria);

    const ic = document.createElement("span");
    ic.className = "icon";
    ic.setAttribute("aria-hidden", "true");
    ic.textContent = icono;

    const tx = document.createElement("span");
    tx.textContent = texto;

    a.append(ic, tx);
    return a;
  }

  /* ============================================================
     LENGUAJE AETHERI
     La preferencia vive en localStorage. La clase "aetheri-on" se
     aplica sobre <html> y el CSS cambia la fuente de todos los
     elementos con la clase .translatable.
     ============================================================ */
  function leerAetheri() {
    try {
      return localStorage.getItem(LS_AETHERI) === "1";
    } catch {
      return false;
    }
  }

  function aplicarAetheri(activo, { persistir = false } = {}) {
    document.documentElement.classList.toggle(CLASE_AETHERI, activo);

    const toggle = document.getElementById("toggleAetheri");
    if (toggle) toggle.checked = activo;

    if (persistir) {
      try {
        localStorage.setItem(LS_AETHERI, activo ? "1" : "0");
      } catch {
        /* almacenamiento no disponible: el cambio aplica solo en esta carga */
      }
    }
  }

  function initAetheri() {
    const toggle = document.getElementById("toggleAetheri");
    toggle.addEventListener("change", () => aplicarAetheri(toggle.checked, { persistir: true }));

    // Mantiene sincronizadas otras pestañas abiertas
    window.addEventListener("storage", (e) => {
      if (e.key === LS_AETHERI) aplicarAetheri(e.newValue === "1");
    });

    aplicarAetheri(leerAetheri());
  }

  /* ============================================================
     PERSISTENCIA: SOLO JSON, SIN localStorage
     Este sitio es estático (GitHub Pages, sin backend), así que el
     navegador no puede escribir directamente en los archivos del
     repositorio. Por eso, cuando el admin guarda un cambio:
       1) se actualiza la vista en memoria (para ver el resultado
          de inmediato, mientras dura la sesión/pestaña),
       2) se descarga el archivo .json actualizado,
     y el paso final lo haces tú: reemplazar ese archivo dentro de
     /data en tu proyecto/repo y subir el cambio (commit + push).
     No se usa localStorage ni sessionStorage para guardar datos.

     Nota sobre el campo opcional "web": si un proyecto no tiene
     demo, la clave "web" simplemente no se escribe en el JSON.
     Los JSON antiguos (sin "web") siguen funcionando igual.
     ============================================================ */
  function descargarJSON(nombreArchivo, datos) {
    const contenido = JSON.stringify(datos, null, 2);
    const blob = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Descarga el JSON y avisa al admin del paso manual final.
  function guardarYAvisar(nombreArchivo, datos) {
    descargarJSON(nombreArchivo, datos);
    alert(
      `Se descargó "${nombreArchivo}" actualizado.\nReemplaza el archivo dentro de /data en tu proyecto y sube el cambio para que quede permanente.`
    );
  }

  // Si el sitio se abre con doble clic (file://) el navegador bloquea el
  // fetch() a los JSON por CORS. En ese caso, usamos como respaldo el JSON
  // que va embebido en el propio index.html (ver <script type="application/json">).
  // Cuando el sitio corre por un servidor real (local o GitHub Pages), siempre
  // se usa el archivo /data/*.json vía fetch, que es la fuente de verdad.
  async function fetchJSON(url, fallbackId) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return await res.json();
    } catch (err) {
      const fallbackEl = fallbackId && document.getElementById(fallbackId);
      if (fallbackEl) {
        try {
          console.warn(`No se pudo hacer fetch de ${url} (¿abriste el archivo con doble clic?). Usando datos de respaldo embebidos.`);
          return JSON.parse(fallbackEl.textContent);
        } catch {
          /* sigue al throw de abajo */
        }
      }
      throw err;
    }
  }

  async function cargarDatos() {
    const [perfilRemoto, campusRemoto, personalRemoto] = await Promise.allSettled([
      fetchJSON(DATA_URLS.perfil, "perfil-data-fallback"),
      fetchJSON(DATA_URLS.campus, "campus-data-fallback"),
      fetchJSON(DATA_URLS.personal, "personal-data-fallback"),
    ]);

    state.perfil = perfilRemoto.status === "fulfilled" ? perfilRemoto.value : null;
    state.campus = campusRemoto.status === "fulfilled" ? campusRemoto.value : [];
    state.personal = personalRemoto.status === "fulfilled" ? personalRemoto.value : [];
  }

  /* ============================================================
     RENDER: PERFIL / HERO / FOOTER
     ============================================================ */
  function renderPerfil() {
    const p = state.perfil;
    if (!p) return;

    document.getElementById("perfilNombre").textContent = p.nombre || "—";
    document.getElementById("perfilRol").textContent = p.rol || "";
    document.getElementById("perfilDescripcion").textContent = p.descripcion || "";
    document.getElementById("perfilUbicacion").textContent = p.ubicacion || "";
    document.getElementById("footerNombre").textContent = p.nombre || "Mi Portafolio";

    const foto = document.getElementById("perfilFoto");
    foto.src = p.foto || "";
    foto.alt = `Foto de ${p.nombre || "perfil"}`;
    foto.onerror = () => {
      foto.onerror = null;
      // Placeholder SVG con el azul abisal del tema
      foto.src =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><rect width='100%' height='100%' fill='#16253F'/></svg>"
        );
    };

    const redesWrap = document.getElementById("perfilRedes");
    const footerRedesWrap = document.getElementById("footerRedes");
    redesWrap.innerHTML = "";
    footerRedesWrap.innerHTML = "";

    const redes = p.redes || {};
    const entradas = [
      ["github", "GitHub", redes.github],
      ["linkedin", "LinkedIn", redes.linkedin],
      ["email", "Correo", redes.email ? `mailto:${redes.email}` : null],
    ];

    entradas.forEach(([, label, href]) => {
      if (!href) return;
      const a1 = document.createElement("a");
      a1.href = href;
      a1.textContent = label;
      a1.target = href.startsWith("mailto:") ? "_self" : "_blank";
      a1.rel = "noopener";
      redesWrap.appendChild(a1);

      const a2 = a1.cloneNode(true);
      footerRedesWrap.appendChild(a2);
    });
  }

  /* ============================================================
     RENDER: GRIDS DE PROYECTOS ("Skill Cards")
     ============================================================ */
  function crearCard(proyecto, tipo, indice) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.tipo = tipo;

    /* --- Cabecera tipo "Ficha de Análisis del Gran Sabio" --- */
    const head = document.createElement("header");
    head.className = "card-head";

    const indexEl = document.createElement("span");
    indexEl.className = "card-index translatable";
    indexEl.textContent = `⟡ Análisis Nº ${String(indice + 1).padStart(2, "0")}`;

    const tools = document.createElement("div");
    tools.className = "card-tools";

    const tag = document.createElement("span");
    tag.className = "card-tag";
    tag.textContent = ETIQUETAS_TIPO[tipo] || tipo;
    tools.appendChild(tag);

    // Botón de edición (solo admin) dentro de la cabecera
    if (state.isAdmin) {
      const editBtn = document.createElement("button");
      editBtn.className = "card-edit";
      editBtn.type = "button";
      editBtn.textContent = "Editar";
      editBtn.setAttribute("aria-label", `Editar proyecto ${proyecto.nombre}`);
      editBtn.addEventListener("click", () => abrirModalProyecto(tipo, proyecto.id));
      tools.appendChild(editBtn);
    }

    head.append(indexEl, tools);

    /* --- Imagen --- */
    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    img.src = proyecto.imagen || "";
    img.alt = `Captura del proyecto ${proyecto.nombre}`;
    img.loading = "lazy";
    img.onerror = () => {
      media.innerHTML = "";
      media.textContent = (proyecto.nombre || "?").slice(0, 2).toUpperCase();
    };
    media.appendChild(img);

    /* --- Cuerpo --- */
    const body = document.createElement("div");
    body.className = "card-body";

    const h3 = document.createElement("h3");
    h3.className = "translatable";
    h3.textContent = proyecto.nombre;

    const p = document.createElement("p");
    p.className = "translatable";
    p.textContent = proyecto.descripcion;

    /* --- Zona de enlaces: repo (siempre) + web (condicional) --- */
    const acciones = document.createElement("div");
    acciones.className = "card-actions";

    // a) Código / Repositorio (obligatorio)
    acciones.appendChild(
      crearEnlaceCard({
        href: urlHttpSegura(proyecto.repo) || "#",
        clase: "card-link--code",
        icono: "⟨/⟩",
        texto: "Código / Repositorio",
        etiquetaAria: `Ver código del proyecto ${proyecto.nombre}`,
      })
    );

    // b) Página Web / Ver Demo (SOLO si "web" existe y no está vacío).
    //    Si no hay web, este nodo no se crea y no aparece en el DOM.
    if (proyecto.web && proyecto.web.trim() !== "") {
      const webUrl = urlHttpSegura(proyecto.web);
      if (webUrl) {
        acciones.appendChild(
          crearEnlaceCard({
            href: webUrl,
            clase: "card-link--web",
            icono: "✦",
            texto: "Página Web / Ver Demo",
            etiquetaAria: `Ver demo en vivo de ${proyecto.nombre}`,
          })
        );
      }
    }

    body.append(h3, p, acciones);
    card.append(head, media, body);

    return card;
  }

  function renderGrid(tipo) {
    const gridId = tipo === "campus" ? "campusGrid" : "personalGrid";
    const grid = document.getElementById(gridId);
    const datos = state[tipo] || [];

    grid.innerHTML = "";

    if (datos.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "empty-state";
      vacio.textContent = state.isAdmin
        ? "Todavía no hay proyectos. Usa “+ Agregar proyecto” para crear el primero."
        : "Próximamente nuevos proyectos por aquí.";
      grid.appendChild(vacio);
      return;
    }

    datos.forEach((proyecto, i) => grid.appendChild(crearCard(proyecto, tipo, i)));
  }

  function renderTodo() {
    renderPerfil();
    renderGrid("campus");
    renderGrid("personal");
    document.querySelectorAll(".edit-btn").forEach((el) => (el.hidden = !state.isAdmin));
    document.getElementById("adminBar").hidden = !state.isAdmin;
    document.getElementById("btnLogin").hidden = state.isAdmin;
  }

  /* ============================================================
     MENÚ MÓVIL
     ============================================================ */
  function initMenuMovil() {
    const btn = document.getElementById("btnMenu");
    const nav = document.getElementById("main-nav-mobile");

    btn.addEventListener("click", () => {
      const abierto = !nav.hidden;
      nav.hidden = abierto;
      btn.setAttribute("aria-expanded", String(!abierto));
    });

    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ============================================================
     MODALES: cierre genérico
     ============================================================ */
  function initCierreModales() {
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => btn.closest("dialog").close());
    });
  }

  /* ============================================================
     LOGIN
     ============================================================ */
  function initLogin() {
    const loginModal = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");
    const loginError = document.getElementById("loginError");

    document.getElementById("btnLogin").addEventListener("click", () => {
      loginError.hidden = true;
      loginForm.reset();
      loginModal.showModal();
    });

    document.getElementById("btnLogout").addEventListener("click", () => {
      state.isAdmin = false;
      sessionStorage.removeItem(SS_ADMIN);
      renderTodo();
    });

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("loginUser").value.trim();
      const pass = document.getElementById("loginPass").value;

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        state.isAdmin = true;
        sessionStorage.setItem(SS_ADMIN, "1");
        loginModal.close();
        renderTodo();
      } else {
        loginError.hidden = false;
      }
    });

    if (sessionStorage.getItem(SS_ADMIN) === "1") {
      state.isAdmin = true;
    }
  }

  /* ============================================================
     EDITAR PERFIL
     ============================================================ */
  function initEdicionPerfil() {
    const modal = document.getElementById("perfilModal");
    const form = document.getElementById("perfilForm");

    document.querySelector('[data-edit="perfil"]').addEventListener("click", () => {
      const p = state.perfil || {};
      document.getElementById("fNombre").value = p.nombre || "";
      document.getElementById("fRol").value = p.rol || "";
      document.getElementById("fUbicacion").value = p.ubicacion || "";
      document.getElementById("fDescripcion").value = p.descripcion || "";
      document.getElementById("fFoto").value = p.foto || "";
      document.getElementById("fGithub").value = (p.redes && p.redes.github) || "";
      document.getElementById("fLinkedin").value = (p.redes && p.redes.linkedin) || "";
      document.getElementById("fEmail").value = (p.redes && p.redes.email) || "";
      modal.showModal();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      state.perfil = {
        nombre: document.getElementById("fNombre").value.trim(),
        rol: document.getElementById("fRol").value.trim(),
        ubicacion: document.getElementById("fUbicacion").value.trim(),
        descripcion: document.getElementById("fDescripcion").value.trim(),
        foto: document.getElementById("fFoto").value.trim(),
        redes: {
          github: document.getElementById("fGithub").value.trim(),
          linkedin: document.getElementById("fLinkedin").value.trim(),
          email: document.getElementById("fEmail").value.trim(),
        },
      };
      modal.close();
      renderPerfil();
      guardarYAvisar(FILE_NAMES.perfil, state.perfil);
    });
  }

  /* ============================================================
     EDITAR / CREAR / ELIMINAR PROYECTOS
     ============================================================ */
  function abrirModalProyecto(tipo, id = null) {
    const modal = document.getElementById("proyectoModal");
    const titulo = document.getElementById("proyectoModalTitulo");
    const btnEliminar = document.getElementById("btnEliminarProyecto");

    document.getElementById("pTipo").value = tipo;
    document.getElementById("pId").value = id || "";

    if (id) {
      const proyecto = state[tipo].find((it) => it.id === id);
      titulo.textContent = "Editar proyecto";
      document.getElementById("pNombre").value = proyecto.nombre;
      document.getElementById("pDescripcion").value = proyecto.descripcion;
      document.getElementById("pImagen").value = proyecto.imagen || "";
      document.getElementById("pRepo").value = proyecto.repo || "";
      document.getElementById("pWeb").value = proyecto.web || ""; // campo opcional
      btnEliminar.hidden = false;
    } else {
      titulo.textContent = "Nuevo proyecto";
      document.getElementById("proyectoForm").reset(); // también limpia #pWeb
      btnEliminar.hidden = true;
    }

    modal.showModal();
  }

  function initEdicionProyectos() {
    document
      .querySelectorAll('.edit-btn[data-edit="campus"], .edit-btn[data-edit="personal"]')
      .forEach((btn) => {
        btn.addEventListener("click", () => abrirModalProyecto(btn.dataset.edit));
      });

    const form = document.getElementById("proyectoForm");
    const modal = document.getElementById("proyectoModal");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const tipo = document.getElementById("pTipo").value;
      const id = document.getElementById("pId").value;

      const lista = state[tipo];
      const idx = lista.findIndex((it) => it.id === id);
      const existente = idx >= 0 ? lista[idx] : {};

      // Se parte del objeto existente para no perder campos que el
      // formulario no maneja (compatibilidad hacia adelante).
      const datos = {
        ...existente,
        id: id || `${tipo}-${Date.now()}`,
        nombre: document.getElementById("pNombre").value.trim(),
        descripcion: document.getElementById("pDescripcion").value.trim(),
        imagen: document.getElementById("pImagen").value.trim(),
        repo: document.getElementById("pRepo").value.trim(),
      };

      // Campo opcional "web": solo se guarda si es una URL http(s) válida.
      // Si queda vacío, se elimina la clave para mantener el JSON limpio.
      const web = urlHttpSegura(document.getElementById("pWeb").value);
      if (web) datos.web = web;
      else delete datos.web;

      if (idx >= 0) lista[idx] = datos;
      else lista.push(datos);

      modal.close();
      renderGrid(tipo);
      guardarYAvisar(FILE_NAMES[tipo], lista);
    });

    document.getElementById("btnEliminarProyecto").addEventListener("click", () => {
      if (!confirm("¿Eliminar este proyecto? Esta acción generará un JSON sin él.")) return;

      const tipo = document.getElementById("pTipo").value;
      const id = document.getElementById("pId").value;
      state[tipo] = state[tipo].filter((it) => it.id !== id);
      modal.close();
      renderGrid(tipo);
      guardarYAvisar(FILE_NAMES[tipo], state[tipo]);
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  async function init() {
    document.getElementById("anioActual").textContent = new Date().getFullYear();

    initMenuMovil();
    initCierreModales();
    initLogin();
    initAetheri();
    initEdicionPerfil();
    initEdicionProyectos();

    await cargarDatos();
    renderTodo();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
