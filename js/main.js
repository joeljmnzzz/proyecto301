// main.js

// Animación escritura
function startTypingAnimation(texto) {
  const textoElemento = document.getElementById("texto");
  textoElemento.textContent = '';
  const errorIndex = 8;
  let i = 0;
  let errorHecho = false;

  function escribir() {
    if (i < texto.length) {
      const velocidad = 40 + Math.random() * 60;
      textoElemento.textContent += texto.charAt(i);
      i++;

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
}

// Menú Región
const flagBtn = document.getElementById('flag-btn');
const flagMenu = document.getElementById('flag-menu');

flagBtn.addEventListener('click', () => {
  flagMenu.style.display = (flagMenu.style.display === 'block') ? 'none' : 'block';
});

document.addEventListener('click', (event) => {
  if (!flagBtn.contains(event.target) && !flagMenu.contains(event.target)) {
    flagMenu.style.display = 'none';
  }
});

// Click en bandera solo cambia la clase visual
document.querySelectorAll('.flag-option').forEach(op => {
  op.addEventListener('click', () => {
    const country = op.dataset.country;
    flagBtn.className = `fi fi-${country}`;
    flagMenu.style.display = 'none';
  });
});

// Exportamos función para usarla desde i18n.js
window.startTypingAnimation = startTypingAnimation;
