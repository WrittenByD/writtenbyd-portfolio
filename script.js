const projects = [
  {
    id: "payments-api-lab",
    title: "Payments API Integration Lab",
    category: "Fintech & Payments",
    status: "In progress",
    year: "2026",
    featured: true,
    source: "Independent / Professional Learning",
    summary: "A configurable Node.js environment for testing authenticated payment and 3DS flows across multiple merchant stores.",
    tags: ["Node.js", "REST API", "OAuth 2.0", "3DS", "JSON"],
    problem: "Payment integrations are difficult to troubleshoot when authentication, merchant configuration, request bodies, and 3DS behaviour are tangled together.",
    built: "A local testing environment that separates store configuration from transaction logic, handles OAuth access tokens, submits structured API requests, and preserves responses for debugging.",
    decisions: [
      "Keep credentials and store-specific values outside source control.",
      "Separate authentication from transaction execution.",
      "Make request bodies easy to edit and repeat.",
      "Capture API responses to simplify troubleshooting."
    ],
    lessons: "The project reinforces the value of isolating layers in a transaction flow: authentication, configuration, request construction, gateway response, and downstream 3DS behaviour.",
    github: ""
  },
  {
    id: "audio-stem-tool",
    title: "Audio Stem Processing Tool",
    category: "Software Development",
    status: "Built",
    year: "2026",
    featured: false,
    source: "Independent Project",
    summary: "A Python/Gradio desktop workflow for separating audio stems, detecting BPM/key, renaming files, and batch-processing music.",
    tags: ["Python", "Gradio", "Demucs", "FFmpeg", "Automation"],
    problem: "Stem separation and song analysis required too many disconnected manual steps.",
    built: "A single interface for file/folder selection, batch processing, stem separation, BPM/key analysis, output renaming, cancellation, and progress tracking.",
    decisions: [
      "Use Demucs for source separation.",
      "Use Gradio for a fast local UI.",
      "Standardize output naming for downstream music workflows.",
      "Keep batch processing and cancellation visible to the user."
    ],
    lessons: "Building the tool required debugging environment variables, subprocesses, audio libraries, UI event handling, and long-running task state.",
    github: ""
  },
  {
    id: "portfolio",
    title: "WrittenByD Portfolio",
    category: "Software Development",
    status: "Live build",
    year: "2026",
    featured: false,
    source: "Portfolio Infrastructure",
    summary: "The site you are viewing: a reusable project library designed to turn coursework into inspectable case studies.",
    tags: ["HTML", "CSS", "JavaScript", "GitHub"],
    problem: "Certificates alone do not show how technical knowledge is applied.",
    built: "A responsive project portfolio with category filters, searchable cards, structured case-study modals, skills mapping, and credential tracking.",
    decisions: [
      "Start with lightweight HTML/CSS/JavaScript.",
      "Keep project data structured so new work is easy to add.",
      "Prioritize readable case studies over decorative portfolio pieces.",
      "Design the information architecture so it can later migrate to a framework."
    ],
    lessons: "The portfolio itself is treated as a product: the architecture should make adding the tenth project almost as easy as adding the first.",
    github: "https://github.com/WrittenByD/writtenbyd-portfolio"
  },
  {
    id: "coming-cloud",
    title: "Cloud Project Slot",
    category: "Cloud & DevOps",
    status: "Next build",
    year: "—",
    featured: false,
    source: "Coursera Learning Path",
    summary: "Reserved for the first deployable AWS/cloud project produced from upcoming coursework.",
    tags: ["AWS", "Cloud", "Deployment"],
    problem: "To be defined by the course project.",
    built: "This slot will become a full case study once the project is completed.",
    decisions: ["Document architecture.", "Track deployment choices.", "Capture failures and fixes.", "Publish reproducible steps."],
    lessons: "Pending.",
    github: ""
  },
  {
    id: "coming-data",
    title: "Data & Analytics Project Slot",
    category: "Data & Analytics",
    status: "Next build",
    year: "—",
    featured: false,
    source: "Coursera Learning Path",
    summary: "Reserved for a data analysis project with a real dataset, documented questions, transformations, findings, and visualization.",
    tags: ["SQL", "Python", "Analytics"],
    problem: "To be defined by the course project.",
    built: "This slot will become a full case study once the project is completed.",
    decisions: ["Use a real dataset.", "State the analytical question first.", "Make transformations reproducible.", "Explain findings plainly."],
    lessons: "Pending.",
    github: ""
  },
  {
    id: "coming-security",
    title: "Networking & Security Project Slot",
    category: "Networking & Security",
    status: "Next build",
    year: "—",
    featured: false,
    source: "Coursera Learning Path",
    summary: "Reserved for a networking or security lab that demonstrates configuration, diagnosis, hardening, or incident analysis.",
    tags: ["Networking", "Security", "Linux"],
    problem: "To be defined by the course project.",
    built: "This slot will become a full case study once the project is completed.",
    decisions: ["Capture topology.", "Document test conditions.", "Show the failure state.", "Show how the fix was verified."],
    lessons: "Pending.",
    github: ""
  }
];

const grid = document.querySelector("#project-grid");
const filterWrap = document.querySelector("#project-filters");
const searchInput = document.querySelector("#project-search");
const emptyState = document.querySelector("#project-empty");
const projectCount = document.querySelector("#project-count");
const modal = document.querySelector("#project-modal");
const modalContent = document.querySelector("#modal-content");
const modalClose = document.querySelector(".modal-close");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav");

let activeCategory = "All";
let searchTerm = "";

const categories = ["All", ...new Set(projects.map(project => project.category))];

function renderFilters() {
  filterWrap.innerHTML = categories.map(category => `
    <button
      class="filter-button ${category === activeCategory ? "active" : ""}"
      type="button"
      data-category="${category}">
      ${category}
    </button>
  `).join("");

  filterWrap.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderProjects();
    });
  });
}

function getFilteredProjects() {
  const term = searchTerm.toLowerCase();

  return projects.filter(project => {
    const categoryMatches = activeCategory === "All" || project.category === activeCategory;
    const searchable = [
      project.title,
      project.category,
      project.summary,
      project.source,
      ...project.tags
    ].join(" ").toLowerCase();

    return categoryMatches && searchable.includes(term);
  });
}

function renderProjects() {
  const filtered = getFilteredProjects();

  grid.innerHTML = filtered.map((project, index) => {
    const cardClass = project.featured ? "featured" : (index > 2 ? "compact" : "");

    return `
      <article class="project-card ${cardClass}">
        <div class="project-topline">
          <span>${project.category.toUpperCase()}</span>
          <span class="project-status">${project.status}</span>
        </div>

        <h3>${project.title}</h3>
        <p>${project.summary}</p>

        <div class="project-tags">
          ${project.tags.map(tag => `<span>${tag}</span>`).join("")}
        </div>

        <div class="project-footer">
          <button type="button" data-project="${project.id}">View case study →</button>
          <span class="project-source">${project.year}</span>
        </div>
      </article>
    `;
  }).join("");

  emptyState.hidden = filtered.length > 0;

  grid.querySelectorAll("[data-project]").forEach(button => {
    button.addEventListener("click", () => openProject(button.dataset.project));
  });
}

function openProject(id) {
  const project = projects.find(item => item.id === id);
  if (!project) return;

  modalContent.innerHTML = `
    <div class="modal-inner">
      <p class="eyebrow">${project.category.toUpperCase()} / ${project.year}</p>
      <h2>${project.title}</h2>
      <p>${project.summary}</p>

      <div class="project-tags">
        ${project.tags.map(tag => `<span>${tag}</span>`).join("")}
      </div>

      <div class="case-grid">
        <section class="case-block">
          <h3>Problem</h3>
          <p>${project.problem}</p>
        </section>

        <section class="case-block">
          <h3>What I built</h3>
          <p>${project.built}</p>
        </section>

        <section class="case-block">
          <h3>Key decisions</h3>
          <ul>
            ${project.decisions.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </section>

        <section class="case-block">
          <h3>What I learned</h3>
          <p>${project.lessons}</p>
        </section>
      </div>

      <div class="modal-links">
        ${project.github ? `<a class="button button-primary" href="${project.github}" target="_blank" rel="noreferrer">View GitHub ↗</a>` : ""}
        <button class="button button-ghost" type="button" onclick="document.querySelector('#project-modal').close()">Close</button>
      </div>
    </div>
  `;

  modal.showModal();
}

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value.trim();
  renderProjects();
});

modalClose.addEventListener("click", () => modal.close());

modal.addEventListener("click", event => {
  const rect = modal.getBoundingClientRect();
  const outside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (outside) modal.close();
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

projectCount.textContent = projects.filter(project => !project.title.includes("Slot")).length;

renderFilters();
renderProjects();
