import { Route, Routes } from 'react-router-dom';
import Home from './components/Home.jsx';
import BoardPage from './components/BoardPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/board/:boardId" element={<BoardPage />} />
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-graphite-950 text-paper">
            <p>Page not found.</p>
          </div>
        }
      />
    </Routes>
  );
}
