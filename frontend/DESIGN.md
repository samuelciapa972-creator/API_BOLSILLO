# Bolsillo · Dirección visual

Dirección elegida por el equipo: **"Libreta de ahorro"**.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

## Lectura del diseño

Panel web de una billetera virtual para tres perfiles (cliente, administrador y
auditor), en un lenguaje de libreta bancaria impresa: papel crema, tinta verde
y un único acento cobre.

## Por qué cada decisión

| Decisión | Valor | Razón |
|---|---|---|
| Fondo | papel crema `#F5F0E6` | Una libreta de ahorro es papel, no una pantalla blanca de hospital. |
| Texto y acción principal | tinta verde `#1E3A2D` | La tinta de los sellos y del dinero; da contraste AA sobre el papel. |
| Acento único | cobre `#9A5220` | El color de las monedas. Se usa **solo** para lo apartado en bolsillos. |
| Débito / crédito | rojo tinta / verde | Convención contable del extracto; nunca decorativos. |
| Cifras grandes | Fraunces (serif) | Recuerda los números impresos de una libreta; solo para saldos. |
| Interfaz | Instrument Sans | Legible a 14 px, con números tabulares para alinear montos. |
| Profundidad | bordes finos + sombra mínima en la hoja | Hojas sobre una mesa: una sola elevación, sin tarjetas flotando. |
| Radio | 4 px controles · 8 px hojas · 12 px diálogos | Papel cortado, no píldoras. |
| Espaciado | base 4 px; 16/24 dentro de hojas, 40 entre bloques | Densidad de extracto, con aire entre secciones. |
| Movimiento | solo hover, foco y la barra de saldo al cargar (≤ 240 ms) | Es una herramienta de dinero: nada debe distraer. Respeta `prefers-reduced-motion`. |

## Firma

**La barra de saldo partida**: cada cuenta muestra su saldo total como una
barra donde el tramo verde es lo disponible y cada bolsillo ocupa un tramo cobre
separado por una muesca. Refleja la regla central del negocio:
`saldo disponible = saldo total − suma de bolsillos activos`.

**Motivo repetido**: las filas del extracto con línea punteada entre el
concepto y el monto, como en una libreta impresa.

## Lo que se evita a propósito

- Sidebar oscuro con degradado y héroe con fotos de stock (el look del
  prototipo hospital).
- Tarjetas de métricas idénticas en cuadrícula: el panel tiene un solo foco
  (el saldo) y el resto se subordina.
- Logos o avatares inventados: la marca es la palabra "Bolsillo" en Fraunces y
  los avatares son iniciales.
