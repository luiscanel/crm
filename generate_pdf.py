from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import Color, HexColor, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.flowables import Flowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Custom colors
primary_blue = HexColor('#2563eb')
dark_blue = HexColor('#1d4ed8')
light_blue = HexColor('#dbeafe')
green = HexColor('#16a34a')
red = HexColor('#dc2626')
gray = HexColor('#6b7280')

# Create PDF
pdf_path = 'MANUAL_USO_VENDEDOR.pdf'
doc = SimpleDocTemplate(
    pdf_path, 
    pagesize=letter, 
    rightMargin=60, 
    leftMargin=60, 
    topMargin=60, 
    bottomMargin=60
)

# Custom Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Title'],
    fontSize=28,
    textColor=primary_blue,
    spaceAfter=20,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

subtitle_style = ParagraphStyle(
    'Subtitle',
    parent=styles['Normal'],
    fontSize=14,
    textColor=gray,
    spaceAfter=30,
    alignment=TA_CENTER
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=16,
    textColor=dark_blue,
    spaceAfter=12,
    spaceBefore=20,
    fontName='Helvetica-Bold'
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=11,
    textColor=HexColor('#374151'),
    spaceAfter=8,
    alignment=TA_LEFT
)

tip_style = ParagraphStyle(
    'Tip',
    parent=styles['Normal'],
    fontSize=10,
    textColor=green,
    spaceAfter=12,
    spaceBefore=4,
    backgroundColor=light_blue,
    borderPadding=8
)

# Content
content = []

# COVER PAGE
content.append(Spacer(1, 2*inch))
content.append(Paragraph("📱", title_style))
content.append(Paragraph("Teknao CRM", title_style))
content.append(Paragraph("Manual de Uso", subtitle_style))
content.append(Spacer(1, 0.5*inch))
content.append(Paragraph("Guía para el Vendedor", subtitle_style))
content.append(Spacer(1, 2*inch))
content.append(Paragraph("© 2026 Teknao CRM - Version 1.0", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=10, textColor=gray, alignment=TA_CENTER)))

content.append(PageBreak())

# CONTENT
# Section 1
content.append(Paragraph("1. Introducción", heading_style))
content.append(Paragraph("<b>Teknao CRM</b> es tu herramienta de ventas B2B. Gestiona tus empresas prospecto, registra llamadas, agenda citas y gana puntos por tu trabajo.", normal_style))
content.append(Spacer(1, 0.2*inch))

# Section 2
content.append(Paragraph("2. Iniciar Sesión", heading_style))
content.append(Paragraph("Sigue estos pasos:", normal_style))
content.append(Paragraph("① Abre la URL de tu CRM", normal_style))
content.append(Paragraph("② Ingresa tu <b>email</b> y <b>contraseña</b>", normal_style))
content.append(Paragraph("③ Presiona <b>Iniciar Sesión</b>", normal_style))
content.append(Paragraph("💡 <b>Tip:</b> Tu credencial te la debe proporcionar tu administrador.", tip_style))

# Section 3
content.append(Paragraph("3. Tu Dashboard", heading_style))
content.append(Paragraph("Al entrar verás tu panel personal con:", normal_style))

# Dashboard table
dash_data = [
    ['📊', 'Llamadas hoy', 'Cantidad de llamadas realizadas'],
    ['✅', 'Efectivas', 'Llamadas que conectaron'],
    ['⭐', 'Puntos', 'Tu puntuación acumulada'],
    ['📈', 'Meta diaria', 'Progreso vs objetivo']
]
dash_table = Table(dash_data, colWidths=[0.5*inch, 1.5*inch, 3*inch])
dash_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f9fafb')),
    ('TEXTCOLOR', (0, 0), (0, -1), primary_blue),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 12),
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('ALIGN', (1, 0), (1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
content.append(dash_table)
content.append(Spacer(1, 0.2*inch))

# Section 4
content.append(Paragraph("4. Empresas (Leads)", heading_style))
content.append(Paragraph("<b>Ver todas las empresas:</b>", normal_style))
content.append(Paragraph("1. Click en <b>Empresas</b> en el menú", normal_style))
content.append(Paragraph("2. Verás una lista con todas las empresas de tu cartera", normal_style))
content.append(Spacer(1, 0.15*inch))
content.append(Paragraph("<b>Agregar nueva empresa:</b>", normal_style))
content.append(Paragraph("1. En la página de Empresas, click en <b>+ Nueva Empresa</b>", normal_style))
content.append(Paragraph("2. Completa los datos:", normal_style))
content.append(Paragraph("   • <b>Nombre de la empresa</b> (*requerido)", normal_style))
content.append(Paragraph("   • <b>Teléfono</b>", normal_style))
content.append(Paragraph("   • <b>Email</b>", normal_style))
content.append(Paragraph("   • <b>Estado</b> (Nuevo, Contactado, Interesado, No interesado, Cliente)", normal_style))
content.append(Paragraph("   • <b>Notas</b>", normal_style))
content.append(Paragraph("3. Click en <b>Guardar</b>", normal_style))
content.append(Spacer(1, 0.15*inch))
content.append(Paragraph("<b>Editar empresa:</b>", normal_style))
content.append(Paragraph("1. Busca la empresa en la lista", normal_style))
content.append(Paragraph("2. Click en el icono de ✏️", normal_style))
content.append(Paragraph("3. Modifica lo necesario", normal_style))
content.append(Paragraph("4. <b>Guardar</b>", normal_style))

# Section 5
content.append(Paragraph("5. Llamadas", heading_style))
content.append(Paragraph("<b>Registrar una llamada:</b>", normal_style))
content.append(Paragraph("1. Ve a <b>Llamadas</b> en el menú", normal_style))
content.append(Paragraph("2. Click en <b>+ Nueva Llamada</b>", normal_style))
content.append(Paragraph("3. Selecciona la <b>empresa</b>", normal_style))
content.append(Paragraph("4. Completa:", normal_style))
content.append(Paragraph("   • <b>Estado:</b> Conectado / No conectado / No responde", normal_style))
content.append(Paragraph("   • <b>Duración</b> (minutos)", normal_style))
content.append(Paragraph("   • <b>Observaciones:</b> Notas de la conversación", normal_style))
content.append(Paragraph("5. <b>Guardar</b>", normal_style))
content.append(Paragraph("⭐ Por cada llamada registrada <b>ganas puntos!</b>", tip_style))
content.append(Spacer(1, 0.15*inch))
content.append(Paragraph("<b>Ver historial de llamadas:</b>", normal_style))
content.append(Paragraph("1. Ve a <b>Llamadas</b>", normal_style))
content.append(Paragraph("2. Consulta el registro por fecha o empresa", normal_style))

# Section 6
content.append(Paragraph("6. Citas", heading_style))
content.append(Paragraph("<b>Agendar una cita:</b>", normal_style))
content.append(Paragraph("1. Ve a <b>Citas</b> en el menú", normal_style))
content.append(Paragraph("2. Click en <b>+ Nueva Cita</b>", normal_style))
content.append(Paragraph("3. Selecciona la <b>empresa</b>", normal_style))
content.append(Paragraph("4. Elige:", normal_style))
content.append(Paragraph("   • <b>Tipo:</b> Primera reunión, Seguimiento, Presentación, Cierre", normal_style))
content.append(Paragraph("   • <b>Fecha y hora</b>", normal_style))
content.append(Paragraph("   • <b>Notas</b>", normal_style))
content.append(Paragraph("5. <b>Guardar</b>", normal_style))

# Section 7
content.append(Paragraph("7. Gamificación", heading_style))
content.append(Paragraph("<b>¿Cómo ganar puntos?</b>", normal_style))

points_data = [
    ['Acción', 'Puntos'],
    ['Registrar llamada', '+10'],
    ['Llamada efectiva', '+20'],
    ['Cita completada', '+30'],
    ['Nueva empresa', '+5']
]
points_table = Table(points_data, colWidths=[3.5*inch, 1*inch])
points_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), primary_blue),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 11),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('GRID', (0, 0), (-1, -1), 1, primary_blue),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
content.append(points_table)
content.append(Spacer(1, 0.2*inch))
content.append(Paragraph("<b>Ver tu rendimiento:</b>", normal_style))
content.append(Paragraph("Click en <b>Gamificación</b> y consulta:", normal_style))
content.append(Paragraph("🔹 Tu posición en el ranking", normal_style))
content.append(Paragraph("🏆 Badges obtenidos", normal_style))
content.append(Paragraph("📊 Tu evolución de puntos", normal_style))
content.append(Paragraph("🎁 Premios: Pregunta a tu administrador qué premios puedes canjear con tus puntos", normal_style))

# Section 8
content.append(Paragraph("8. Tips y Consejos", heading_style))

tips_data = [
    ['✅', 'Registra todas tus llamadas', 'Así llevas control y ganas puntos'],
    ['✅', 'Actualiza el estado de las empresas', 'Te ayuda a priorizar'],
    ['✅', 'Agenda follow-ups', 'No dejes pasar oportunidades'],
    ['✅', 'Usa WhatsApp', 'En los contactos, click en el icono 📱 para escribir directamente'],
    ['❌', 'No dejes empresas en "Nuevo"', 'Actualiza el estado después de llamar'],
]
tips_table = Table(tips_data, colWidths=[0.5*inch, 1.8*inch, 2.7*inch])
tips_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), white),
    ('TEXTCOLOR', (0, 0), (0, -1), green),
    ('FONTSIZE', (0, 0), (-1, -1), 11),
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
content.append(tips_table)
content.append(Spacer(1, 0.2*inch))

# Shortcuts
content.append(Paragraph("🔝 Shortcuts", heading_style))
shortcuts_data = [
    ['Acción', 'Dónde'],
    ['Ver mi dashboard', 'Home (/)'],
    ['Agregar empresa', 'Empresas → + Nueva Empresa'],
    ['Registrar llamada', 'Llamadas → + Nueva Llamada'],
    ['Agendar cita', 'Citas → + Nueva Cita'],
    ['Ver puntos', 'Gamificación'],
]
shortcuts_table = Table(shortcuts_data, colWidths=[2.5*inch, 2.5*inch])
shortcuts_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), dark_blue),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f3f4f6')),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
content.append(shortcuts_table)
content.append(Spacer(1, 0.2*inch))

# Dudas
content.append(Paragraph("❓ ¿Dudas?", heading_style))
content.append(Paragraph("Contacta a tu administrador si:", normal_style))
content.append(Paragraph("• No puedes iniciar sesión", normal_style))
content.append(Paragraph("• No encuentras una empresa", normal_style))
content.append(Paragraph("• Necesitas cambiar tu contraseña", normal_style))
content.append(Spacer(1, 0.5*inch))

# Footer
content.append(Paragraph("© 2026 Teknao CRM - Versión 1.0", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=10, textColor=gray, alignment=TA_CENTER)))

# Build
doc.build(content)
print(f"PDF created: {pdf_path}")
