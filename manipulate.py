import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Validate that we can extract the sections
projects_match = re.search(r'(<section class="project-prowess section" id="projects">.*?</section>\n)', text, re.DOTALL)
if not projects_match:
    print("Failed to find projects")
    exit(1)
projects_str = projects_match.group(1)

about_match = re.search(r'(<section class="section about-section" id="about">.*?</section>\s*<div class="stats-modal".*?</div>\s*</div>\n)', text, re.DOTALL)
if not about_match:
    print("Failed to find about")
    exit(1)
about_str = about_match.group(1)

print(f"Projects length: {len(projects_str)}, About length: {len(about_str)}")

skills_match = re.search(r'(\s*<div class="skills-flat">.*?</div>\n              </div>\n)', about_str, re.DOTALL)
if not skills_match:
    print("Failed to find skills in about")
    exit(1)

skills_str = skills_match.group(1)
about_str_new = about_str.replace(skills_str, '\n') # remove skills from about
print(f"Skills length: {len(skills_str)}")

skills_section = f"""
        <section class="section" id="skills">
          <div class="section-heading reveal">
            <div>
              <p class="eyebrow">Skills</p>
              <h2>My <em>Toolkit</em></h2>
            </div>
          </div>
{skills_str}
        </section>
"""

# Now how to add "How I Build Products".
# Inside projects_str, there is <div class="project-secondary-grid">...</div>
# I will insert a new article at the end of the grid.
how_i_build = """
            <article class="project-secondary-card project-secondary-card-wide reveal" style="padding: 2.5rem; display: flex; flex-direction: column; justify-content: center; background: var(--surface);">
              <div class="project-secondary-copy" style="max-width: 100%;">
                <p class="card-label" style="font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem; color: var(--accent);">How I Build Products</p>
                <h3 style="margin-bottom: 1rem; line-height: 1.4;">I follow a structured approach to product building:<br/><em style="font-size: 0.9em;">Problem &rarr; Research &rarr; UX Design &rarr; Development &rarr; Iteration</em></h3>
                <ul style="list-style-type: none; margin-left: 0; padding-left: 0; color: var(--muted); font-size: 0.95rem; line-height: 1.8; font-family: var(--font-sans);">
                  <li style="position: relative; padding-left: 1.2rem;"><span style="position: absolute; left: 0; color: var(--accent);">&#8226;</span> Use AI tools to speed up ideation and prototyping</li>
                  <li style="position: relative; padding-left: 1.2rem;"><span style="position: absolute; left: 0; color: var(--accent);">&#8226;</span> Focus on simplicity, usability, and real user value</li>
                </ul>
              </div>
            </article>
"""

# wait, there's a `<div class="project-secondary-grid">` that wraps `.project-secondary-card`
grid_end_idx = projects_str.rfind('</div>\n        </section>')
if grid_end_idx == -1:
    print("Could not find grid end in projects")
    exit(1)

projects_str_new = projects_str[:grid_end_idx] + how_i_build + projects_str[grid_end_idx:]

# Assemble them:
# Original sequence: hero -> projects -> about -> experience
# New sequence: hero -> about -> projects -> skills -> experience
# Replace projects with (about + projects)
# Replace about with (skills)
text_new = text.replace(projects_str, about_str_new + '\n' + projects_str_new)
text_new = text_new.replace(about_str, skills_section)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text_new)

print("Success")
