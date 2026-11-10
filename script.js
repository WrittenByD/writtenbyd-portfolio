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
    id: "moneris-checkout-json",
    title: "Moneris Checkout JSON Builder",
    category: "Fintech & Payments",
    status: "Live tool",
    year: "2026",
    featured: false,
    source: "Independent Fintech Tool",
    summary: "A browser-based form that turns Moneris Checkout preload inputs into a clean JSON request body and matching QA or production endpoint.",
    tags: ["Moneris Checkout", "JSON", "JavaScript", "Payments"],
    problem: "Preload request bodies are easy to mistype when repeatedly building or troubleshooting Moneris Checkout integrations by hand.",
    built: "A lightweight client-side generator for required and common optional preload fields. Blank optional values are omitted and the tool never sends the request.",
    decisions: [
      "Keep the tool client-side and local-only.",
      "Do not submit API tokens or preload requests from the browser.",
      "Generate the endpoint from the selected environment.",
      "Keep the first version focused on top-level preload fields."
    ],
    lessons: "The tool turns a repetitive integration task into a small reusable workflow while keeping the request structure visible and easy to explain.",
    github: "https://github.com/WrittenByD/writtenbyd-portfolio",
    demo: "moneris-checkout-json.html"
  },

  {
    id: "moneris-checkout-demo",
    title: "Moneris Checkout QA Demo",
    category: "Fintech & Payments",
    status: "Live demo",
    year: "2026",
    featured: false,
    source: "Independent Fintech Lab",
    summary: "A customer-facing QA checkout flow that accepts an amount, requests a secure preload ticket from a Cloudflare Worker, and launches Moneris Hosted Checkout.",
    tags: ["Moneris Checkout", "Cloudflare Workers", "JavaScript", "Payments"],
    problem: "A real checkout demo needs to keep Moneris credentials off the public site while still letting a browser launch a hosted payment instance.",
    built: "A QA-only customer flow with a static frontend on GitHub Pages and a serverless backend that performs preload and receipt requests to Moneris.",
    decisions: [
      "Keep Store ID, API token, and Checkout ID in Cloudflare secrets.",
      "Send only the transaction amount from the browser to the backend.",
      "Return only the temporary checkout ticket to the browser.",
      "Restrict the Worker to approved browser origins."
    ],
    lessons: "The demo separates public UI from secret-bearing server logic and demonstrates the full preload-to-hosted-checkout architecture.",
    github: "https://github.com/WrittenByD/writtenbyd-portfolio",
    demo: "moneris-checkout-demo.html"
  },

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
          <div class="project-actions">
            <button type="button" data-project="${project.id}">View case study →</button>
            ${project.demo ? `<a href="${project.demo}">Open demo →</a>` : ""}
          </div>
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
        ${project.demo ? `<a class="button button-primary" href="${project.demo}">Open tool →</a>` : ""}
        ${project.github ? `<a class="button button-ghost" href="${project.github}" target="_blank" rel="noreferrer">View GitHub ↗</a>` : ""}
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
