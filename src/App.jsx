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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
