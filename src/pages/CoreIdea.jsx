export default function CoreIdea() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Day 01
        </span>
        <span>The Idea & Philosophy</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        Studying isolated system design concepts doesn't tell me when they are actually needed. This project changes that.
      </p>

      <hr />

      <h2 className="prose-h2">Why I started this</h2>
      <p>
        I've been learning system design for a while, reading about <strong className="text-emerald-600 dark:text-emerald-400">load balancers, Redis, Kafka, replication, sharding, and microservices</strong>. I understand what they do conceptually. But a much more important question kept bothering me: <em>When do I actually need them?</em>
      </p>
      <p>
        I don't want to learn system design as a collection of static diagrams to memorize for an interview. I want to understand what happens when a system grows, where it struggles, what breaks first, and what engineering decision actually solves that exact problem.
      </p>

      <h2 className="prose-h2">Why a social platform?</h2>
      <p>
        SOLITX is a Twitter/X-style social platform. However, the social platform itself isn't the main point. The system behind it is. A social network is the perfect vehicle because it naturally forces you to deal with heavy read/write imbalances, complex relational data (social graphs), real-time feeds, and eventual consistency. It is my perfect system design laboratory.
      </p>

      <h2 className="prose-h2">Why one system instead of many projects?</h2>
      <p>
        Instead of building ten small portfolio projects to demonstrate ten different concepts (a chat app for WebSockets, an e-commerce site for payments), I'm taking a different approach. I am going to build one single system and keep evolving it. Architecture should grow because the system grows, not because a tutorial told me to add it.
      </p>

      <h2 className="prose-h2">What I want to learn</h2>
      <p>
        By the end of this project, I want to be able to look at a system and reason about it mathematically and structurally. I want to deeply understand:
      </p>
      <ul className="prose-ul">
        <li><strong>Architecture:</strong> How should the system be structured?</li>
        <li><strong>Performance:</strong> Where exactly is the bottleneck?</li>
        <li><strong>Distributed Systems:</strong> What breaks when the system runs on multiple servers?</li>
        <li><strong>Consistency:</strong> When is eventual consistency acceptable, and when is it dangerous?</li>
        <li><strong>Trade-offs:</strong> What complexity am I introducing by making this architectural decision?</li>
      </ul>

      <h2 className="prose-h2">The Most Important Rule</h2>
      <blockquote className="prose-blockquote border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-r-lg">
        <strong className="text-xl text-blue-600 dark:text-blue-400">No technology without a problem.</strong>
      </blockquote>
      <p>
        If I add Redis, I must be able to explain what exact problem Redis solved for me. If I add Kafka, I must explain why synchronous communication failed under load. I will not add a technology just because it looks impressive on a system design diagram. 
      </p>

      <h2 className="prose-h2">The Rules of the Project</h2>
      <p>For every major concept, I will follow this strict engineering loop:</p>
      <ul className="prose-ul">
        <li><strong className="text-violet-600 dark:text-violet-400">Learn:</strong> Understand the problem it was designed to solve.</li>
        <li><strong className="text-blue-600 dark:text-blue-400">Build:</strong> Implement it inside SOLITX.</li>
        <li><strong className="text-red-500 dark:text-red-400">Break:</strong> Test what happens under pressure or failure.</li>
        <li><strong className="text-orange-500 dark:text-orange-400">Measure:</strong> Look at latency, throughput, and resource usage.</li>
        <li><strong className="text-emerald-600 dark:text-emerald-400">Document:</strong> Record the trade-offs, architecture changes, and lessons learned.</li>
        <li><strong className="text-cyan-600 dark:text-cyan-400">Evolve:</strong> Move to the next problem.</li>
      </ul>

      <h2 className="prose-h2">What Success Means</h2>
      <p>
        The final target isn't to claim that SOLITX is truly Twitter-scale. The target is to build and experiment with a system around a <strong className="text-blue-600 dark:text-blue-400">~20K daily active user design target</strong>.
      </p>
      <p>
        Success means finishing this project with a much stronger understanding of how real systems are designed, scaled, operated, and evolved. When I encounter a new system design problem in the future, I won't just remember a diagram—<strong className="text-black dark:text-white">I'll remember the problem that made me need the diagram in the first place.</strong>
      </p>
    </article>
  );
}
