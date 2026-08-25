const DEFAULT_FROM = {
  filter: "blur(10px)",
  opacity: 0,
  y: -50
};

const DEFAULT_TO = [
  {
    filter: "blur(5px)",
    opacity: 0.5,
    y: 5
  },
  {
    filter: "blur(0px)",
    opacity: 1,
    y: 0
  }
];

function prefersReducedMotion() {
  return globalThis.document?.documentElement?.classList?.contains("low-performance") || (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);
}

function splitWords(element) {
  const text = element.textContent?.trim() ?? "";
  const words = text.split(/\s+/).filter(Boolean);

  element.replaceChildren();

  words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "blur-text__word";
    span.textContent = word;
    span.setAttribute("aria-hidden", "true");
    element.append(span);

    if (index < words.length - 1) {
      element.append(document.createTextNode(" "));
    }
  });

  return words.length;
}

export function initBlurText(root, {
  delay = 200,
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  stepDuration = 0.35,
  onAnimationComplete
} = {}) {
  if (!root) return () => {};

  const elements = [...root.querySelectorAll("[data-blur-text]")];
  if (!elements.length) return () => {};

  const animations = [];
  const observers = [];

  for (const element of elements) {
    const originalText = element.textContent?.trim() ?? "";
    if (!originalText) continue;

    const wordCount = splitWords(element);
    const from = direction === "top"
      ? DEFAULT_FROM
      : { filter: "blur(10px)", opacity: 0, y: 50 };

    const to = direction === "top"
      ? DEFAULT_TO
      : [
          { filter: "blur(5px)", opacity: 0.5, y: -5 },
          { filter: "blur(0px)", opacity: 1, y: 0 }
        ];

    element.setAttribute("aria-label", originalText);

    const words = [...element.querySelectorAll(".blur-text__word")];

    const showImmediately = () => {
      words.forEach(word => {
        word.style.opacity = "1";
        word.style.filter = "blur(0px)";
        word.style.transform = "translateY(0)";
      });
    };

    if (prefersReducedMotion()) {
      showImmediately();
      continue;
    }

    words.forEach(word => {
      word.style.opacity = String(from.opacity);
      word.style.filter = from.filter;
      word.style.transform = `translateY(${from.y}px)`;
    });

    let completed = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(element);

        words.forEach((word, index) => {
          const animation = word.animate([
            { filter: from.filter, opacity: from.opacity, transform: `translateY(${from.y}px)` },
            { filter: to[0].filter, opacity: to[0].opacity, transform: `translateY(${to[0].y}px)` },
            { filter: to[1].filter, opacity: to[1].opacity, transform: `translateY(${to[1].y}px)` }
          ], {
            duration: stepDuration * 2000,
            delay: index * delay,
            easing: "linear",
            fill: "forwards"
          });

          animations.push(animation);

          animation.finished.then(() => {
            completed += 1;
            if (completed === wordCount && typeof onAnimationComplete === "function") {
              onAnimationComplete();
            }
          }).catch(() => {});
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    observers.push(observer);
  }

  return () => {
    observers.forEach(observer => observer.disconnect());
    animations.forEach(animation => animation.stop?.());
  };
}
