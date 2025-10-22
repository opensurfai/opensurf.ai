import { WaterSimulation } from "@/water/react";
import { ClientOnly } from "@tanstack/react-router";
import { ReactNode, useRef, useState } from "react";
import {
  BlueskyIcon,
  BrowserIcon,
  ChromeIcon,
  GithubIcon,
  LinkedInIcon,
  MCPIcon,
  WavesIcon,
  WavesLadderIcon,
  XTwitterIcon,
} from "../icons";
import logoColor from "../logo-white.svg";
import { WaitlistForm } from "../server/waitlist";
import { cn } from "../utils/utils";

export function HomePage() {
  const [hideContents, setHideContents] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative flex flex-col items-center text-white">
      <ClientOnly>
        <WaterSimulation />
      </ClientOnly>

      {hideContents && (
        <div
          className={cn(
            "fixed bottom-12 z-30 mx-auto rounded-full bg-white/10 px-12 py-4 text-lg shadow-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:shadow-2xl"
          )}
          onClick={() => setHideContents((showContents) => !showContents)}
        >
          Restore content
        </div>
      )}
      <div
        className={cn(
          "relative mx-auto flex w-full flex-col items-center pb-5 pt-10 transition-all md:px-12",
          hideContents && "brightness-10 opacity-10 blur-3xl saturate-0"
        )}
        ref={ref}
      >
        <div className="md:rounded-4xl relative mx-auto flex w-full max-w-7xl flex-col items-center gap-12 overflow-hidden p-8 backdrop-blur-md md:border-2 md:border-white/10 md:bg-white/5 md:pb-24 md:pt-24 md:shadow-xl">
          <img
            src={logoColor}
            className="z-1 pointer-events-none h-40 max-h-40 drop-shadow-xl"
            alt="logo"
          />
          <div className="-mt2 flex flex-col items-center gap-0">
            <div className="mb-4 text-4xl font-bold drop-shadow-sm">
              Web skills for agents
            </div>
            <div className="text-2xl drop-shadow-sm">
              Build super-agents that learn, heal and work locally with users
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="text-lg drop-shadow-sm">
              Ready to drop in? <strong>OpenSurf is coming soon.</strong>
            </div>
            <div className="group relative flex w-full flex-col items-center gap-4">
              <WaitlistForm />

              <div className="absolute -bottom-6 -right-28 z-40 flex w-fit flex-row items-center gap-2 rounded-full rounded-tl-none bg-gray-700 p-2 px-4 pl-2 text-sm opacity-0 drop-shadow-xl backdrop-blur-lg transition-all duration-300 group-hover:opacity-100">
                <div className="-rotate-45">☝️</div> Surfer speak
              </div>
            </div>
          </div>
        </div>
      </div>

      <Section hidden={hideContents}>
        <SectionContent className="-mb-5 grid w-full grid-cols-1 items-center gap-1 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard className="md:rounded-tl-3xl">
            <FeatureTitle>A living skills layer</FeatureTitle>
            <FeatureContent>
              Reusable “how-to” memories for interacting with any website. From
              booking systems to dashboards to data portals.
            </FeatureContent>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>Self-healing and adaptive</FeatureTitle>
            <FeatureContent>
              When a site changes, the layer updates automatically. Every
              connected agent inherits the fix instantly.
            </FeatureContent>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>Open and federated</FeatureTitle>
            <FeatureContent>
              Anyone can inspect, extend, or mirror the layer. Every
              contribution is signed, versioned, and auditable.
            </FeatureContent>
          </FeatureCard>
          <FeatureCard className="md:rounded-tr-3xl">
            <FeatureTitle>Universal</FeatureTitle>
            <FeatureContent>
              Works with any LLM, framework, or orchestration stack. Agents gain
              web intuition without losing privacy or control.
            </FeatureContent>
          </FeatureCard>
        </SectionContent>
        <SectionCard className="rounded-tl-none rounded-tr-none">
          <SectionTitle>
            The open skills network for the agentic web
          </SectionTitle>
          <SectionContent>
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-8">
                <Skills title="Everyday">
                  <Skill>
                    Get the status of my <SkillDomain id="spotify" />
                    plan
                  </Skill>

                  <Skill>
                    Check status of my <SkillDomain id="amazon" />
                    delivery
                  </Skill>
                  <Skill>
                    Pause my <SkillDomain id="hellofresh" name="Hello Fresh" />{" "}
                    subscription
                  </Skill>
                </Skills>
                <Skills title="Workplace">
                  <Skill>
                    Give <SkillTarget>@Gary</SkillTarget> admin access on
                    <SkillDomain id="cloudflare" />
                  </Skill>
                  <Skill>
                    Get a list of <SkillTarget>@Gary's</SkillTarget> open PRs on
                    <SkillDomain id="github" />
                  </Skill>
                  <Skill>
                    Remove user <SkillTarget>@Gary</SkillTarget> from{" "}
                    <SkillDomain id="google" name="Google workspace" />
                  </Skill>
                </Skills>
                <Skills title="Devops">
                  <Skill>
                    Rotate API keys for{" "}
                    <SkillTarget>@Project Atlas</SkillTarget> in{" "}
                    <SkillDomain id="aws" />
                  </Skill>
                  <Skill>
                    Trigger a production deployment in{" "}
                    <SkillDomain id="cloudflare" /> Pages
                  </Skill>
                  <Skill>
                    Get the number of <SkillDomain id="sentry" /> errors in the
                    last 24 hours for
                    <SkillTarget>@Project Atlas</SkillTarget>
                  </Skill>
                </Skills>
              </div>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section hidden={hideContents}>
        <SectionCard>
          <SectionTitle>Why it's different</SectionTitle>
          <SectionContent className="gap-6">
            <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3">
              <Card>
                <CardTitle>⚡ Reactive and semantic</CardTitle>
                <CardContent>
                  <p>
                    Forget brittle scripts. OpenSurf introduces an entirely new
                    kind of automation — a semantic layer for the web.
                  </p>
                  <p>
                    Agents perceive structure and intent, not pixels or
                    selectors, performing tasks at super-human speed and
                    adapting instantly when the web changes.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardTitle>🤝 Collaborative and transparent</CardTitle>
                <CardContent>
                  <p>
                    Agents don’t replace users — they work alongside them.
                    OpenSurf lets agents surface interruptions, confirm intent,
                    and learn directly from human actions.
                  </p>
                  <p>
                    Your guidance becomes shared skill memory, improving every
                    interaction without giving up control.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardTitle>🔐 Secure & Private</CardTitle>
                <CardContent>
                  <p>
                    Your credentials and personal data never leave your device.
                    OpenSurf runs locally, integrates with your existing
                    password managers, and keeps every session sandboxed.
                  </p>
                  <p>
                    No cloud logins. No silent exfiltration. Just private
                    automation under your command.
                  </p>
                </CardContent>
              </Card>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section hidden={hideContents}>
        <SectionCard>
          <SectionContent>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5 md:gap-8">
              <div className="col-span-2 flex flex-row items-center gap-2 md:flex-col md:items-start md:gap-4">
                <h2 className="text-4xl font-bold md:text-5xl">
                  The Open Agentic Web Manifesto
                </h2>
                <span className="text-[80px] md:text-[100px]">✊</span>
              </div>
              <div className="col-span-3 flex flex-col gap-4">
                <strong>The web was built for people, not machines.</strong>
                <span>
                  Today it is cluttered, closed, and hostile to both users and
                  automation.
                </span>
                <span>Agents stall. Scripts break. Privacy disappears. </span>
                <strong>We exist to fix that.</strong>
                <ul>
                  <li>We believe in an open agentic web.</li>
                  <li>Where humans and AI collaborate safely.</li>
                  <li>Where knowledge is shared, not hoarded.</li>
                  <li>And where privacy and control belong to the user.</li>
                </ul>
                <ul>
                  <li>We will never sell your data.</li>
                  <li>We will always work in service of your privacy.</li>
                  <li>
                    We will earn our revenue from the value we create — not from
                    your information.
                  </li>
                </ul>
                <strong>
                  The web should serve you, and those you trust to serve you.
                </strong>
                <strong>Not the other way around.</strong>
              </div>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section hidden={hideContents}>
        <SectionCard className="relative py-48">
          <div
            className="absolute bottom-0 left-0 right-0 top-0 bg-center bg-repeat opacity-50"
            style={{ backgroundImage: "url(/nodes.svg)" }}
          ></div>
          <SectionTitle>How it works</SectionTitle>
          <SectionContent className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col items-start gap-4">
              <ol className="flex list-inside list-decimal flex-col gap-4">
                <li>Connect your agent through the OpenSurf API or SDK.</li>
                <li>
                  Query the open skills memory for a task — search, fill,
                  purchase, extract.
                </li>
                <li>
                  Execute safely inside a local or hosted browser sandbox.
                </li>
                <li>Contribute improvements back to the layer.</li>
              </ol>
              <strong>The network learns, heals, and grows.</strong>
            </div>
            <div className="flex flex-col gap-2">
              <HowCard icon={<ChromeIcon />} className="bg-sky-400/15">
                <CardTitle>Chrome extension</CardTitle>
                <CardContent>Local automation, full visibility</CardContent>
              </HowCard>
              <HowCard icon={<MCPIcon />} className="bg-cyan-500/15">
                <CardTitle>MCP Server</CardTitle>
                <CardContent>Integrate with existing workflows.</CardContent>
              </HowCard>
              <HowCard icon={<BrowserIcon />} className="bg-teal-500/15">
                <CardTitle>Universal Browser Client</CardTitle>
                <CardContent>
                  Playwright, Cloud browsers, Mobile SDK
                </CardContent>
              </HowCard>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section hidden={hideContents}>
        <SectionCard>
          <SectionTitle>About us</SectionTitle>
          <SectionContent className="flex w-full flex-row flex-wrap items-center justify-center gap-8">
            <img
              src="/dom_and_dave.png"
              alt="Dom and Dave"
              className="h-48 rounded-full"
            />

            <div className="flex max-w-2xl flex-col items-start gap-2">
              <p>
                We're Dom and Dave — two Aussies who've spent the last nine
                months building OpenSurf.
              </p>
              <p>
                Parts of what you’ve read are already working. The rest is
                taking shape fast. We know this idea is bigger than the two of
                us, and we'll need help from ambitious thinkers, engineers, and
                designers to make it real.
              </p>
              <strong>
                If this vision speaks to you, reach out — we'd love to hear from
                you.
              </strong>
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section hidden={hideContents}>
        <SectionCard>
          <SectionContent>
            <div className="flex flex-col items-center gap-8">
              <div className="text-2xl font-semibold">
                Ready to drop in? OpenSurf is coming soon.
              </div>
              <WaitlistForm />
            </div>
          </SectionContent>
        </SectionCard>
      </Section>
      <Section className="py-0" hidden={hideContents}>
        <SectionCard className="rounded-xl border-none bg-transparent pb-2 pt-0 shadow-none backdrop-blur-none group-hover:shadow-none">
          <div className="flex w-full flex-col items-center justify-between gap-2 opacity-75 md:flex-row md:gap-4">
            <a
              href="https://estiistudios.com"
              target="_blank"
              className="hover:underline"
            >
              © 2025 Estii Co
            </a>

            <div
              onClick={() => setHideContents((showContents) => !showContents)}
              className="[&_svg]:text-white-500/100 w-54 flex cursor-pointer flex-row items-center gap-2 [&_svg]:size-5"
            >
              <WavesIcon />
              <span className="text-nowrap hover:underline">
                {!hideContents
                  ? "Relax (Hide contents)"
                  : "Resume (Show contents)"}
              </span>
            </div>
            <div
              onClick={() =>
                ref.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="[&_svg]:text-white-500/100 flex cursor-pointer flex-row items-center gap-2 [&_svg]:size-5"
            >
              <WavesLadderIcon />
              <span className="hover:underline">Resurface (Back to top)</span>
            </div>
            <SocialIcons />
          </div>
        </SectionCard>
      </Section>
    </div>
  );
}

function SocialIcons() {
  return (
    <div className="e flex flex-row items-center gap-4">
      <SocialLink href="https://github.com/opensurfai">
        <GithubIcon />
      </SocialLink>
      <SocialLink href="https://x.com/opensurfai">
        <XTwitterIcon />
      </SocialLink>
      <SocialLink href="https://bsky.app/profile/opensurf.ai">
        <BlueskyIcon />
      </SocialLink>
      <SocialLink href="https://x.com/opensurfai">
        <LinkedInIcon />
      </SocialLink>
    </div>
  );
}

function SocialLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <div
      className="flex flex-row items-center gap-2 [&_svg]:size-5 [&_svg]:fill-white/50 [&_svg]:hover:fill-white"
      onClick={() => window.open(href, "_blank")}
    >
      {children}
    </div>
  );
}
function FeatureTitle({ children }: { children: ReactNode }) {
  return <div className="text-lg font-bold lg:w-full">{children}</div>;
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
        "r flex h-full w-full flex-col items-center gap-2 overflow-hidden text-balance border-2 border-white/10 bg-white/5 p-8 py-10 shadow-sm backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="text-2xl font-bold xl:text-3xl">{children}</div>;
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
        "mx-auto flex max-w-7xl flex-col items-center gap-6",
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
        "mx-auto flex w-full max-w-7xl flex-col items-center gap-10 overflow-hidden rounded-3xl border-2 border-white/10 bg-white/5 p-2 shadow-sm backdrop-blur-xl transition-all group-hover:shadow-xl md:p-12 md:py-24",
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
  hidden,
}: {
  children: ReactNode;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <div
      className={cn(
        "z-1 group relative flex h-fit w-full flex-col items-center gap-6 bg-gradient-to-b p-4 transition-all md:p-8 md:py-4",
        className,
        hidden && "opacity-0"
      )}
    >
      {children}
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg p-4", className)}>
      {children}
    </div>
  );
}
function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("text-lg font-bold", className)}>{children}</div>;
}
function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-md flex flex-col gap-2", className)}>
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
    <div className="flex w-full flex-col gap-4 md:grid md:grid-cols-5 md:gap-8">
      <SkillsTitle>{title}</SkillsTitle>
      <SkillsContent>{children}</SkillsContent>
    </div>
  );
}

function SkillsTitle({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-1 text-lg font-bold md:mt-4 md:text-right">
      {children}
    </div>
  );
}

function SkillsContent({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-4 flex w-full flex-row flex-wrap items-center gap-2">
      {children}
    </div>
  );
}

function Skill({ children }: { children: ReactNode }) {
  return (
    <div className="border-1 flex w-max flex-row items-center gap-2 rounded-xl border-dashed border-white/50 bg-black/5 p-4 text-sm">
      {children}
    </div>
  );
}

function SkillDomain({ id, name = id }: { id: string; name?: string }) {
  return (
    <div className="flex flex-row items-center gap-2 rounded-md bg-black/20 px-1.5 py-1 pr-3.5 text-xs">
      <img src={`/domains/${id}.png`} className="size-4" />
      <span className="title-case"> {name}</span>
    </div>
  );
}

function SkillTarget({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-row items-center gap-2 rounded-md bg-black/20 px-2 py-1 text-xs">
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
        "flex flex-row items-center gap-2 rounded-xl bg-white/10 p-3 shadow-xl backdrop-blur-xl",
        className
      )}
    >
      <div className="flex flex-col rounded-xl border-2 border-white/10 bg-white/10 p-2 shadow-md [&_svg]:size-10 [&_svg]:min-w-8">
        {icon}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
