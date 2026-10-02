import React from 'react';

export default function Day4Foundation() {
  return (
    <article className="prose-container">
      <h1 className="prose-h1 flex flex-col gap-2">
        <span className="text-xl text-[#666] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">
          Day 04
        </span>
        <span>The Foundation</span>
      </h1>
      
      <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
        When starting a new project, my immediate temptation is usually to reach for the most complex, distributed architecture possible—microservices, message brokers, caching layers. But I know that is <strong className="text-violet-600 dark:text-violet-400">premature optimization</strong>.
      </p>

      <h2 className="prose-h2">The Monolithic Engine</h2>
      <p>
        For SOLITX, my goal was to build a system that is <em>capable</em> of scaling horizontally in the future, without taking on the operational overhead of microservices on Day 1. I needed a robust, predictable monolith that guarantees data integrity and handles authentication securely.
      </p>

      <h2 className="prose-h2">The Anti-ORM Decision</h2>
      <p>
        Instead of using heavy ORMs like Prisma or TypeORM, I opted for <strong className="text-emerald-600 dark:text-emerald-400">Raw SQL via PostgreSQL (Neon)</strong>. 
      </p>
      <p>
        ORMs often obscure the actual database queries, leading to severe performance bottlenecks like the <strong className="text-red-600 dark:text-red-400">N+1 Query Problem</strong>. 
      </p>
      
      <div className="my-4 p-5 bg-slate-100 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333] rounded-lg text-sm text-[#666] dark:text-[#a1a1aa] italic leading-relaxed">
        <strong className="text-black dark:text-white not-italic">What is the N+1 Problem?</strong> Imagine fetching 50 timeline posts. An ORM might make 1 query to get the 50 posts, and then silently make 50 separate queries behind the scenes to fetch the user profile for each post. This creates 51 database roundtrips instead of 1 highly optimized SQL <code>JOIN</code>, crippling API latency under heavy load.
      </div>
      
      <p>
        By writing raw SQL using standard connection pooling, I maintain zero-overhead latency and absolute control over my database execution plans.
      </p>

      <h2 className="prose-h2">Centralizing the Chaos</h2>
      <p>
        I also addressed a common Node.js anti-pattern: scattered <code>try/catch</code> blocks resulting in inconsistent API responses. I implemented a strict, three-pillar centralized architecture:
      </p>
      
      <ul className="prose-ul">
        <li><strong className="text-black dark:text-white">ApiResponse:</strong> A wrapper class to guarantee every successful response looks identical. The frontend never has to guess the shape of the payload.</li>
        <li><strong className="text-black dark:text-white">AppError:</strong> A custom operational error class that standardizes HTTP status codes and messages.</li>
        <li><strong className="text-black dark:text-white">Global Error Middleware:</strong> A centralized Express error handler that completely eliminates the need to write redundant <code>try/catch</code> blocks inside my route controllers.</li>
      </ul>
      
      <div className="my-8 p-6 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333]">
        <pre className="text-sm font-mono text-black dark:text-white overflow-x-auto">
{`class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

// Usage in Controller (No try/catch needed)
res.status(200).json(
  new ApiResponse(200, { user }, "Authentication successful")
);`}
        </pre>
      </div>

      <h2 className="prose-h2">Stateless JWT Authentication</h2>
      <p>
        How do I verify a user without hitting the database on every single request? I implemented <strong className="text-blue-600 dark:text-blue-400">Stateless JSON Web Tokens (JWT)</strong>.
      </p>
      <p>
        When a user logs in, their password is mathematically verified against the <code>bcrypt</code> hash. I then cryptographically sign a payload (their User ID) using a secret key, and hand the resulting JWT back to the client. On subsequent requests, my middleware mathematically verifies the signature.
      </p>

      <div className="my-8 border border-[#eaeaea] dark:border-[#333] rounded-xl p-8 bg-slate-50 dark:bg-[#1a1a1a] shadow-sm overflow-x-auto">
        <h4 className="text-xs font-bold uppercase tracking-widest text-center mb-8 text-[#666]">Stateless Authentication Flow</h4>
        
        <div className="min-w-[500px] flex items-center justify-between text-center font-mono text-sm">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white dark:bg-[#27272a] border-2 border-[#141413] dark:border-[#E5E4DE] rounded-xl flex items-center justify-center font-bold mb-3 shadow-[4px_4px_0px_0px_rgba(26,86,219,1)]">
              Client
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center px-2">
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">1. POST /login</div>
            <div className="w-full h-px bg-dashed border-t-2 border-dashed border-blue-600 dark:border-blue-400 relative">
              <div className="absolute right-0 -top-[5px] w-2 h-2 border-t-2 border-r-2 border-blue-600 dark:border-blue-400 transform rotate-45"></div>
            </div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-4">4. Return Signed JWT</div>
            <div className="w-full h-px bg-dashed border-t-2 border-dashed border-emerald-600 dark:border-emerald-400 relative mt-1">
               <div className="absolute left-0 -top-[5px] w-2 h-2 border-b-2 border-l-2 border-emerald-600 dark:border-emerald-400 transform rotate-45"></div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-[#141413] text-[#F9F8F6] border-2 border-[#141413] dark:border-[#F9F8F6] rounded-full flex items-center justify-center font-bold mb-3">
              API
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center px-2">
            <div className="text-[10px] font-bold text-[#666] mb-1">2. Verify bcrypt Hash</div>
            <div className="w-full h-px bg-dashed border-t-2 border-dashed border-[#666] relative">
              <div className="absolute right-0 -top-[5px] w-2 h-2 border-t-2 border-r-2 border-[#666] transform rotate-45"></div>
            </div>
            <div className="text-[10px] font-bold text-[#666] mt-4">3. Return User Data</div>
            <div className="w-full h-px bg-dashed border-t-2 border-dashed border-[#666] relative mt-1">
               <div className="absolute left-0 -top-[5px] w-2 h-2 border-b-2 border-l-2 border-[#666] transform rotate-45"></div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold mb-3">
              DB
            </div>
          </div>
        </div>
      </div>

      <p>
        <strong>The Result:</strong> Zero database lookups to verify identity, allowing my Node.js API instances to horizontally scale infinitely.
      </p>

      <h2 className="prose-h2">The Next Problem</h2>
      <p>
        By implementing <code>bcrypt</code>, I intentionally made password verification computationally expensive (CPU-bound) to protect against database leaks. However, this creates a critical vulnerability:
      </p>
      
      <div className="my-6 p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200">
        If a botnet targets my <code>/login</code> endpoint with 1,000 requests per second, the Node.js event loop will be entirely consumed by hash calculations, bringing down the entire API for legitimate users.
      </div>

      <p>
        <strong className="text-emerald-600 dark:text-emerald-400">Objective for Day 5:</strong> Implement an in-memory Rate Limiting mechanism to throttle abusive IP addresses before they reach the controller layer.
      </p>
    </article>
  );
}
