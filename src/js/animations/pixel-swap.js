const MAX_PIXELS = 220;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const noise = seed => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

function buildGrid(width, height, pixelSize = 64) {
  let size = Math.max(8, Math.round(pixelSize));
  let columns = Math.max(1, Math.ceil(width / size));
  let rows = Math.max(1, Math.ceil(height / size));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil(width / size));
    rows = Math.max(1, Math.ceil(height / size));
  }

  const stride = size;
  const originX = (width - columns * stride) / 2;
  const originY = (height - rows * stride) / 2;
  const pixels = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const centerDistance = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
      const random = noise(index + 1);

      pixels.push({
        id: index,
        left: originX + column * stride,
        top: originY + row * stride,
        order: centerDistance * 0.75 + random * 0.25
      });
    }
  }

  return { pixels, size, width, height };
}

function createPixelAnimation({ from, to, duration, delay }) {
  const animation = from.animate(
    [
      { transform: 'scale(0.35) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.18) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1 }
    ],
    {
      duration: 450,
      delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    }
  );

  const contentAnimation = to.animate(
    [
      { transform: 'scale(2.86)', opacity: 0 },
      { transform: 'scale(0.84)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    {
      duration: 450,
      delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    }
  );

  return [animation, contentAnimation];
}

export function createPixelSwapLoader(root) {
  if (!root) return { play: () => Promise.resolve(), destroy: () => {} };

    const reducedMotion = globalThis.document?.documentElement?.classList?.contains('low-performance') || (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
  const firstLayer = root.querySelector('[data-pixel-layer="first"]');
  const secondLayer = root.querySelector('[data-pixel-layer="second"]');
  const gridRoot = root.querySelector('[data-pixel-grid]');
  const animations = [];
  let destroyed = false;

  const cleanup = () => {
    animations.forEach(animation => animation.cancel());
    animations.length = 0;
    gridRoot?.replaceChildren();
  };

  const finish = () => {
    if (destroyed) return;
    cleanup();
    firstLayer?.setAttribute('aria-hidden', 'true');
    secondLayer?.removeAttribute('aria-hidden');
    secondLayer?.classList.add('is-visible');
    root.classList.add('is-complete');
  };

  const play = () => {
    if (destroyed || !firstLayer || !secondLayer || !gridRoot) return Promise.resolve();

    if (reducedMotion || !document.body.animate) {
      finish();
      return Promise.resolve();
    }

    cleanup();
    firstLayer.classList.remove('is-hidden');
    secondLayer.classList.remove('is-visible');
    secondLayer.setAttribute('aria-hidden', 'true');

    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;
    const grid = buildGrid(width, height, 64);
    const source = secondLayer.cloneNode(true);
    source.removeAttribute('aria-hidden');
    source.classList.add('pixel-swap-loader__clone');
    source.style.opacity = '1';

    const pixelDelaySpread = 950;
    const scale = 1.35;

    grid.pixels.forEach(pixel => {
      const pixelElement = document.createElement('span');
      pixelElement.className = 'pixel-swap-loader__pixel';
      pixelElement.style.left = `${pixel.left}px`;
      pixelElement.style.top = `${pixel.top}px`;
      pixelElement.style.width = `${grid.size + 2}px`;
      pixelElement.style.height = `${grid.size + 2}px`;

      const content = document.createElement('span');
      content.className = 'pixel-swap-loader__pixel-content';
      content.style.width = `${width}px`;
      content.style.height = `${height}px`;
      content.style.left = `${-pixel.left}px`;
      content.style.top = `${-pixel.top}px`;
      content.style.transformOrigin = `${pixel.left + grid.size / 2}px ${pixel.top + grid.size / 2}px`;
      content.appendChild(source.cloneNode(true));
      pixelElement.appendChild(content);
      gridRoot.appendChild(pixelElement);

      const delay = clamp(pixel.order, 0, 1) * pixelDelaySpread;
      const [pixelAnimation, contentAnimation] = createPixelAnimation({
        from: pixelElement,
        to: content,
        duration: 450,
        delay
      });
      animations.push(pixelAnimation, contentAnimation);
    });

    return new Promise(resolve => {
      window.setTimeout(() => {
        finish();
        resolve();
      }, 1550);
    });
  };

  return {
    play,
    destroy() {
      destroyed = true;
      cleanup();
    }
  };
}
