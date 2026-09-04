'use client';

import { ArrowUpRight } from 'lucide-react';
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionStyle,
} from 'framer-motion';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import styles from './creative-preview.module.css';

const portraitImage =
  'https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png';

const marqueeImages = [
  'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
  'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
  'https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
  'https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif',
  'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
  'https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif',
  'https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif',
  'https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif',
  'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
  'https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif',
  'https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif',
  'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
  'https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif',
  'https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif',
  'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
  'https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif',
  'https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif',
  'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
  'https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif',
];

const projectImageBase = 'https://images.higgs.ai/?default=1&output=webp&url=';

const projects = [
  {
    category: 'Client',
    name: 'Nextlevel Studio',
    images: [
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85`,
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85`,
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85`,
    ],
  },
  {
    category: 'Personal',
    name: 'Aura Brand Identity',
    images: [
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85`,
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png&w=1280&q=85`,
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png&w=1280&q=85`,
    ],
  },
  {
    category: 'Client',
    name: 'Solaris Digital',
    images: [
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85`,
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85`,
      `${projectImageBase}https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png&w=1280&q=85`,
    ],
  },
] as const;

const formats = [
  ['01', 'Writing', 'Long-form writing that turns projects, references, and lessons into material worth returning to.'],
  ['02', 'Notes', 'Compact field notes for ideas in progress, useful fragments, and things still being figured out.'],
  ['03', 'Projects', 'Small, durable projects documented with enough context to make the work legible later.'],
  ['04', 'Archive', 'A calm index for selected links, reading trails, and collections that deserve a second look.'],
  ['05', 'Conversation', 'A public place for comments, guestbook messages, and thoughtful replies from readers.'],
] as const;

const aboutDecorations = [
  {
    className: styles.aboutMoon,
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png',
    delay: 0.1,
    x: -80,
  },
  {
    className: styles.aboutObject,
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png',
    delay: 0.25,
    x: -80,
  },
  {
    className: styles.aboutLego,
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png',
    delay: 0.15,
    x: 80,
  },
  {
    className: styles.aboutGroup,
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png',
    delay: 0.3,
    x: 80,
  },
] as const;

export function CreativePortfolioPreview() {
  return (
    <main className={styles.preview}>
      <HeroSection />
      <ScrollMarquee />
      <AboutSection />
      <FormatsSection />
      <ProjectsSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className={styles.hero} id="about">
      <FadeIn as="nav" ariaLabel="Creative preview navigation" className={styles.nav} y={-20}>
        <a href="#about">About</a>
        <a href="#formats">Formats</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </FadeIn>

      <FadeIn className={styles.heroTitleWrap} delay={0.15} y={40}>
        <h1 className={styles.heroTitle}>Hi, i&apos;m Aster.H</h1>
      </FadeIn>

      <FadeIn className={styles.portraitWrap} delay={0.6} y={30}>
        <Magnet>
          <img className={styles.portrait} src={portraitImage} alt="Abstract 3D editorial portrait" />
        </Magnet>
      </FadeIn>

      <div className={styles.heroBottom}>
        <FadeIn delay={0.35} y={20}>
          <p className={styles.heroSummary}>a personal content platform for notes, projects, and the small things worth keeping</p>
        </FadeIn>
        <FadeIn delay={0.5} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
}

function ScrollMarquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;

    const syncOffset = () => {
      if (sectionRef.current) {
        setOffset((window.scrollY - sectionRef.current.offsetTop + window.innerHeight) * 0.3);
      }
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(syncOffset);
      }
    };

    syncOffset();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <section className={styles.marquee} ref={sectionRef} aria-label="Moving visual studies">
      <MarqueeRow images={marqueeImages.slice(0, 11)} x={offset - 200} />
      <MarqueeRow images={marqueeImages.slice(11)} x={-(offset - 200)} />
    </section>
  );
}

function MarqueeRow({ images, x }: { images: string[]; x: number }) {
  const tiles = [...images, ...images, ...images];

  return (
    <div className={styles.marqueeViewport}>
      <motion.div className={styles.marqueeTrack} style={{ x }}>
        {tiles.map((src, index) => (
          <img className={styles.marqueeTile} key={`${src}-${index}`} src={src} alt="" loading="lazy" />
        ))}
      </motion.div>
    </div>
  );
}

function AboutSection() {
  return (
    <section className={styles.about} aria-labelledby="preview-about-title">
      {aboutDecorations.map((decoration) => (
        <FadeIn
          className={decoration.className}
          delay={decoration.delay}
          duration={0.9}
          key={decoration.src}
          x={decoration.x}
          y={0}
        >
          <img src={decoration.src} alt="" />
        </FadeIn>
      ))}

      <div className={styles.aboutContent}>
        <FadeIn delay={0} y={40}>
          <h2 className={styles.sectionTitle} id="preview-about-title">
            About this space
          </h2>
        </FadeIn>
        <AnimatedText>
          With more than five years of collecting references, building small things, and writing in public, I keep this space
          for work that rewards a second look. It&apos;s an evolving record of projects, notes, and curious detours. Let&apos;s make
          something useful together.
        </AnimatedText>
        <FadeIn delay={0.2} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  );
}

function FormatsSection() {
  return (
    <section className={styles.formats} id="formats" aria-labelledby="formats-title">
      <FadeIn y={40}>
        <h2 className={styles.formatsTitle} id="formats-title">
          Formats
        </h2>
      </FadeIn>
      <div className={styles.formatsList}>
        {formats.map(([number, name, description], index) => (
          <FadeIn className={styles.formatItem} delay={index * 0.1} key={number} y={24}>
            <span className={styles.formatNumber}>{number}</span>
            <div>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className={styles.projects} id="projects" aria-labelledby="projects-title">
      <FadeIn y={40}>
        <h2 className={styles.sectionTitle} id="projects-title">
          Projects
        </h2>
      </FadeIn>
      <div className={styles.projectStack}>
        {projects.map((project, index) => (
          <ProjectCard index={index} key={project.name} project={project} total={projects.length} />
        ))}
      </div>
      <div className={styles.projectsOutro} id="contact">
        <p>Have a note, a question, or a project thread to share?</p>
        <ContactButton />
      </div>
    </section>
  );
}

function ProjectCard({
  index,
  project,
  total,
}: {
  index: number;
  project: (typeof projects)[number];
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1 - (total - 1 - index) * 0.03]);

  return (
    <div className={styles.projectSlot} ref={containerRef}>
      <motion.article className={styles.projectCard} style={{ scale } as MotionStyle}>
        <div className={styles.projectTopline}>
          <span className={styles.projectNumber}>0{index + 1}</span>
          <div className={styles.projectHeading}>
            <span>{project.category}</span>
            <h3>{project.name}</h3>
          </div>
          <a className={styles.liveProject} href="/projects">
            Live Project <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </a>
        </div>
        <div className={styles.projectImages}>
          <div className={styles.projectImageColumn}>
            <img src={project.images[0]} alt="Project visual study" loading="lazy" />
            <img src={project.images[1]} alt="Project visual study" loading="lazy" />
          </div>
          <img className={styles.projectImageTall} src={project.images[2]} alt="Project visual study" loading="lazy" />
        </div>
      </motion.article>
    </div>
  );
}

function ContactButton() {
  return (
    <a className={styles.contactButton} href="/guestbook">
      <span>Contact Me</span>
      <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
    </a>
  );
}

function FadeIn({
  as: Tag = 'div',
  ariaLabel,
  children,
  className,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  ...props
}: {
  as?: 'div' | 'nav';
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}) {
  const motionProps = {
    className,
    initial: { opacity: 0, x, y },
    transition: { delay, duration, ease: [0.25, 0.1, 0.25, 1] as const },
    viewport: { once: true, margin: '50px', amount: 0 },
    whileInView: { opacity: 1, x: 0, y: 0 },
  };

  if (Tag === 'nav') {
    return (
      <motion.nav aria-label={ariaLabel} {...motionProps}>
        {children}
      </motion.nav>
    );
  }

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
}

function Magnet({ children }: { children: ReactNode }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState({ x: 0, y: 0, active: false });

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = elementRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const padding = 150;
    const insideMagneticRange =
      event.clientX >= bounds.left - padding &&
      event.clientX <= bounds.right + padding &&
      event.clientY >= bounds.top - padding &&
      event.clientY <= bounds.bottom + padding;

    if (!insideMagneticRange) {
      setShift({ x: 0, y: 0, active: false });
      return;
    }

    setShift({
      x: (event.clientX - (bounds.left + bounds.width / 2)) / 3,
      y: (event.clientY - (bounds.top + bounds.height / 2)) / 3,
      active: true,
    });
  }

  const magnetStyle = {
    '--magnet-x': `${shift.x}px`,
    '--magnet-y': `${shift.y}px`,
  } as CSSProperties;

  return (
    <div
      className={styles.magnet}
      data-active={shift.active || undefined}
      onPointerLeave={() => setShift({ x: 0, y: 0, active: false })}
      onPointerMove={onPointerMove}
      ref={elementRef}
      style={magnetStyle}
    >
      {children}
    </div>
  );
}

function AnimatedText({ children }: { children: string }) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const inView = useInView(paragraphRef, { amount: 0.25, once: true });

  return (
    <p className={styles.animatedText} ref={paragraphRef}>
      {Array.from(children).map((character, index) => (
        <motion.span
          animate={{ opacity: inView ? 1 : 0.22 }}
          className={styles.animatedCharacter}
          key={`${character}-${index}`}
          transition={{ delay: Math.min(index * 0.008, 1.1), duration: 0.34 }}
        >
          {character}
        </motion.span>
      ))}
    </p>
  );
}
