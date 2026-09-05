# 🚀 Portafolio Personal | Ciel Covilla

Estudiante de desarrollo de software en Campuslands (Medical Duarte), apasionado por la programación, la automatización y la ciencia.


---

## 📋 Tabla de Contenidos
- [🚀 Portafolio Personal | Ciel Covilla](#-portafolio-personal--ciel-covilla)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🎯 Acerca del Proyecto](#-acerca-del-proyecto)
  - [📂 Estructura del Proyecto](#-estructura-del-proyecto)
  - [✨ Características Principales](#-características-principales)
  - [🛠️ Tecnologías y Stack](#️-tecnologías-y-stack)
  - [🌐 Despliegue (GitHub Pages)](#-despliegue-github-pages)
  - [👨‍💻 Autor](#-autor)

---

## 🎯 Acerca del Proyecto

Este repositorio contiene el código fuente de mi **portafolio personal interactivo**, diseñado para centralizar y mostrar todos los proyectos desarrollados durante mi formación en Campuslands, así como proyectos personales orientados al aprendizaje autónomo, la automatización y la experimentación tecnológica.

El sitio ha sido construido con una arquitectura moderna basada en **HTML5, CSS3 y JavaScript Vanilla (ES6+)**, utilizando un sistema dinámico basado en archivos **JSON** locales para separar la lógica de presentación de los datos.

---

## 📂 Estructura del Proyecto

```text
├── CSS/
│   └── style.css            # Estilos principales, variables (tokens), diseño responsivo y modales
├── JS/
│   └── app.js               # Lógica de la aplicación, fetch asíncrono de JSON, renderizado de grids y modo admin
├── data/
│   ├── perfil.json          # Información biográfica, rol, ubicación y enlaces de contacto
│   ├── proyectos-campus.json # Listado de proyectos y prácticas desarrolladas en Campuslands
│   └── proyectos-personales.json # Listado de proyectos experimentales y personales
├── IMG/
│   └── yo.jpeg              # Fotografía de perfil
└── index.html               # Estructura HTML semántica, modales de autenticación y edición
```

---

## ✨ Características Principales

- **Diseño Responsivo y Moderno:** Interfaz adaptada a cualquier dispositivo (móviles, tablets y escritorios) con un sistema de tokens de diseño (`:root`).
- **Carga Dinámica de Datos:** Consumo asíncrono de archivos JSON (`fetch`) para mantener los datos limpios y desacoplados del código fuente de la interfaz.
- **Modo Administrador Interactivo:** Sistema de inicio de sesión seguro simulado con `sessionStorage` que permite habilitar controles de edición directamente en la interfaz.
- **Sistema de Respaldo por Descarga JSON:** Al editar o crear perfiles y proyectos desde el panel de administración, el sistema genera y descarga automáticamente el archivo JSON actualizado para facilitar su actualización en el repositorio.
- **Compatibilidad Local (Fallback):** Soporte para ejecución local directa mediante respaldos embebidos en caso de restricciones de CORS al abrir el archivo con doble clic.

---

## 🛠️ Tecnologías y Stack

* **Frontend:** HTML5, CSS3 (Variables, Grid, Flexbox, Custom Properties), JavaScript (Vanilla ES6+, Fetch API, DOM Manipulation).
* **Control de Versiones:** Git & GitHub.
* **Despliegue:** GitHub Pages.
* **Herramientas Adicionales:** n8n, Python, SQL, PSeInt (aplicados en la lógica de los proyectos mostrados).

---

## 🌐 Despliegue (GitHub Pages)

El portafolio se encuentra alojado y publicado en producción mediante **GitHub Pages**:

* **URL del sitio web:** [https://duvancovilla292-prog.github.io/portafolio-personal/](https://duvancovilla292-prog.github.io/portafolio-personal/)

---

## 👨‍💻 Autor

Desarrollado con dedicación por **Duvan Steven Covilla Rolón (Ciel Covilla)**.

* **GitHub:** [@duvancovilla292-prog](https://github.com/duvancovilla292-prog)
* **Correo electrónico:** duvancovilla292@gmail.com
* **Ubicación:** Cúcuta, Colombia