import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider } from './components/FleetContext';
import DriverHome from './components/DriverHome';
import CheckIn from './components/CheckIn';
import CheckOut from './components/CheckOut';
import ReportarAveria from './components/ReportarAveria';

export default function App() {
  return (
    <FleetProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#040506] text-[#9c9c9d] antialiased flex justify-center selection:bg-[#ff6363] selection:text-white">
          <main className="w-full max-w-md min-h-screen p-4 sm:p-5 pb-8 flex flex-col">
            <Routes>
              <Route path="/" element={<Navigate to="/conductor" replace />} />
              <Route path="/conductor" element={<DriverHome />} />
              <Route path="/conductor/checkin" element={<CheckIn />} />
              <Route path="/conductor/checkout" element={<CheckOut />} />
              <Route path="/conductor/averia" element={<ReportarAveria />} />
              <Route path="*" element={<Navigate to="/conductor" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </FleetProvider>
  );
}
