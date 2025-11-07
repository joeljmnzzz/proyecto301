document.addEventListener("DOMContentLoaded", function () {
  const textoElemento = document.getElementById("texto");
  const texto = "Explora proyectos tecnológicos sobresalientes.";
  const errorIndex = 8;
  let i = 0;
  let errorHecho = false;

  function escribir() {
    if (i < texto.length) {
      const velocidad = 40 + Math.random() * 60;
      textoElemento.textContent += texto.charAt(i);
      i++;

      // Simula un error natural
      if (i === errorIndex && !errorHecho) {
        errorHecho = true;
        textoElemento.textContent += "x";
        setTimeout(() => {
          textoElemento.textContent = textoElemento.textContent.slice(0, -1);
          setTimeout(() => {
            textoElemento.textContent += texto.charAt(i - 1);
            setTimeout(escribir, velocidad);
          }, 150);
        }, 400);
      } else {
        const pausa = texto.charAt(i - 1) === " " ? 150 : 0;
        setTimeout(escribir, velocidad + pausa);
      }
    }
  }

  escribir();
});
