export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  const { className, text, attributes = {}, dataset = {} } = options;

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = String(text);
  }

  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value === null || value === undefined) {
      continue;
    }

    element.setAttribute(name, value === true ? "" : String(value));
  }

  for (const [name, value] of Object.entries(dataset)) {
    if (value !== null && value !== undefined) {
      element.dataset[name] = String(value);
    }
  }

  return element;
}

export function appendChildren(parent, ...children) {
  parent.append(...children.filter(Boolean));
  return parent;
}

export function createField({
  id,
  name,
  label,
  type = "text",
  value = "",
  placeholder = "",
  required = false,
  min,
  max,
  step,
  rows,
  hint = "",
  fullWidth = false
}) {
  const group = createElement("div", {
    className: `form-field${fullWidth ? " form-field--full" : ""}`
  });
  const labelElement = createElement("label", {
    className: "form-field__label",
    text: label,
    attributes: { for: id }
  });
  const control = rows
    ? createElement("textarea", { attributes: { id, name, rows } })
    : createElement("input", { attributes: { id, name, type } });

  control.value = value;

  if (placeholder) {
    control.placeholder = placeholder;
  }

  if (required) {
    control.required = true;
  }

  if (min !== undefined) {
    control.min = String(min);
  }

  if (max !== undefined) {
    control.max = String(max);
  }

  if (step !== undefined) {
    control.step = String(step);
  }

  appendChildren(group, labelElement, control);

  if (hint) {
    const hintId = `${id}-hint`;
    const hintElement = createElement("p", {
      className: "form-field__hint",
      text: hint,
      attributes: { id: hintId }
    });
    control.setAttribute("aria-describedby", hintId);
    group.append(hintElement);
  }

  return { group, control };
}

export function createButton(label, action, options = {}) {
  const { id, variant = "secondary", type = "button", className = "" } = options;

  return createElement("button", {
    className: `button button--${variant}${className ? ` ${className}` : ""}`,
    text: label,
    attributes: { type },
    dataset: { action, id }
  });
}

export function createEmptyState(title, description) {
  const emptyState = createElement("div", {
    className: "empty-state",
    attributes: { role: "status" }
  });
  const titleElement = createElement("p", {
    className: "empty-state__title",
    text: title
  });
  const descriptionElement = createElement("p", { text: description });

  descriptionElement.style.marginBottom = "0";
  appendChildren(emptyState, titleElement, descriptionElement);

  return emptyState;
}

export function formatCurrency(value, currency = "USD") {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Sin referencia";
  }

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(number);
}

export function formatInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("es-CR").format(number) : "0";
}
