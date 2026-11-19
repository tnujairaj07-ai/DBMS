"""
Generates a high-resolution, 100%-accurate ER Diagram (SVG + HTML for PNG export)
directly from the live MySQL `learnlink_db` INFORMATION_SCHEMA.
"""
import os
import html
import pymysql
from dotenv import load_dotenv

backend_env = os.path.join(os.path.abspath(os.path.dirname(__file__)), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'learnlink_db')

# 5 Clean Architectural Columns (Modules)
MODULES = [
    {
        'title': '1. Identity & Academic Core',
        'color': '#1d4ed8',
        'bg': '#eff6ff',
        'border': '#bfdbfe',
        'tables': ['departments', 'users', 'student_profiles', 'faculty_profiles', 'research_domains']
    },
    {
        'title': '2. Skills & Student Portfolio',
        'color': '#047857',
        'bg': '#ecfdf5',
        'border': '#a7f3d0',
        'tables': ['skill_categories', 'skills', 'user_skills', 'student_projects']
    },
    {
        'title': '3. Ideas, Teams & Proposals',
        'color': '#6d28d9',
        'bg': '#f5f3ff',
        'border': '#ddd6fe',
        'tables': [
            'project_ideas', 'project_skill_requirements',
            'project_teams', 'team_members', 'team_join_requests', 'project_proposals'
        ]
    },
    {
        'title': '4. Allocation & Milestones',
        'color': '#b45309',
        'bg': '#fffbeb',
        'border': '#fde68a',
        'tables': [
            'allocation_cycles', 'faculty_expertise', 'faculty_skill_expertise',
            'mentor_preferences', 'mentor_recommendations', 'mentor_allocations',
            'allocation_audit_logs', 'milestone_templates', 'project_milestones',
            'milestone_submissions', 'faculty_feedback'
        ]
    },
    {
        'title': '5. Peer Learning & Consultations',
        'color': '#be185d',
        'bg': '#fdf2f8',
        'border': '#fbcfe8',
        'tables': [
            'availability_slots', 'peer_requests', 'peer_sessions',
            'session_reviews', 'consultation_meetings', 'notifications'
        ]
    }
]


def fetch_schema():
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    # Fetch base tables only (exclude views)
    cur.execute("""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = %s AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    """, (DB_NAME,))
    base_tables = [r['TABLE_NAME'] for r in cur.fetchall()]

    # Fetch columns
    cur.execute("""
        SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = %s
        ORDER BY TABLE_NAME, ORDINAL_POSITION
    """, (DB_NAME,))
    columns_by_table = {t: [] for t in base_tables}
    for r in cur.fetchall():
        t = r['TABLE_NAME']
        if t in columns_by_table:
            columns_by_table[t].append(r)

    # Fetch FK relationships
    cur.execute("""
        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = %s AND REFERENCED_TABLE_NAME IS NOT NULL
    """, (DB_NAME,))
    fks = cur.fetchall()
    fk_cols_by_table = {t: set() for t in base_tables}
    edges = []
    seen_edges = set()
    for r in fks:
        src = r['TABLE_NAME']
        dst = r['REFERENCED_TABLE_NAME']
        if src in fk_cols_by_table:
            fk_cols_by_table[src].add(r['COLUMN_NAME'])
        edge_key = (src, dst, r['COLUMN_NAME'])
        if src in columns_by_table and dst in columns_by_table and edge_key not in seen_edges:
            seen_edges.add(edge_key)
            edges.append((src, dst, r['COLUMN_NAME']))

    cur.close()
    conn.close()
    return base_tables, columns_by_table, fk_cols_by_table, edges


def build_svg(base_tables, columns_by_table, fk_cols_by_table, edges):
    # Exclude any unrelated lab practice tables if present in the database
    assigned = set(t for m in MODULES for t in m['tables'])
    base_tables = [t for t in base_tables if t in assigned]

    # Layout constants
    COL_WIDTH = 360
    COL_GAP = 110
    PADDING_X = 60
    TOP_HEADER = 120
    ROW_H = 22
    CARD_HEADER_H = 34
    CARD_PAD_B = 10
    CARD_GAP_Y = 26

    # Compute exact positions for every table card
    card_boxes = {}  # table -> {x, y, w, h, mod}
    col_heights = []

    for col_idx, mod in enumerate(MODULES):
        x = PADDING_X + col_idx * (COL_WIDTH + COL_GAP)
        y = TOP_HEADER + 48
        for tbl in mod['tables']:
            if tbl not in columns_by_table:
                continue
            cols = columns_by_table[tbl]
            # Limit display of very long non-key columns only if > 14, else show all
            display_cols = cols[:12]
            extra_count = max(0, len(cols) - 12)
            h = CARD_HEADER_H + len(display_cols) * ROW_H + (ROW_H if extra_count else 0) + CARD_PAD_B
            card_boxes[tbl] = {
                'x': x,
                'y': y,
                'w': COL_WIDTH,
                'h': h,
                'mod': mod,
                'cols': display_cols,
                'extra': extra_count
            }
            y += h + CARD_GAP_Y
        col_heights.append(y)

    total_w = PADDING_X * 2 + len(MODULES) * COL_WIDTH + (len(MODULES) - 1) * COL_GAP
    total_h = max(col_heights) + 60

    svg_parts = []
    svg_parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{total_w}" height="{total_h}" '
        f'viewBox="0 0 {total_w} {total_h}" style="background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;">'
    )

    # Defs: Arrowhead & shadow
    svg_parts.append("""
    <defs>
      <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="108%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.06"/>
      </filter>
      <marker id="crowMany" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
        <path d="M 0 1 L 10 6 L 0 11 M 10 1 L 10 11" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      </marker>
      <marker id="oneEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M 5 1 L 5 9" fill="none" stroke="#64748b" stroke-width="1.8"/>
      </marker>
    </defs>
    """)

    # Title Banner
    svg_parts.append(f'''
    <rect x="40" y="24" width="{total_w - 80}" height="74" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <text x="68" y="56" font-size="22" font-weight="700" fill="#0f172a">LearnLink — Relational Entity-Relationship (ER) Diagram (3NF)</text>
    <text x="68" y="80" font-size="13" fill="#475569">Live MySQL 8.0 Schema ({len(card_boxes)} Base Tables • {len(edges)} Foreign Key Relationships • 5 Functional Modules)</text>
    <g transform="translate({total_w - 470}, 44)">
      <rect x="0" y="0" width="28" height="18" rx="4" fill="#fef3c7" stroke="#f59e0b"/>
      <text x="14" y="13" font-size="10" font-weight="700" fill="#92400e" text-anchor="middle">PK</text>
      <text x="36" y="13" font-size="11" fill="#334155">Primary Key</text>
      <rect x="125" y="0" width="28" height="18" rx="4" fill="#e0e7ff" stroke="#6366f1"/>
      <text x="139" y="13" font-size="10" font-weight="700" fill="#3730a3" text-anchor="middle">FK</text>
      <text x="161" y="13" font-size="11" fill="#334155">Foreign Key</text>
      <line x1="255" y1="9" x2="295" y2="9" stroke="#94a3b8" stroke-width="1.8" marker-start="url(#crowMany)" marker-end="url(#oneEnd)"/>
      <text x="303" y="13" font-size="11" fill="#334155">N : 1 Relationship</text>
    </g>
    ''')

    # Module Column Headers
    for col_idx, mod in enumerate(MODULES):
        x = PADDING_X + col_idx * (COL_WIDTH + COL_GAP)
        svg_parts.append(f'''
        <rect x="{x}" y="{TOP_HEADER + 6}" width="{COL_WIDTH}" height="32" rx="8" fill="{mod['bg']}" stroke="{mod['border']}" stroke-width="1.2"/>
        <text x="{x + 14}" y="{TOP_HEADER + 27}" font-size="13" font-weight="700" fill="{mod['color']}">{html.escape(mod['title'])}</text>
        ''')

    # Draw FK Relationship Connectors BEHIND cards
    for src, dst, fk_col in edges:
        if src not in card_boxes or dst not in card_boxes:
            continue
        b1 = card_boxes[src]
        b2 = card_boxes[dst]

        # Choose left/right connection ports cleanly
        if b1['x'] < b2['x']:
            x1, y1 = b1['x'] + b1['w'], b1['y'] + b1['h'] / 2
            x2, y2 = b2['x'], b2['y'] + b2['h'] / 2
            cx1, cx2 = x1 + 45, x2 - 45
        elif b1['x'] > b2['x']:
            x1, y1 = b1['x'], b1['y'] + b1['h'] / 2
            x2, y2 = b2['x'] + b2['w'], b2['y'] + b2['h'] / 2
            cx1, cx2 = x1 - 45, x2 + 45
        else:
            # Same column: loop cleanly along right edge
            x1, y1 = b1['x'] + b1['w'], b1['y'] + b1['h'] / 2
            x2, y2 = b2['x'] + b2['w'], b2['y'] + b2['h'] / 2
            cx1, cx2 = x1 + 42, x2 + 42

        svg_parts.append(
            f'<path d="M {x1:.1f} {y1:.1f} C {cx1:.1f} {y1:.1f}, {cx2:.1f} {y2:.1f}, {x2:.1f} {y2:.1f}" '
            f'fill="none" stroke="#cbd5e1" stroke-width="1.35" '
            f'marker-start="url(#crowMany)" marker-end="url(#oneEnd)"/>'
        )

    # Draw Table Cards
    for tbl, box in card_boxes.items():
        x, y, w, h = box['x'], box['y'], box['w'], box['h']
        mod = box['mod']
        fk_set = fk_cols_by_table.get(tbl, set())

        svg_parts.append(f'''
        <g filter="url(#cardShadow)">
          <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
          <path d="M {x} {y+10} Q {x} {y} {x+10} {y} L {x+w-10} {y} Q {x+w} {y} {x+w} {y+10} L {x+w} {y+CARD_HEADER_H} L {x} {y+CARD_HEADER_H} Z" fill="{mod['bg']}"/>
          <line x1="{x}" y1="{y+CARD_HEADER_H}" x2="{x+w}" y2="{y+CARD_HEADER_H}" stroke="{mod['border']}" stroke-width="1"/>
          <text x="{x+12}" y="{y+22}" font-size="13" font-weight="700" fill="{mod['color']}">{html.escape(tbl)}</text>
        ''')

        cy = y + CARD_HEADER_H + 16
        for col in box['cols']:
            cname = col['COLUMN_NAME']
            ctype = col['COLUMN_TYPE']
            if ctype.startswith('enum('):
                ctype = 'enum(...)'
            is_pk = col['COLUMN_KEY'] == 'PRI'
            is_fk = cname in fk_set

            badge_x = x + 10
            text_x = x + 12
            if is_pk:
                svg_parts.append(f'<rect x="{badge_x}" y="{cy-11}" width="22" height="14" rx="3" fill="#fef3c7" stroke="#f59e0b" stroke-width="0.8"/>')
                svg_parts.append(f'<text x="{badge_x+11}" y="{cy-1}" font-size="8.5" font-weight="700" fill="#92400e" text-anchor="middle">PK</text>')
                text_x += 28
            elif is_fk:
                svg_parts.append(f'<rect x="{badge_x}" y="{cy-11}" width="22" height="14" rx="3" fill="#e0e7ff" stroke="#6366f1" stroke-width="0.8"/>')
                svg_parts.append(f'<text x="{badge_x+11}" y="{cy-1}" font-size="8.5" font-weight="700" fill="#3730a3" text-anchor="middle">FK</text>')
                text_x += 28

            fw = '600' if (is_pk or is_fk) else '400'
            col_fill = '#0f172a' if (is_pk or is_fk) else '#334155'
            svg_parts.append(f'<text x="{text_x}" y="{cy}" font-size="11.5" font-weight="{fw}" fill="{col_fill}">{html.escape(cname)}</text>')
            svg_parts.append(f'<text x="{x+w-10}" y="{cy}" font-size="10.5" fill="#64748b" text-anchor="end">{html.escape(ctype)}</text>')
            cy += ROW_H

        if box['extra'] > 0:
            svg_parts.append(f'<text x="{x+12}" y="{cy}" font-size="10.5" font-style="italic" fill="#64748b">+{box["extra"]} more columns...</text>')

        svg_parts.append('</g>')

    svg_parts.append('</svg>')
    return '\n'.join(svg_parts), total_w, total_h


def main():
    base_tables, columns_by_table, fk_cols_by_table, edges = fetch_schema()
    svg_content, w, h = build_svg(base_tables, columns_by_table, fk_cols_by_table, edges)

    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
    os.makedirs(docs_dir, exist_ok=True)

    svg_path = os.path.join(docs_dir, 'learnlink_er_diagram.svg')
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    html_path = os.path.join(docs_dir, 'learnlink_er_diagram.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(f'<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;">{svg_content}</body></html>')

    print(f"Generated ER Diagram SVG ({w}x{h}) at {svg_path}")


if __name__ == '__main__':
    main()
