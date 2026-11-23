/**
 * Seeds editable demo content. Everything here is placeholder material that can be
 * replaced from the dashboard — the clients, testimonials and figures are samples,
 * not real companies, reviews or verified results.
 *
 *   npm run db:seed            → seeds an empty database (no-op if content exists)
 *   npm run db:seed -- --force → wipes content tables and seeds again (users are kept)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { SECTION_DEFAULTS, SECTION_KEYS } from "../lib/fields";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const force = process.argv.includes("--force");

const name = process.env.SEED_DEVELOPER_NAME?.trim() || "Your Name";
const firstName = name.split(/\s+/)[0];
// Short names fit the hero heading in full; longer ones use the first name.
const headingName = (name.length <= 12 ? name : firstName).toUpperCase();

async function seedMedia(file: string, alt: string, width: number, height: number) {
  return db.media.create({
    data: {
      url: `/seed/${file}`, key: `seed/${file}`, provider: "seed", filename: file,
      mime: "image/svg+xml", size: 0, width, height, alt,
    },
  });
}

async function main() {
  const existing = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (existing && !force) {
    console.log("Content already exists — skipping. Use `npm run db:seed -- --force` to reset demo content.");
  } else {
    if (existing) {
      await db.$transaction([
        db.leadNote.deleteMany(), db.contactLead.deleteMany(), db.analyticsEvent.deleteMany(), db.redirect.deleteMany(),
        db.projectImage.deleteMany(), db.project.deleteMany(), db.testimonial.deleteMany(), db.client.deleteMany(),
        db.skill.deleteMany(), db.statistic.deleteMany(), db.navItem.deleteMany(), db.socialLink.deleteMany(),
        db.sEOSettings.deleteMany(), db.pageSection.deleteMany(), db.page.deleteMany(), db.siteSettings.deleteMany(),
        db.media.deleteMany(),
      ]);
    }
    await seedContent();
    console.log("Demo content seeded.");
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "change-me-now-please";
  if (!(await db.user.findUnique({ where: { email } }))) {
    await db.user.create({
      data: { email, name: "Site Owner", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(`Admin user created: ${email} — change the password after your first sign-in.`);
  }
}

async function seedContent() {
  const portrait = await seedMedia("portrait.svg", `Portrait of ${name}`, 800, 860);
  const favicon = await seedMedia("favicon.svg", "Site icon", 64, 64);

  await db.siteSettings.create({
    data: {
      id: 1,
      siteName: `${name} — Application Developer`,
      logoText: name.length <= 14 ? name : firstName,
      developerName: name,
      professionalTitle: "Full-Stack Application Developer",
      email: "hello@example.com",
      phone: "+000 0000 000000",
      whatsapp: "",
      location: "Your City, Country",
      footerText: `© {year} ${name}. All rights reserved.`,
      footerCredit: "",
      navCtaLabel: "Book A Call",
      navCtaHref: "#contact",
      emailFromName: name,
      autoReplyBody:
        "Hi {name},\n\nThanks for getting in touch. I've received your message and will get back to you within one to two business days.",
      profileImageId: portrait.id,
      faviconId: favicon.id,
    },
  });

  const page = await db.page.create({ data: { slug: "home", title: "Home" } });
  await db.sEOSettings.create({
    data: {
      pageId: page.id,
      title: `${name} — Full-Stack Application Developer`,
      titleTemplate: `%s — ${name}`,
      description:
        "Full-stack application developer building scalable, high-performance web applications, SaaS products and e-commerce solutions with Laravel, React, Next.js and Node.js.",
      keywords: "application developer, full-stack developer, Laravel developer, Next.js developer",
      ogTitle: "",
      ogDescription: "",
    },
  });

  const content: Record<string, object> = {
    hero: {
      headingLine1: "I AM",
      headingLine2: headingName,
      headingSize: headingName.length > 7 ? "md" : "lg",
      titleLine1: "Application",
      titleLine2: "Developer",
      description:
        "I'm an Application Developer with a passion for building scalable, high-performance, and user-focused digital applications. I transform complex ideas into elegant, functional, and reliable software solutions.",
      supporting: "Building Digital Applications That Perform & Scale",
    },
    about: {
      biography:
        "I'm an Application Developer passionate about creating powerful, scalable, and intuitive digital experiences. With experience in modern web technologies and application architecture, I develop custom solutions that solve real-world problems. From frontend interfaces to backend systems, my focus is on performance, usability, maintainability, and delivering meaningful results.",
      highlightValue: "100%",
      highlightText: "Sample highlight — replace with a measurable result from your own work",
      journey:
        "My journey in software began with curiosity about how applications work behind the screen. Over the years that curiosity turned into a craft — designing data models, building APIs, and shipping interfaces people enjoy using.",
      features: [
        "4+ Years of Experience",
        "Focused on Web & SaaS Applications",
        "Laravel, React, Next.js, Node.js, and More",
        "Clear Communicator & Detail-Oriented",
      ],
    },
    clients: { description: "Sample logos — replace with the teams and companies you have worked with." },
    contact: {
      description: "",
      budgetOptions: ["Under $1,000", "$1,000 – $5,000", "$5,000 – $10,000", "$10,000+"],
      projectTypes: ["Web Application", "SaaS Product", "E-commerce", "API / Backend", "WordPress", "Other"],
    },
  };
  for (const [order, key] of SECTION_KEYS.entries()) {
    await db.pageSection.create({
      data: { pageId: page.id, key, order, content: { ...SECTION_DEFAULTS[key], ...(content[key] ?? {}) } as object },
    });
  }

  await db.navItem.createMany({
    data: [
      { label: "About Me", href: "/#about" },
      { label: "Portfolio", href: "/#projects" },
      { label: "Projects", href: "/projects" },
      { label: "Contact", href: "/#contact" },
    ].map((item, order) => ({ ...item, order })),
  });

  await db.socialLink.createMany({
    data: [
      { platform: "github", label: "GitHub", url: "https://github.com/" },
      { platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" },
      { platform: "x", label: "X", url: "https://x.com/" },
    ].map((item, order) => ({ ...item, order })),
  });

  await db.skill.createMany({
    data: [
      "Application Development", "Web Development", "Full-Stack Development", "Laravel", "PHP", "JavaScript", "React",
      "Next.js", "Node.js", "WordPress", "REST APIs", "Database Architecture", "SaaS Applications", "E-commerce Solutions",
    ].map((label, order) => ({ label, order, visible: order < 6 || order === 12 })),
  });

  await db.statistic.createMany({
    data: [
      { group: "HERO" as const, value: "24/7", label: "Available for Support" },
      { group: "HERO" as const, value: "4+", label: "Years Experience" },
      { group: "ABOUT" as const, value: "300+", label: "Projects Completed" },
      { group: "ABOUT" as const, value: "40+", label: "Industries Served" },
      { group: "ABOUT" as const, value: "95%", label: "Client Satisfaction" },
      { group: "ABOUT" as const, value: "20+", label: "Countries Reached" },
    ].map((item, order) => ({ ...item, order })),
  });

  const projects = [
    { title: "Inventory Management SaaS", category: "SaaS Application", tech: ["Laravel", "PHP", "React", "PostgreSQL", "REST APIs"] },
    { title: "E-commerce Storefront", category: "E-commerce Solution", tech: ["Next.js", "Node.js", "Stripe", "PostgreSQL"] },
    { title: "Clinic Booking Platform", category: "Web Application", tech: ["Laravel", "Vue.js", "MySQL"] },
    { title: "Logistics Tracking Dashboard", category: "Web Application", tech: ["React", "Node.js", "WebSockets", "Redis"] },
    { title: "Learning Management System", category: "SaaS Application", tech: ["Next.js", "Prisma", "PostgreSQL"] },
    { title: "Membership Site & Plugin", category: "WordPress", tech: ["WordPress", "PHP", "JavaScript"] },
  ];
  for (const [i, p] of projects.entries()) {
    const image = await seedMedia(`project-${i + 1}.svg`, `${p.title} — interface preview`, 800, 800);
    await db.project.create({
      data: {
        title: p.title,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        category: p.category,
        technologies: p.tech,
        shortDescription: `Demo project: a ${p.category.toLowerCase()} built with ${p.tech.slice(0, 3).join(", ")}. Replace this text with a summary of your own work.`,
        description:
          "<h2>Overview</h2><p>This is placeholder copy for a demo project. Describe the problem the client faced, who the application is for, and what success looked like.</p>" +
          "<h2>What I built</h2><ul><li>Outline the main features you delivered</li><li>Mention the architecture and key technical decisions</li><li>Note integrations, performance work or testing</li></ul>" +
          "<h2>Outcome</h2><p>Summarise the result in concrete terms you can stand behind.</p>",
        clientName: "",
        projectStatus: "Completed",
        completedAt: new Date(Date.UTC(2026, 8 - i, 1)),
        featured: i < 4,
        order: i,
        status: "PUBLISHED",
        featuredImageId: image.id,
        images: { create: [{ mediaId: image.id, order: 0 }] },
      },
    });
  }

  const clients = ["Lumora", "Kestrel Labs", "Brightline", "Novaterra", "Quillstack", "Harborly", "Opaline", "Vertexa"];
  for (const [i, clientName] of clients.entries()) {
    const logo = await seedMedia(`client-${i + 1}.svg`, `${clientName} logo (sample)`, 210, 52);
    await db.client.create({ data: { name: clientName, logoId: logo.id, order: i } });
  }

  const testimonials = [
    ["Sample Client One", "Product Manager", "Demo Company", "Sample review — replace with a real client quote. Clear communication, reliable delivery and a product our users found easy to adopt."],
    ["Sample Client Two", "Founder", "Demo Startup", "Sample review — replace with a real client quote. Took a rough idea and turned it into a stable, well-structured application."],
    ["Sample Client Three", "Head of Operations", "Demo Logistics", "Sample review — replace with a real client quote. The new dashboard simplified a process our team used to manage in spreadsheets."],
    ["Sample Client Four", "CTO", "Demo SaaS", "Sample review — replace with a real client quote. Thoughtful architecture decisions and code that our in-house team could pick up straight away."],
    ["Sample Client Five", "Marketing Lead", "Demo Retail", "Sample review — replace with a real client quote. Our storefront is faster and far easier to manage than before."],
    ["Sample Client Six", "Director", "Demo Agency", "Sample review — replace with a real client quote. A dependable partner across several projects, always detail-oriented."],
  ];
  for (const [i, [clientName, designation, company, text]] of testimonials.entries()) {
    const avatar = await seedMedia(`avatar-${i + 1}.svg`, `${clientName} avatar`, 96, 96);
    await db.testimonial.create({
      data: { name: clientName, designation, company, text, rating: 5, order: i, status: "PUBLISHED", avatarId: avatar.id },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
