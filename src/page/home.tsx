import { WaterSimulation } from "@/water/react";
import { ClientOnly } from "@tanstack/react-router";
import { ReactNode, useRef } from "react";
import {
  BlueskyIcon,
  BrowserIcon,
  ChromeIcon,
  GithubIcon,
  LinkedInIcon,
  MCPIcon,
  WavesIcon,
  XTwitterIcon,
} from "../icons";
import logo from "../logo.svg";
import { WaitlistForm } from "../server/waitlist";
import { cn } from "../utils/utils";

export function HomePage() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative flex flex-col items-center text-white">
      <ClientOnly>
        <WaterSimulation />
      </ClientOnly>

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-7xl flex-col items-center pb-5 pt-8 transition-all md:px-8"
        )}
        ref={ref}
      >
        <div className="md:rounded-4xl md:my-12 relative flex w-full flex-col items-center gap-8 md:gap-12  overflow-hidden p-4 backdrop-blur-md md:border-2 md:border-white/10 md:bg-gradient-to-r md:from-white/10 md:via-black/10 md:to-white/10 md:pb-16 md:pt-16 md:shadow-xl">
          <img
            src={logo}
            className="z-1 pointer-events-none h-32 max-h-32 md:h-40 md:max-h-40 drop-shadow-xl"
            alt="logo"
          />
          <div className="-mt-2 flex flex-col items-center gap-0 text-center md:text-left ">
            <div className="text-center mb-4 text-3xl leading-3xl md:text-4xl font-bold text-shadow-sm flex-row flex flex-wrap items-center justify-center gap-1 text-balance">
              Automation you can stop thinking about
            </div>
            <div className="text-xl md:text-2xl text-shadow-lg text-center text-balance leading-tight md:leading-normal">
              Infrastructure for reliable, user-controlled web agents
            </div>
          </div>
          <div className="flex flex-col w-full items-center gap-4 ">
            <div className="md:text-xl text-shadow-sm text-balance text-center">
              Ready to drop in? <br className="block md:hidden" />
              OpenSurf is <strong>coming soon</strong>.
            </div>
            <div className="group relative flex flex-col items-center gap-4 pt-4 ">
              <WaitlistForm />

              <div className="absolute -bottom-6 -right-28 z-40 flex w-fit flex-row items-center gap-2 rounded-full rounded-tl-none bg-gray-700 p-2 px-4 pl-2 text-sm opacity-0 drop-shadow-xl backdrop-blur-lg transition-all duration-300 group-hover:opacity-100">
                <div className="-rotate-45">☝️</div> Surfer speak
              </div>
            </div>
          </div>
          <SocialIcons className="md:absolute md:top-6 md:right-6 md:mb-0 mb-4 " />
        </div>
      </div>

      <Section>
        <SectionContent className="grid w-full grid-cols-1 items-center gap-1 md:grid-cols-2 lg:grid-cols-4 p-0">
          <FeatureCard className="rounded-t-3xl md:rounded-t-none lg:rounded-l-3xl md:rounded-tl-3xl">
            <FeatureTitle>A logical map of the Web</FeatureTitle>
            <FeatureContent>
              A structured representation of how real websites work. Execution
              is predictable, observable, and runs without models in the control
              loop.
            </FeatureContent>
          </FeatureCard>
          <FeatureCard className="md:rounded-tr-3xl lg:rounded-tr-none">
            <FeatureTitle>Repair without rewrites</FeatureTitle>
            <FeatureContent>
              When sites change, OpenSurf surgically repairs skills and
              continues execution. Fixes are explicit, auditable, and shared
              amongst agents.
            </FeatureContent>
          </FeatureCard>
          <FeatureCard className="md:rounded-bl-3xl lg:rounded-bl-none">
            <FeatureTitle>Open by design</FeatureTitle>
            <FeatureContent>
              Skills are just data: portable, inspectable, versioned, and
              auditable. Anyone can extend, fork, or self-host without vendor
              lock-in.
            </FeatureContent>
          </FeatureCard>
          <FeatureCard className="rounded-b-3xl md:rounded-b-none lg:rounded-r-3xl md:rounded-br-3xl">
            <FeatureTitle>Works with your stack</FeatureTitle>
            <FeatureContent>
              Compatible with any LLM, framework, or orchestration layer.
              Reusable web structure without giving up privacy, control or
              locality.
            </FeatureContent>
          </FeatureCard>
        </SectionContent>
      </Section>
      <Section>
        <SectionCard>
          <SectionTitle>
            <span>An open skills network</span>
            <span> for the agentic web</span>
          </SectionTitle>
          <SectionContent>
            <div className="flex w-full flex-col gap-4 md:gap-8 ">
              <Skills title="Everyday">
                <Skill>
                  Get the status of my{" "}
                  <SkillDomain id="spotify" name="Spotify" />
                  plan
                </Skill>

                <Skill>
                  Check status of my <SkillDomain id="amazon" name="Amazon" />
                  delivery
                </Skill>
                <Skill>
                  Pause my <SkillDomain id="hellofresh" name="HelloFresh" />{" "}
                  subscription
                </Skill>
              </Skills>
              <Skills title="Workplace">
                <Skill>
                  Give <SkillTarget>@Gary</SkillTarget> admin access on
                  <SkillDomain id="cloudflare" name="Cloudflare" />
                </Skill>
                <Skill>
                  Get a list of <SkillTarget>@Gary's</SkillTarget> open PRs on
                  <SkillDomain id="github" name="GitHub" />
                </Skill>
                <Skill>
                  Remove user <SkillTarget>@Gary</SkillTarget> from{" "}
                  <SkillDomain id="google" name="Google Workspace" />
                </Skill>
              </Skills>
              <Skills title="Devops">
                <Skill>
                  Rotate API keys for <SkillTarget>@Project X</SkillTarget> in{" "}
                  <SkillDomain id="aws" name="AWS" />
                </Skill>
                <Skill>
                  Trigger a production deployment in{" "}
                  <SkillDomain id="cloudflare" name="Cloudflare" /> Pages
                </Skill>
                <Skill>
                  How many <SkillDomain id="sentry" name="Sentry" /> errors in
                  last 24 hours for
                  <SkillTarget>@Project X</SkillTarget>
                </Skill>
              </Skills>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section>
        <SectionCard>
          <SectionTitle>Built for real-world automation</SectionTitle>
          <SectionContent className="gap-4 md:gap-6">
            <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-3">
              <Group>
                <GroupTitle>⚡ Declarative, not scripted</GroupTitle>
                <GroupContent>
                  <p>OpenSurf encodes web structure as data, not scripts.</p>
                  <p>
                    Automation reacts to known signals instead of re-discovering
                    the UI on every step.
                  </p>
                </GroupContent>
              </Group>
              <Group>
                <GroupTitle>🤝 Human-in-the-loop by design</GroupTitle>
                <GroupContent>
                  <p>
                    OpenSurf surfaces uncertainty, asks for confirmation, and
                    learns from corrections.
                  </p>
                  <p>
                    Guidance becomes shared skill knowledge, without
                    surrendering control to an opaque system.
                  </p>
                </GroupContent>
              </Group>
              <Group>
                <GroupTitle>🔐 Local-first and private by default</GroupTitle>
                <GroupContent>
                  <p>Credentials and personal data never leave your device.</p>
                  <p>
                    OpenSurf runs locally, integrates with existing password
                    managers, and sandboxes every session. No cloud logins or
                    silent exfiltration.
                  </p>
                </GroupContent>
              </Group>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section>
        <SectionCard>
          <SectionContent>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5 gap-2 md:gap-8 w-full">
              <div className="col-span-2 flex w-full flex-row items-center justify-between md:justify-start gap-2 md:flex-col md:items-start md:gap-4">
                <h2 className="text-2xl font-bold md:text-5xl flex flex-row flex-wrap items-center leading-tight   ">
                  Our principles
                </h2>
              </div>
              <div className="col-span-3 flex flex-col gap-4 text-sm md:text-base">
                <ul className="list-inside list-disc flex flex-col gap-2">
                  <li>
                    Deterministic execution over probabilistic control loops
                  </li>
                  <li>Human oversight by default (interruptible, auditable)</li>
                  <li>Local-first security (credentials stay on device)</li>
                  <li>
                    Open skills as data (inspectable, versioned, forkable)
                  </li>
                  <li>Revenue from value delivered, not data extraction</li>
                </ul>
                <strong>
                  The web should be operable by software without surrendering
                  user control.
                </strong>
              </div>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section>
        <SectionCard className="relative py-8 md:py-24">
          <div
            className="absolute bottom-0 left-0 right-0 top-0 bg-center bg-repeat opacity-50"
            style={{ backgroundImage: "url(/nodes.svg)" }}
          ></div>
          <SectionTitle>How it works</SectionTitle>

          <SectionContent className="grid w-full grid-cols-1 gap-x-12 md:grid-cols-2 items-stretch">
            <ol className="-mx-4 md:-mx-0 flex list-inside list-decimal flex-col gap-6 bg-gradient-to-br from-black/25 to-black/25 via-black/15 backdrop-blur-xl border-white/20 border-1 p-6 md:p-8 font-mono text-sm rounded-xl shadow-md">
              <li>Connect your agent through the OpenSurf API or SDK.</li>
              <li>
                Query the skills layer for a goal — sign in, search, cancel,
                purchase, extract.
              </li>
              <li>Execute safely inside a local or hosted browser sandbox.</li>
              <li>Improve and share skills as you go.</li>
            </ol>
            <div className="flex flex-col gap-2">
              <HowCard icon={<ChromeIcon />} className="bg-sky-400/15">
                <GroupTitle className="text-base">Chrome extension</GroupTitle>
                <GroupContent>Local automation, full visibility</GroupContent>
              </HowCard>
              <HowCard icon={<MCPIcon />} className="bg-cyan-500/15">
                <GroupTitle className="text-base">MCP Server</GroupTitle>
                <GroupContent>Integrate with existing workflows.</GroupContent>
              </HowCard>
              <HowCard icon={<BrowserIcon />} className="bg-teal-500/15">
                <GroupTitle className="text-base">
                  Universal Browser Client
                </GroupTitle>
                <GroupContent>
                  Playwright, Cloud browsers, Mobile SDK
                </GroupContent>
              </HowCard>
            </div>
          </SectionContent>
          <div className="text-center text-xl text-balance leading-tight">
            The skills layer learns, improves, and compounds.
          </div>
        </SectionCard>
      </Section>
      <Section>
        <SectionCard>
          <SectionTitle>About us</SectionTitle>
          <SectionContent className="flex w-full flex-col md:flex-row items-center justify-center gap-8 ">
            <div className="min-h-48 min-w-48">
              <img
                src="/dom_and_dave.png"
                alt="Dom and David"
                className="max-h-48 rounded-full"
              />

              <div className="text-xs text-center text-white/80 bg-black/80 px-2 py-1 -mt-6 z-30  backdrop-blur-3xl rounded-md">
                * Two posers with no real surfing abilities
              </div>
            </div>

            <div className="flex w-full max-w-2xl flex-col items-start gap-2">
              <p>We're Dom and David, founders of OpenSurf.</p>
              <p>
                Parts of what you’ve read are already working. The rest is
                taking shape fast. We know this idea is bigger than the two of
                us, and we'll need help from ambitious thinkers, engineers, and
                designers to make it real.
              </p>
              <strong>
                If this vision speaks to you,{" "}
                <a
                  href="mailto:team@opensurf.ai"
                  className="underline underline-offset-4 text-white/80 hover:text-white"
                >
                  reach out
                </a>{" "}
                — we'd love to hear from you.
              </strong>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section>
        <SectionCard>
          <SectionContent>
            <div className="flex flex-col items-center gap-8">
              <div className="text-2xl font-semibold flex flex-row flex-wrap items-center justify-center gap-x-2">
                <span>Ready to drop in?</span>{" "}
                <span>
                  <span className="font-semibold ">OpenSurf</span> is coming
                  soon.
                </span>
              </div>
              <WaitlistForm compact />
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section className="py-12">
        <SectionCard className="rounded-xl border-none bg-transparent pb-2 pt-0 shadow-none backdrop-blur-none group-hover:shadow-none">
          <div className="flex w-full flex-col-reverse items-center justify-between gap-2 opacity-75 md:flex-row md:gap-4 text-sm gap-y-6">
            <a
              href="https://estiistudios.com"
              target="_blank"
              className="hover:underline"
            >
              © 2025 Estii
            </a>
            <div
              onClick={() =>
                ref.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="[&_svg]:text-white-500/100 flex cursor-pointer flex-row items-center gap-2 [&_svg]:size-5"
            >
              <WavesIcon />
              <span className="hover:underline">Resurface (Back to top)</span>
            </div>
            <SocialIcons />
          </div>
        </SectionCard>
      </Section>
    </div>
  );
}

function SocialIcons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-row items-center gap-4", className)}>
      <SocialLink href="https://github.com/opensurfai">
        <GithubIcon />
      </SocialLink>
      <SocialLink href="https://x.com/opensurfai">
        <XTwitterIcon />
      </SocialLink>
      <SocialLink href="https://bsky.app/profile/opensurf.ai">
        <BlueskyIcon />
      </SocialLink>
      <SocialLink href="https://linkedin.com/company/opensurf">
        <LinkedInIcon />
      </SocialLink>
    </div>
  );
}

function SocialLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      href={href}
      className="flex flex-row items-center gap-2 [&_svg]:size-5 [&_svg]:fill-white/50 [&_svg]:hover:fill-white"
    >
      {children}
    </a>
  );
}
function FeatureTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-lg font-bold lg:w-full leading-tight">{children}</div>
  );
}

function FeatureContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col text-center md:block md:items-center lg:items-start lg:text-start">
      {children}
    </div>
  );
}

function FeatureCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center gap-2 overflow-hidden text-balance border-2 border-white/10 bg-white/5 p-8 md:py-10 md:pr-6 shadow-sm backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  stat,
  title,
  prefix,
  footer,
  className,
}: {
  stat: ReactNode;
  title?: ReactNode;
  prefix?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex md:h-auto flex-col items-center justify-center gap-1 md:gap-2 border-2 border-white/10 bg-white/10 p-6 md:p-10  shadow-sm backdrop-blur-xl rounded-lg md:rounded-3xl w-full align-text-bottom",
        className
      )}
    >
      {prefix && (
        <span className="text-xs uppercase opacity-75  -mb-2 ">{prefix}</span>
      )}
      <div className=" flex flex-row gap-2 items-center font-bold text-4xl leading-none">
        {stat} {title ?? ""}
      </div>
      <div className="text-center text-sm text-balance  max-w-sm leading-tight">
        {footer}
      </div>
    </div>
  );
}
function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-2xl font-bold xl:text-3xl flex flex-row flex-wrap items-center justify-center gap-1 p-4 text-center md:p-0 md:text-left",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center gap-6 p-4 md:p-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center gap-6 md:gap-10 overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-r from-white/5 via-black/5 to-white/5  p-4 md:pb-8 shadow-sm backdrop-blur-xl transition-all group-hover:shadow-xl md:p-12 md:py-24",
        className
      )}
    >
      {children}
    </div>
  );
}

function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "z-1 group relative flex h-fit w-full max-w-7xl flex-col items-center gap-6 bg-gradient-to-b p-4 transition-all md:p-8 md:py-4",
        className
      )}
    >
      {children}
    </div>
  );
}

function Group({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg p-0 ", className)}>
      {children}
    </div>
  );
}
function GroupTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("text-lg font-bold", className)}>{children}</div>;
}
function GroupContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-md flex flex-col gap-2 text-balance", className)}>
      {children}
    </div>
  );
}

function Skills({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-2 md:grid md:grid-cols-5  md:gap-8 ">
      <SkillsTitle>{title}</SkillsTitle>
      <SkillsContent>{children}</SkillsContent>
    </div>
  );
}

function SkillsTitle({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-1 md:text-lg font-bold md:mt-4 md:text-right">
      {children}
    </div>
  );
}

function SkillsContent({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-4 flex w-full flex-row flex-wrap items-center gap-2 ">
      {children}
    </div>
  );
}

function Skill({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 md:-mx-0 border-1 flex flex-row flex-wrap items-center gap-1.5 md:gap-2 gap-y-1 rounded-lg md:rounded-xl border-dashed border-white/50 bg-gradient-to-br from-black/15 via-black/10 to-black/15 p-2.5 md:py-3  text-xs md:text-xs font-mono">
      {children}
    </div>
  );
}

function SkillDomain({ id, name = id }: { id: string; name?: string }) {
  return (
    <div className="flex flex-row items-center gap-2 rounded-md bg-black/20 px-1.5 py-1  md:pr-3 text-xs -my-0.5">
      <img src={`/domains/${id}.png`} className="size-3 md:size-4" />
      <span className="title-case"> {name}</span>
    </div>
  );
}

function SkillTarget({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-row items-center gap-2 rounded-md bg-black/20 px-1.5 md:px-2 py-1 text-xs -my-0.5">
      <span className="title-case"> {children}</span>
    </div>
  );
}

function HowCard({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-4 rounded-xl bg-white/10 p-2 md:p-3 shadow-xl backdrop-blur-xl -mx-4 md:-mx-0",
        className
      )}
    >
      <div className="flex flex-col rounded-xl border-2 border-white/10 bg-white/10 p-2 shadow-md [&_svg]:size-10 [&_svg]:min-w-8">
        {icon}
      </div>
      <div className="flex flex-col text-sm md:text-base">{children}</div>
    </div>
  );
}
