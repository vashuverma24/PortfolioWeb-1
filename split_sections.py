import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

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
content = content.replace(nav_old, nav_new)

# 2. Extract About section (including stats modal)
about_match = re.search(r'(<section class="section about-section" id="about">.*?</section>\s*<div class="stats-modal".*?</div>\s*</div>)', content, re.DOTALL)
about_section_html = about_match.group(1)
content = content.replace(about_section_html, '')

# 3. Insert About section before Projects section
projects_start = '<section class="project-prowess section" id="projects">'
content = content.replace(projects_start, about_section_html + '\n\n        ' + projects_start)

# 4. Extract Skills from About section
skills_match = re.search(r'(\s*<div class="skills-flat">.*?</div>\n              </div>)', content, re.DOTALL)
skills_flat_html = skills_match.group(1)

# Remove skills-flat from its new location in About section
content = content.replace(skills_flat_html, '')

# Add wrapper for skills section
skills_section = f"""
        <section class="section" id="skills">
          <div class="section-heading reveal">
            <div>
              <p class="eyebrow">Skills</p>
              <h2>What I <em>know</em></h2>
            </div>
          </div>

          <div class="reveal">
{skills_flat_html}
          </div>
        </section>
"""

# Insert skills section after Projects section
projects_end_match = re.search(r'(</section>)\s*(<section class="section" id="experience">)', content, re.DOTALL)
projects_end = projects_end_match.group(1)
experience_start = projects_end_match.group(2)

# Oh wait, since we moved About, Projects is now right before Experience (since About was after Projects).
content = content.replace(f"{projects_end}\n\n        {experience_start}", f"{projects_end}\n{skills_section}\n        {experience_start}")

# 5. Add "How I Build Products" to Work (Projects) section
how_i_build = """
            <article class="project-secondary-card project-secondary-card-wide reveal" style="padding: 2.5rem; display: flex; flex-direction: column; justify-content: center; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--line);">
              <div class="project-secondary-copy" style="max-width: 100%;">
                <p class="card-label" style="font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem; color: var(--accent);">How I Build Products</p>
                <h3 style="margin-bottom: 1rem; line-height: 1.4;">I follow a structured approach to product building:<br><em>Problem &rarr; Research &rarr; UX Design &rarr; Development &rarr; Iteration</em></h3>
                <ul style="list-style-type: none; margin-left: 0; padding-left: 0; color: var(--muted); font-size: 0.95rem; line-height: 1.8; font-family: var(--font-sans);">
                  <li style="position: relative; padding-left: 1.2rem;"><span style="position: absolute; left: 0; color: var(--accent);">&#8226;</span> Use AI tools to speed up ideation and prototyping</li>
                  <li style="position: relative; padding-left: 1.2rem;"><span style="position: absolute; left: 0; color: var(--accent);">&#8226;</span> Focus on simplicity, usability, and real user value</li>
                </ul>
              </div>
            </article>
"""

# Insert it inside .project-secondary-grid before it closes
secondary_grid_close = '</div>\n        </section>'
if 'project-secondary-grid' in content: # just to be safe
    # We find the end of project-secondary-grid inside projects
    # Let's target the exact end of projects
    pass

content = content.replace('          </div>\n        </section>\n\n        <section class="section about-section" id="about">', how_i_build + '\n          </div>\n        </section>\n\n        <section class="section about-section" id="about">')
# Wait, the string to replace has changed since we moved About section.
# Now Projects is followed by Skills.
content = content.replace('          </div>\n        </section>\n\n        <section class="section" id="skills">', how_i_build + '\n          </div>\n        </section>\n\n        <section class="section" id="skills">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

