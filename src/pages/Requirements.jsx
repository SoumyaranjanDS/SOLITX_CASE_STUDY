import { ExternalLink } from 'lucide-react';

export default function Requirements() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Day 02
        </span>
        <span>Defining the System</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        Before I write a single line of code, I need to define exactly what the system actually needs to do. Without boundaries, feature creep wins.
      </p>

      <h2 className="prose-h2">What exactly are System Requirements?</h2>
      <p>
        In System Design, requirements act as the absolute constraints for your architecture. They are split into two categories: <strong>Functional</strong> (what the system must actually do, like "users can post a tweet") and <strong>Non-Functional</strong> (how the system behaves, like "it must handle 10,000 requests per second with 99.9% uptime").
      </p>
      <p>
        <a 
          href="https://www.geeksforgeeks.org/system-design/types-of-requirements-in-system-design/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Read more about Requirements
          <ExternalLink size={14} />
        </a>
      </p>

      <h2 className="prose-h2">Product Vision</h2>
      <p>
        The product is SOLITX, a Twitter/X-style social platform. It will serve as a system design laboratory where I will deliberately push the system to its breaking points and evolve the architecture to solve concrete scaling problems. 
      </p>

      <h2 className="prose-h2">Functional Requirements (Scope)</h2>
      <p>
        To keep things strictly focused on backend engineering and system design rather than frontend bloat, I am limiting the core functional requirements to:
      </p>
      <ul className="prose-ul">
        <li><strong className="text-black dark:text-white">Authentication:</strong> Register, Login, Logout, and basic session management.</li>
        <li><strong className="text-black dark:text-white">Users:</strong> Profile viewing, updating, following, and unfollowing.</li>
        <li><strong className="text-black dark:text-white">Posts:</strong> Creating, deleting, viewing, liking, and commenting on posts.</li>
        <li><strong className="text-black dark:text-white">Feeds:</strong> Generating chronological home feeds (from followed users) and user timelines.</li>
      </ul>

      <h2 className="prose-h2">Non-Functional Requirements (NFRs)</h2>
      <p>
        The system must be designed with the following constraints in mind, targeting a scale of approximately <strong className="text-emerald-600 dark:text-emerald-400">20,000 Daily Active Users (DAU)</strong>:
      </p>
      <ul className="prose-ul">
        <li><strong className="text-black dark:text-white">Scalability:</strong> Must handle the projected DAU load without degrading response times.</li>
        <li><strong className="text-black dark:text-white">Availability:</strong> High availability for reads (feed viewing), prioritizing uptime over immediate consistency where appropriate.</li>
        <li><strong className="text-black dark:text-white">Reliability:</strong> Data loss is unacceptable for posts and follows.</li>
        <li><strong className="text-black dark:text-white">Performance:</strong> Low latency feed generation and post retrieval.</li>
      </ul>

      <h2 className="prose-h2">Initial Architecture (V0)</h2>
      <p>
        I am adopting a strict <strong className="text-violet-600 dark:text-violet-400">"start simple"</strong> philosophy. 
      </p>
      
      <div className="my-8 p-6 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333] flex justify-center items-center">
        <code className="text-sm font-mono text-black dark:text-white">
          Client → Node.js/Express (Monolith) → PostgreSQL
        </code>
      </div>

      <figure className="my-8 border border-[#eaeaea] dark:border-[#333] rounded-xl p-2 bg-slate-50 dark:bg-[#1a1a1a] shadow-sm">
        <img 
          src="/Requirements-x.png" 
          alt="Requirements Overview" 
          className="w-full h-auto rounded-lg border border-[#eaeaea] dark:border-[#333]"
        />
        <figcaption className="text-center text-[13px] text-[#666] dark:text-[#888] mt-4 pb-2 font-medium">
          Visual overview of my initial system requirements and target scale.
        </figcaption>
      </figure>

      <p>
        <strong>I must explicitly document:</strong> This is NOT the final architecture. It is simply the architecture we are starting with. In my experience, a monolith is significantly easier to deploy, test, and debug. 
      </p>

      <h2 className="prose-h2">Technology Choices</h2>
      <p>
        The initial stack is intentionally boring and rock-solid:
      </p>
      <ul className="prose-ul">
        <li><strong>Frontend:</strong> React</li>
        <li><strong>Backend:</strong> Node.js + Express</li>
        <li><strong>Database:</strong> PostgreSQL</li>
        <li><strong>Version Control:</strong> Git & GitHub</li>
      </ul>

      <h2 className="prose-h2">What is Deliberately Postponed?</h2>
      <p>
        Premature optimization is the enemy. I am explicitly forbidding the use of the following technologies on Day 1, until a measurable bottleneck proves we need them:
      </p>
      <ul className="prose-ul text-red-600 dark:text-red-400 font-medium">
        <li>No Docker (yet)</li>
        <li>No Redis (yet)</li>
        <li>No Kafka (yet)</li>
        <li>No AWS Cloud Architecture (yet)</li>
        <li>No Microservices (yet)</li>
      </ul>
      <p>
        I will keep my feature domains (Auth, Users, Posts, Feed) strictly separated inside the monolithic codebase. This way, when the traffic actually demands it, I can seamlessly split them out into independent services.
      </p>
    </article>
  );
}
