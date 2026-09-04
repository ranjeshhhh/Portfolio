const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const root = document.documentElement;

// ---------------- Theme ----------------
const savedTheme = localStorage.getItem("portfolio-theme");
if (savedTheme === "day") root.dataset.theme = "day";

const updateThemeIcon = () => {
  const icon = $("#themeToggle i");
  if (!icon) return;
  icon.className = root.dataset.theme === "day"
    ? "fa-solid fa-moon"
    : "fa-solid fa-sun";
};

$("#themeToggle").addEventListener("click", () => {
  if (root.dataset.theme === "day") {
    delete root.dataset.theme;
    localStorage.setItem("portfolio-theme", "night");
  } else {
    root.dataset.theme = "day";
    localStorage.setItem("portfolio-theme", "day");
  }
  updateThemeIcon();
});
updateThemeIcon();

// ---------------- Footer year ----------------
$("#year").textContent = new Date().getFullYear();

// ---------------- Scroll reveal ----------------
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

$$(".reveal").forEach((el) => observer.observe(el));

// ---------------- Active navigation + progress ----------------
const sections = $$("main section[id]");
const navLinks = $$("nav a");

function updateScrollUI() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (y / max) * 100 : 0;
  $(".scroll-progress span").style.width = `${Math.min(100, progress)}%`;

  let current = "home";
  sections.forEach((section) => {
    if (y >= section.offsetTop - 180) current = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}
window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

// ---------------- Mobile menu ----------------
const nav = $("#nav");
$("#menuBtn").addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  $("#menuBtn").setAttribute("aria-expanded", String(isOpen));
  $("#menuBtn i").className = isOpen
    ? "fa-solid fa-xmark"
    : "fa-solid fa-bars";
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    $("#menuBtn").setAttribute("aria-expanded", "false");
    $("#menuBtn i").className = "fa-solid fa-bars";
  });
});

// ---------------- Skill filters ----------------
$$(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".filter").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.filter;
    $$(".skill-card").forEach((card) => {
      card.style.display =
        category === "all" || card.dataset.cat === category
          ? "flex"
          : "none";
    });
  });
});

// ---------------- Cursor glow ----------------
const glow = $(".cursor-glow");
window.addEventListener("pointermove", (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

// ---------------- Hero portrait tilt ----------------
const tilt = $(".tilt");
if (tilt) {
  tilt.addEventListener("pointermove", (event) => {
    const rect = tilt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    tilt.style.transform =
      `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.015)`;
  });

  tilt.addEventListener("pointerleave", () => {
    tilt.style.transform = "";
  });
}

// ---------------- Contact form ----------------
$("#contactForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const status = $("#formStatus");
  const data = Object.fromEntries(new FormData(form).entries());

  status.textContent = "Sending...";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to send");

    status.textContent = result.emailSent
      ? "Message sent successfully."
      : "Message saved successfully.";

    form.reset();
  } catch (error) {
    status.textContent =
      "Backend is not running. Start it with: cd backend && npm install && npm start";
  }
});

// ---------------- AI chatbot ----------------
const facts = {
  about:
    "Ranjesh Yadav is a B.Tech CSE (AI & ML) student and full-stack developer who enjoys building practical web and AI-powered solutions.",
  skills:
    "The portfolio highlights HTML, CSS, JavaScript, React, Node.js, Python, Java, C++, MongoDB, MySQL, Git and Tailwind CSS, with a focus on AI/ML and web development.",
  projects:
    "Featured projects include EXAMLOCK, a secure exam platform with encryption and AI proctoring; an AI Chatbot concept; and this modern portfolio website.",
  education:
    "He is pursuing B.Tech in Computer Science & Engineering with an AI & ML specialization. The portfolio also includes 12th (PCM) and previous Diploma in CSE.",
  contact:
    "You can use the Contact section to send a message. Social icons in the hero and contact sections open the linked social profiles.",
  website:
    "This portfolio uses HTML, CSS and JavaScript with a Node.js/Express backend. It includes animations, responsive design, day/night mode, project links, contact handling and an AI assistant."
};

function localAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("skill") || q.includes("technology") || q.includes("tech"))
    return facts.skills;
  if (q.includes("project"))
    return facts.projects;
  if (q.includes("education") || q.includes("study") || q.includes("college"))
    return facts.education;
  if (q.includes("contact") || q.includes("email") || q.includes("reach"))
    return facts.contact;
  if (q.includes("website") || q.includes("built") || q.includes("stack"))
    return facts.website;
  if (q.includes("who") || q.includes("about") || q.includes("ranjesh"))
    return facts.about;

  return "I can tell you about Ranjesh, his skills, projects, education, contact details, or this portfolio.";
}

function addMessage(text, type) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;
  $("#chatBody").appendChild(bubble);
  $("#chatBody").scrollTop = $("#chatBody").scrollHeight;
}

async function sendChat(text) {
  if (!text.trim()) return;

  addMessage(text, "user");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Chat failed");

    addMessage(result.reply, "bot");
  } catch {
    setTimeout(() => {
      addMessage(
        `${localAnswer(text)} (Local fallback — start the backend for the real AI assistant.)`,
        "bot"
      );
    }, 180);
  }
}

$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  sendChat(input.value);
  input.value = "";
});

$$(".quick button").forEach((button) => {
  button.addEventListener("click", () => sendChat(button.textContent));
});

$("#chatLauncher").addEventListener("click", () => {
  $("#chatbot").classList.add("open");
  $("#chatInput").focus();
});

$("#chatClose").addEventListener("click", () => {
  $("#chatbot").classList.remove("open");
});
