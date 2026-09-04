(() => {
  "use strict";

  /* ============================================================
     CONFIG
     ============================================================ */
  const ADMIN_USER = "Ciel";
  const ADMIN_PASS = "123456"; // Demo / temporal. Cambiar antes de producción real.

  const SS_ADMIN = "portafolio:isAdmin";

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

  let state = {
    perfil: null,
    campus: [],
    personal: [],
    isAdmin: false,
  };

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
      foto.src =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><rect width='100%' height='100%' fill='%2316253F'/></svg>`
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
     RENDER: GRIDS DE PROYECTOS
     ============================================================ */
  function crearCard(proyecto, tipo) {
    const card = document.createElement("article");
    card.className = "card";

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

    const body = document.createElement("div");
    body.className = "card-body";

    const h3 = document.createElement("h3");
    h3.textContent = proyecto.nombre;

    const p = document.createElement("p");
    p.textContent = proyecto.descripcion;

    const link = document.createElement("a");
    link.className = "card-link";
    link.href = proyecto.repo || "#";
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Ver repositorio →";

    body.append(h3, p, link);
    card.append(media, body);

    if (state.isAdmin) {
      const editBtn = document.createElement("button");
      editBtn.className = "card-edit";
      editBtn.type = "button";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => abrirModalProyecto(tipo, proyecto.id));
      card.appendChild(editBtn);
    }

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

    datos.forEach((proyecto) => grid.appendChild(crearCard(proyecto, tipo)));
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
      descargarJSON(FILE_NAMES.perfil, state.perfil);
      alert(
        `Se descargó "${FILE_NAMES.perfil}" actualizado.\nReemplaza el archivo dentro de /data en tu proyecto y sube el cambio para que quede permanente.`
      );
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
      btnEliminar.hidden = false;
    } else {
      titulo.textContent = "Nuevo proyecto";
      document.getElementById("proyectoForm").reset();
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

      const datos = {
        id: id || `${tipo}-${Date.now()}`,
        nombre: document.getElementById("pNombre").value.trim(),
        descripcion: document.getElementById("pDescripcion").value.trim(),
        imagen: document.getElementById("pImagen").value.trim(),
        repo: document.getElementById("pRepo").value.trim(),
      };

      const lista = state[tipo];
      const idx = lista.findIndex((it) => it.id === id);
      if (idx >= 0) lista[idx] = datos;
      else lista.push(datos);

      modal.close();
      renderGrid(tipo);
      descargarJSON(FILE_NAMES[tipo], lista);
      alert(
        `Se descargó "${FILE_NAMES[tipo]}" actualizado.\nReemplaza el archivo dentro de /data en tu proyecto y sube el cambio para que quede permanente.`
      );
    });

    document.getElementById("btnEliminarProyecto").addEventListener("click", () => {
      const tipo = document.getElementById("pTipo").value;
      const id = document.getElementById("pId").value;
      state[tipo] = state[tipo].filter((it) => it.id !== id);
      modal.close();
      renderGrid(tipo);
      descargarJSON(FILE_NAMES[tipo], state[tipo]);
      alert(
        `Se descargó "${FILE_NAMES[tipo]}" actualizado.\nReemplaza el archivo dentro de /data en tu proyecto y sube el cambio para que quede permanente.`
      );
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
    initEdicionPerfil();
    initEdicionProyectos();

    await cargarDatos();
    renderTodo();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
