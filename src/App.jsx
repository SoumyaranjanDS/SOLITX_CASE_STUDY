import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CoreIdea from './pages/CoreIdea';
import Requirements from './pages/Requirements';
import Day3Estimation from './pages/Day3Estimation';
import Day4Foundation from './pages/Day4Foundation';
import Day5RateLimiting from './pages/Day5RateLimiting';
import Day6Database from './pages/Day6Database';
import Day7Indexing from './pages/Day7Indexing';
import Day8LoadTesting from './pages/Day8LoadTesting';
import Day9ConnectionPooling from './pages/Day9ConnectionPooling';
import Day10Pagination from './pages/Day10Pagination';
import Day11APIProtection from './pages/Day11APIProtection';
import Day12RepeatedReads from './pages/Day12RepeatedReads';
import Day13Redis from './pages/Day13Redis';
import Day14CacheInvalidation from './pages/Day14CacheInvalidation';
import Day15CacheStampede from './pages/Day15CacheStampede';
import Day16DistributedRateLimiting from './pages/Day16DistributedRateLimiting';
import Day17OAuthUsernames from './pages/Day17OAuthUsernames';
import Day18FeedPostLifecycle from './pages/Day18FeedPostLifecycle';
import Day19ServerBottleneck from './pages/Day19ServerBottleneck';
import Day21ConnectionPooling from './pages/Day21ConnectionPooling';
import Day22StatelessnessAudit from './pages/Day22StatelessnessAudit';
import Day23ScalingExperiment from './pages/Day23ScalingExperiment';
import Day24SynchronousAudit from './pages/Day24SynchronousAudit';
import Day25BackgroundJobs from './pages/Day25BackgroundJobs';
import Day26NotificationsQueue from './pages/Day26NotificationsQueue';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CoreIdea />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="day-3-estimation" element={<Day3Estimation />} />
          <Route path="day-4-foundation" element={<Day4Foundation />} />
          <Route path="day-5-rate-limiting" element={<Day5RateLimiting />} />
          <Route path="day-6-database" element={<Day6Database />} />
          <Route path="day-7-indexing" element={<Day7Indexing />} />
          <Route path="day-8-load-testing" element={<Day8LoadTesting />} />
          <Route path="day-9-connection-pooling" element={<Day9ConnectionPooling />} />
          <Route path="day-10-pagination" element={<Day10Pagination />} />
          <Route path="day-11-api-protection" element={<Day11APIProtection />} />
          <Route path="day-12-repeated-reads" element={<Day12RepeatedReads />} />
          <Route path="day-13-redis" element={<Day13Redis />} />
          <Route path="day-14-cache-invalidation" element={<Day14CacheInvalidation />} />
          <Route path="day-15-cache-stampede" element={<Day15CacheStampede />} />
          <Route path="day-16-distributed-rate-limiting" element={<Day16DistributedRateLimiting />} />
          <Route path="day-17-oauth-usernames" element={<Day17OAuthUsernames />} />
          <Route path="day-18-feed-post-lifecycle" element={<Day18FeedPostLifecycle />} />
          <Route path="day-19-server-bottleneck" element={<Day19ServerBottleneck />} />
          <Route path="day-21-connection-pooling" element={<Day21ConnectionPooling />} />
          <Route path="day-22-statelessness-audit" element={<Day22StatelessnessAudit />} />
          <Route path="day-23-scaling-experiment" element={<Day23ScalingExperiment />} />
          <Route path="day-24-synchronous-audit" element={<Day24SynchronousAudit />} />
          <Route path="day-25-background-jobs" element={<Day25BackgroundJobs />} />
          <Route path="day-26-notifications-queue" element={<Day26NotificationsQueue />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
