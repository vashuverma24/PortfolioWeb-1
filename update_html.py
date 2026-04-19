import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Navbar
nav_old = """        <nav class="site-nav" aria-label="Primary">
          <a href="#home" data-nav-link>Home</a>
          <a href="#projects" data-nav-link>Work</a>
          <a href="#about" data-nav-link>About</a>
          <a href="#experience" data-nav-link>Experience</a>
          <a href="#contact" data-nav-link>Contact</a>
        </nav>"""

nav_new = """        <nav class="site-nav" aria-label="Primary">
          <a href="#home" data-nav-link>Home</a>
          <a href="#about" data-nav-link>About</a>
          <a href="#projects" data-nav-link>Work</a>
          <a href="#skills" data-nav-link>Skills</a>
          <a href="#experience" data-nav-link>Experience</a>
          <a href="#contact" data-nav-link>Contact</a>
        </nav>"""
html = html.replace(nav_old, nav_new)

# 2. Extract About section (down to before Skills)
about_start = html.find('<section class="section about-section" id="about">')
if about_start == -1:
    print("Could not find about section")
    exit(1)

skills_start = html.find('<div class="skills-flat">', about_start)
about_actions_start = html.find('<div class="about-actions">', skills_start)
about_end = html.find('</section>', about_actions_start) + len('</section>\n')
stats_modal_start = html.find('<div class="stats-modal"', about_end)
stats_modal_end = html.find('</div>\n        </div>', stats_modal_start) + len('</div>\n        </div>\n')

# The skills block we want to extract
skills_block = html[skills_start:about_actions_start]

# We reconstruct the About section without skills
about_section_html = html[about_start:skills_start] + "              " + html[about_actions_start:about_end]
modal_html = html[stats_modal_start:stats_modal_end]

# 3. Create Skills section
skills_section_html = f"""
        <section class="section" id="skills">
          <div class="section-heading reveal">
            <div>
              <p class="eyebrow">Skills</p>
              <h2>What I <em>know</em></h2>
            </div>
          </div>
          <div style="padding: 0 1rem; max-width: 64rem; margin: 0 auto;">
{skills_block}          </div>
        </section>
"""

# 4. Remove About section and Modal from their original place
original_about_and_modal = html[about_start:stats_modal_end]
html = html.replace(original_about_and_modal, "")

# 5. Find Projects section
projects_start = html.find('<section class="project-prowess section" id="projects">')
projects_end = html.find('</section>', projects_start) + len('</section>\n')

# 6. Add "How I Build Products" to the end of Projects
how_i_build = """
          <div class="reveal" style="margin-top: 4rem; padding: 2rem; background: var(--surface); border-radius: 20px; border: 1px solid var(--line);">
            <p class="eyebrow" style="margin-bottom: 0.5rem;">Process</p>
            <h3 style="font-size: 2rem; margin-bottom: 1.5rem;">How I <em>Build Products</em></h3>
            <p style="font-size: 1rem; line-height: 1.7; color: var(--text);">I follow a structured approach to product building:</p>
            <p style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--accent); margin: 1rem 0; letter-spacing: 0.05em; padding: 1rem; background: var(--bg); border-radius: 12px; border: 1px solid var(--line);">Problem &rarr; Research &rarr; UX Design &rarr; Development &rarr; Iteration</p>
            <ul style="list-style-type: none; padding: 0; display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1.5rem;">
              <li style="display: flex; align-items: flex-start; gap: 0.8rem;"><span style="color: var(--accent);">✦</span> <span style="font-size: 0.95rem;">Use AI tools to speed up ideation and prototyping</span></li>
              <li style="display: flex; align-items: flex-start; gap: 0.8rem;"><span style="color: var(--accent);">✦</span> <span style="font-size: 0.95rem;">Focus on simplicity, usability, and real user value</span></li>
            </ul>
          </div>
"""
# insert before the closing </section> of projects
html = html[:projects_end - len('</section>\n')] + how_i_build + html[projects_end - len('</section>\n'):]

# Re-calculate projects_start as we've changed strings
projects_start = html.find('<section class="project-prowess section" id="projects">')

# 7. Insert About section BEFORE Projects
html = html[:projects_start] + about_section_html + "\n\n" + modal_html + "\n\n" + html[projects_start:]

# 8. Re-calculate projects_end
projects_end = html.find('</section>', html.find('<section class="project-prowess section" id="projects">')) + len('</section>\n')

# 9. Insert Skills section AFTER Projects
html = html[:projects_end] + "\n\n" + skills_section_html + html[projects_end:]

# 10. Find Contact section
contact_start = html.find('<section class="section" id="contact">')

# 11. Add "What I Can Do" before Contact
what_i_can_do = """
        <section class="section reveal" id="what-i-can-do">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Capabilities</p>
              <h2>What I <em>Can Do</em></h2>
            </div>
          </div>
          <div style="font-size: 1.2rem; line-height: 1.6; max-width: 48rem;">
            I leverage AI tools to rapidly prototype and build applications across iOS, Android, and web platforms.
          </div>
        </section>
"""
html = html[:contact_start] + what_i_can_do + "\n\n" + html[contact_start:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("HTML update successful.")
