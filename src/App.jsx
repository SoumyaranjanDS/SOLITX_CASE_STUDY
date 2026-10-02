import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CoreIdea from './pages/CoreIdea';
import Requirements from './pages/Requirements';
import Day3Foundation from './pages/Day3Foundation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CoreIdea />} />
          <Route path="requirements" element={<Requirements />} />
          <Route path="day-3-foundation" element={<Day3Foundation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
