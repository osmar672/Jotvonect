from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = PROJECT_ROOT / "docs" / "infografia" / "JobConnect_Infografia.pdf"

PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

BACKGROUND = HexColor("#F5F3FB")
SURFACE = HexColor("#FFFFFF")
TEXT = HexColor("#211A32")
MUTED = HexColor("#6D667D")
ACCENT = HexColor("#6D28D9")
ACCENT_SOFT = HexColor("#EEE7FF")
LINE = HexColor("#E5DFED")
SUCCESS = HexColor("#16794B")
BLUE = HexColor("#2563EB")
TEAL = HexColor("#0F766E")
ORANGE = HexColor("#C2410C")
PINK = HexColor("#BE185D")
GREEN = HexColor("#15803D")


def register_fonts():
    regular = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("JC-Regular", str(regular)))
        pdfmetrics.registerFont(TTFont("JC-Bold", str(bold)))
        return "JC-Regular", "JC-Bold"

    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = register_fonts()


def draw_paragraph(pdf, text, x, y, width, height, size=9, color=TEXT, bold=False,
                   alignment=TA_LEFT, leading=None):
    style = ParagraphStyle(
        name="jobconnect",
        fontName=FONT_BOLD if bold else FONT_REGULAR,
        fontSize=size,
        leading=leading or size * 1.28,
        textColor=color,
        alignment=alignment,
        spaceAfter=0,
        spaceBefore=0,
    )
    paragraph = Paragraph(text, style)
    _, used_height = paragraph.wrap(width, height)
    paragraph.drawOn(pdf, x, y + height - used_height)
    return used_height


def panel(pdf, x, y, width, height, title, accent=ACCENT):
    pdf.setFillColor(SURFACE)
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.8)
    pdf.roundRect(x, y, width, height, 10, fill=1, stroke=1)
    pdf.setFillColor(accent)
    pdf.roundRect(x, y + height - 10, width, 10, 10, fill=1, stroke=0)
    pdf.rect(x, y + height - 10, width, 5, fill=1, stroke=0)
    draw_paragraph(pdf, title, x + 14, y + height - 39, width - 28, 22, size=12, bold=True)


def numbered_step(pdf, number, text, x, y, width):
    pdf.setFillColor(ACCENT_SOFT)
    pdf.circle(x + 10, y + 9, 9, fill=1, stroke=0)
    pdf.setFillColor(ACCENT)
    pdf.setFont(FONT_BOLD, 8)
    pdf.drawCentredString(x + 10, y + 6.2, str(number))
    draw_paragraph(pdf, text, x + 27, y - 1, width - 27, 21, size=8.2, color=TEXT)


def module_card(pdf, x, y, width, height, title, endpoint, methods, accent):
    pdf.setFillColor(HexColor("#FAF9FD"))
    pdf.setStrokeColor(LINE)
    pdf.roundRect(x, y, width, height, 7, fill=1, stroke=1)
    pdf.setFillColor(accent)
    pdf.roundRect(x + 9, y + height - 25, 20, 17, 5, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont(FONT_BOLD, 7)
    pdf.drawCentredString(x + 19, y + height - 19.2, title[:2].upper())
    draw_paragraph(pdf, title, x + 35, y + height - 29, width - 43, 20, size=9.2, bold=True)
    draw_paragraph(pdf, f"<b>{endpoint}</b>", x + 10, y + 22, width - 20, 17, size=8, color=accent)
    draw_paragraph(pdf, methods, x + 10, y + 7, width - 20, 16, size=7.2, color=MUTED)


def architecture_layer(pdf, label, detail, x, y, width, accent):
    pdf.setFillColor(accent)
    pdf.roundRect(x, y, width, 31, 6, fill=1, stroke=0)
    draw_paragraph(pdf, label, x + 9, y + 11, width - 18, 15, size=8.5, color=white, bold=True)
    draw_paragraph(pdf, detail, x + 9, y - 15, width - 18, 13, size=7.2, color=MUTED)


def create_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    pdf.setTitle("JobConnect - Infografía del sistema")
    pdf.setAuthor("Equipo JobConnect")

    pdf.setFillColor(BACKGROUND)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    pdf.setFillColor(ACCENT)
    pdf.roundRect(28, PAGE_HEIGHT - 102, PAGE_WIDTH - 56, 74, 16, fill=1, stroke=0)
    pdf.setFillColor(white)
    pdf.setFont(FONT_BOLD, 23)
    pdf.drawString(49, PAGE_HEIGHT - 62, "JOBCONNECT")
    pdf.setFont(FONT_REGULAR, 10)
    pdf.drawString(49, PAGE_HEIGHT - 82, "Panel frontend de gestión de empleabilidad conectado a DummyJSON")
    pdf.setFont(FONT_BOLD, 9)
    pdf.drawRightString(PAGE_WIDTH - 49, PAGE_HEIGHT - 61, "6 MÓDULOS + 3 PERFILES")
    pdf.setFont(FONT_REGULAR, 8)
    pdf.drawRightString(PAGE_WIDTH - 49, PAGE_HEIGHT - 79, "Fetch · async/await · token Bearer · estado local")

    left_x, left_w = 28, 220
    center_x, center_w = 260, 338
    right_x, right_w = 610, PAGE_WIDTH - 638
    content_top = PAGE_HEIGHT - 116

    panel(pdf, left_x, content_top - 205, left_w, 205, "Flujo de autenticación", ACCENT)
    numbered_step(pdf, 1, "El reclutador envía usuario y contraseña.", left_x + 14, content_top - 72, left_w - 28)
    numbered_step(pdf, 2, "POST <b>/auth/login</b> devuelve accessToken.", left_x + 14, content_top - 105, left_w - 28)
    numbered_step(pdf, 3, "El token se guarda en <b>localStorage</b>.", left_x + 14, content_top - 138, left_w - 28)
    numbered_step(pdf, 4, "Las peticiones usan <b>Authorization: Bearer</b>.", left_x + 14, content_top - 171, left_w - 28)

    panel(pdf, left_x, 38, left_w, 218, "Perfil, estado y experiencia", SUCCESS)
    draw_paragraph(
        pdf,
        "DummyJSON simula las mutaciones. JobConnect refleja el CRUD en estado local, conserva perfiles por cuenta y ofrece tema persistente, vista previa y movimiento accesible.",
        left_x + 14,
        141,
        left_w - 28,
        73,
        size=8.4,
        color=MUTED,
        leading=11,
    )
    checks = [
        "Mensajes de carga, éxito y error",
        "Confirmación antes de DELETE",
        "Skeletons, vistas y ordenamiento",
        "Paneles y transiciones accesibles",
    ]
    start_y = 126
    for index, check in enumerate(checks):
        y = start_y - index * 22
        pdf.setFillColor(SUCCESS)
        pdf.circle(left_x + 20, y + 5, 4, fill=1, stroke=0)
        draw_paragraph(pdf, check, left_x + 31, y - 2, left_w - 45, 17, size=7.8, color=TEXT)

    panel(pdf, center_x, 38, center_w, content_top - 38, "Módulos y métodos HTTP", BLUE)
    modules = [
        ("Candidatos", "/users", "GET · POST · PUT · PATCH · DELETE", ACCENT),
        ("Vacantes", "/products", "GET · POST · PUT · PATCH · DELETE", BLUE),
        ("Empresas", "/carts", "GET · POST · PUT · DELETE", TEAL),
        ("Postulaciones", "/posts", "GET · POST · PATCH · DELETE", ORANGE),
        ("Entrevistas", "/comments", "GET · POST · PATCH · DELETE", PINK),
        ("Tareas", "/todos", "GET · POST · PATCH · DELETE", GREEN),
    ]
    card_width = (center_w - 42) / 2
    card_height = 92
    for index, module in enumerate(modules):
        column = index % 2
        row = index // 2
        x = center_x + 14 + column * (card_width + 14)
        y = content_top - 135 - row * (card_height + 13)
        module_card(pdf, x, y, card_width, card_height, *module)

    draw_paragraph(
        pdf,
        "Creación: <b>/recurso/add</b> · Actualización y borrado: <b>/recurso/:id</b>",
        center_x + 16,
        46,
        center_w - 32,
        18,
        size=7.5,
        color=MUTED,
        alignment=TA_CENTER,
    )

    panel(pdf, right_x, content_top - 248, right_w, 248, "Arquitectura", TEAL)
    layer_x = right_x + 14
    layer_w = right_w - 28
    architecture_layer(pdf, "HTML + CSS", "Interfaz y diseño responsivo", layer_x, content_top - 72, layer_w, ACCENT)
    architecture_layer(pdf, "app + shell + perfil", "Sesión, tema y paneles", layer_x, content_top - 123, layer_w, BLUE)
    architecture_layer(pdf, "6 módulos", "Configuración del dominio", layer_x, content_top - 174, layer_w, TEAL)
    architecture_layer(pdf, "Servicios + DummyJSON", "Fetch, token y errores", layer_x, content_top - 225, layer_w, ORANGE)

    panel(pdf, right_x, 38, right_w, 164, "Calidad verificada", GREEN)
    draw_paragraph(pdf, "<b>26 pruebas automáticas</b>", right_x + 14, 151, right_w - 28, 20, size=10, color=SUCCESS)
    draw_paragraph(pdf, "Login y sesión<br/>Cinco verbos HTTP<br/>Seis formularios CRUD<br/>Tema, menú y perfiles<br/>Servidor Node y health", right_x + 14, 76, right_w - 28, 72, size=8, color=TEXT, leading=12)
    draw_paragraph(pdf, "131 validaciones de sintaxis, archivos y conexiones.", right_x + 14, 49, right_w - 28, 24, size=7.2, color=MUTED)

    pdf.setFillColor(MUTED)
    pdf.setFont(FONT_REGULAR, 6.8)
    pdf.drawCentredString(PAGE_WIDTH / 2, 18, "JobConnect · HTML, CSS y JavaScript · Servidor estático Node · API pública DummyJSON")

    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    create_pdf()
    print(OUTPUT)
