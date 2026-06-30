import os
import re

files = [
    'src/pages/casos-de-uso/agencias.astro',
    'src/pages/casos-de-uso/comercializadoras.astro',
    'src/pages/casos-de-uso/saas.astro',
    'src/pages/casos-de-uso/software-factory.astro',
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add uc-hero-trust-group
    # We find the start of <!-- HERO SECTION -->
    # and the end of the uc-trust section </section>
    
    # regex to find the hero section and trust section
    # We will just replace <!-- HERO SECTION --> with the wrapper start
    content = content.replace(
        '<!-- HERO SECTION -->\n        <header class="uc-hero">',
        '<!-- HERO & TRUST WRAPPER -->\n        <div class="uc-hero-trust-group">\n\n            <!-- HERO SECTION -->\n            <header class="uc-hero">'
    )

    # Move uc-hero-bg out of header
    bg_match = re.search(r'(<div class="uc-hero-bg">.*?</div>)', content, re.DOTALL)
    if bg_match:
        bg_html = bg_match.group(1)
        # remove it from its current position
        content = content.replace(bg_html + '\n', '')
        # put it right after <div class="uc-hero-trust-group">
        content = content.replace(
            '<div class="uc-hero-trust-group">\n',
            '<div class="uc-hero-trust-group">\n            ' + bg_html + '\n'
        )
    
    # Close the wrapper after </section> of uc-trust
    trust_end = re.search(r'<!-- LOGOS / TRUST -->.*?</section>', content, re.DOTALL)
    if trust_end:
        trust_html = trust_end.group(0)
        content = content.replace(trust_html, trust_html + '\n        </div>')

    # Update CSS
    
    # Replace .uc-hero { ... }
    hero_css_old = '''    .uc-hero {
        position: relative;
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        align-items: center;
        padding: 8rem 0 4rem;
        background: #ffffff;
        overflow: hidden;
        border-bottom: 1px solid var(--color-border);
    }'''
    hero_css_new = '''    .uc-hero-trust-group {
        position: relative;
        overflow: hidden;
        background: #ffffff;
        border-bottom: 1px solid var(--color-border);
    }

    /* ── HERO SECTION ── */
    .uc-hero {
        position: relative;
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        align-items: center;
        padding: 8rem 0 4rem;
    }'''
    content = content.replace(hero_css_old, hero_css_new)
    
    # Replace .uc-trust { ... }
    trust_css_old = '''    .uc-trust {
        text-align: center;
        padding: 3rem 5%;
        background: var(--color-bg);
    }'''
    trust_css_new = '''    .uc-trust {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 3rem 5%;
    }'''
    content = content.replace(trust_css_old, trust_css_new)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
