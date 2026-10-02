import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CoreIdea from './pages/CoreIdea';
import Requirements from './pages/Requirements';
import Day3Estimation from './pages/Day3Estimation';
import Day4Foundation from './pages/Day4Foundation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CoreIdea />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="day-3-estimation" element={<Day3Estimation />} />
          <Route path="day-4-foundation" element={<Day4Foundation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
