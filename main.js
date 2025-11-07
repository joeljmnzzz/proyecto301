const switchModo = document.getElementById("modoSwitch");
const preferenciaOscura = window.matchMedia("(prefers-color-scheme: dark)");

// Función para aplicar el modo
function aplicarModo(modo) {
  if (modo === "oscuro") {
    document.body.classList.add("dark-mode");
    switchModo.checked = true;
  } else {
    document.body.classList.remove("dark-mode");
    switchModo.checked = false;
  }
}

// 1️⃣ Comprobar si hay un modo guardado en localStorage
const modoGuardado = localStorage.getItem("modo");

if (modoGuardado) {
  aplicarModo(modoGuardado);
} else {
  // 2️⃣ Si no hay guardado, usar el tema del sistema
  aplicarModo(preferenciaOscura.matches ? "oscuro" : "claro");
}

// 3️⃣ Escuchar cambios del sistema (si el usuario cambia tema en su PC)
preferenciaOscura.addEventListener("change", (evento) => {
  if (!localStorage.getItem("modo")) {
    aplicarModo(evento.matches ? "oscuro" : "claro");
  }
});

// 4️⃣ Escuchar el cambio manual del usuario
switchModo.addEventListener("change", () => {
  const nuevoModo = switchModo.checked ? "oscuro" : "claro";
  aplicarModo(nuevoModo);
  localStorage.setItem("modo", nuevoModo);
});
