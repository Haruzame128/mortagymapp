// true si la disciplina usa la modalidad "con profesor" — hoy solo Natación,
// pero no está hardcodeado a esa disciplina puntual. Se activa por el flag
// disciplinas.usa_precio_profesor (para poder habilitar la columna en el
// editor de precios ANTES de cargar ningún valor) o, en su defecto, porque ya
// hay algún precio_N_profesor > 0 cargado (por compatibilidad con datos que
// no pasan el flag, como los objetos de precios sueltos). El precio base
// (precio_N) ya cumple el rol de "sin profesor" (en la página pública se
// muestra como "Efectivo (Libre)").
export function tieneConProfesor(d) {
  if (!d) return false;
  if (d.usa_precio_profesor === true || d.usa_precio_profesor === "true") return true;
  return [1, 2, 3, 4, 5, 6].some((n) => Number(d[`precio_${n}_profesor`]) > 0);
}

// Precio de lista de N días/semana según la modalidad elegida. Si no se pide
// "con profesor", o esa disciplina no tiene ese recargo configurado, se usa
// el precio base de siempre.
export function calcularPrecio(precios, n, conProfesor) {
  if (!precios || !n) return 0;
  if (conProfesor === true) {
    const p = Number(precios[`precio_${n}_profesor`] || 0);
    if (p > 0) return p;
  }
  return Number(precios[`precio_${n}`] || 0);
}
