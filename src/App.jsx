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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
