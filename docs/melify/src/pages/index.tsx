import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

// SVG Icons for Features
const EmailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const AiIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a8 8 0 0 1 8 8v12H4V10a8 8 0 0 1 8-8z"></path>
    <path d="M9.5 14h5"></path>
    <path d="M8 10h8"></path>
    <path d="M8 6h8"></path>
  </svg>
);

const SyncIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
  </svg>
);

const SecurityIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <Heading as="h1" className="hero__title">
              Your Email Client, Supercharged with AI
            </Heading>
            <p className="hero__subtitle">
              Melify is an open-source email client that brings AI to your
              inbox. Connect your Gmail accounts and experience email management
              reimagined with intelligent assistance.
            </p>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg margin-right--md"
                to="/docs/intro"
              >
                Get Started
              </Link>
              <Link
                className="button button--secondary button--lg"
                href="https://github.com/yourusername/melify"
              >
                View on GitHub
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.heroImage}>
              {/* Replace with your actual hero image */}
              <div className={styles.emailClientMockup}>
                <div className={styles.emailHeader}>
                  <div className={styles.emailCircle}></div>
                  <div className={styles.emailCircle}></div>
                  <div className={styles.emailCircle}></div>
                </div>
                <div className={styles.emailBody}>
                  <div className={styles.emailSidebar}>
                    <div className={styles.sidebarItem}></div>
                    <div className={styles.sidebarItem}></div>
                    <div className={styles.sidebarItem}></div>
                  </div>
                  <div className={styles.emailContent}>
                    <div className={styles.emailLine}></div>
                    <div
                      className={styles.emailLine}
                      style={{ width: "80%" }}
                    ></div>
                    <div
                      className={styles.emailLine}
                      style={{ width: "90%" }}
                    ></div>
                    <div
                      className={styles.emailLine}
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className={clsx("col col--3", styles.feature)}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HomepageFeatures() {
  const features = [
    {
      icon: <EmailIcon />,
      title: "Multi-Account Management",
      description:
        "Connect and manage multiple Gmail accounts from a single interface. Switch seamlessly between personal and work emails.",
    },
    {
      icon: <AiIcon />,
      title: "AI Composition",
      description:
        "Let AI help you write better emails faster. Get intelligent suggestions, tone adjustments, and auto-completion.",
    },
    {
      icon: <SyncIcon />,
      title: "Real-time Synchronization",
      description:
        "Stay in sync with Gmail servers in real-time. All changes are instantly reflected across your devices.",
    },
    {
      icon: <SecurityIcon />,
      title: "Privacy-First",
      description:
        "As an open-source solution, Melify ensures complete transparency and control over your email data.",
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature, idx) => (
            <FeatureItem key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className={clsx(styles.workflowSection)}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">How It Works</Heading>
          <p>Get started with Melify in minutes</p>
        </div>
        <div className="row">
          <div className="col col--4 text--center">
            <div className={styles.workflowStep}>
              <div className={styles.workflowNumber}>1</div>
              <h3>Connect Gmail</h3>
              <p>
                Connect one or multiple Gmail accounts through secure OAuth
                authentication.
              </p>
            </div>
          </div>
          <div className="col col--4 text--center">
            <div className={styles.workflowStep}>
              <div className={styles.workflowNumber}>2</div>
              <h3>AI Learns Your Style</h3>
              <p>
                Our AI analyzes your writing patterns to provide personalized
                suggestions.
              </p>
            </div>
          </div>
          <div className="col col--4 text--center">
            <div className={styles.workflowStep}>
              <div className={styles.workflowNumber}>3</div>
              <h3>Work Smarter</h3>
              <p>
                Compose with AI assistance, get smart replies, and automate
                categorization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OpenSourceSection() {
  return (
    <section className={styles.openSourceSection}>
      <div className="container text--center">
        <Heading as="h2">Open Source & Community Driven</Heading>
        <p className="margin-bottom--lg">
          Melify is built in the open with a focus on transparency and community
          collaboration. Join our growing community of developers and
          contributors.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--outline button--secondary button--lg margin-right--md"
            href="https://github.com/yourusername/melify"
          >
            Star on GitHub
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/contributing"
          >
            Contribute
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Melify - Open source AI-powered email client for Gmail"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <WorkflowSection />
        <OpenSourceSection />
      </main>
    </Layout>
  );
}
