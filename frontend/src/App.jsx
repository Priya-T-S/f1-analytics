import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Constructors from './pages/Constructors';
import ConstructorDetail from './pages/ConstructorDetail';
import Circuits from './pages/Circuits';
import CircuitDetail from './pages/CircuitDetail';
import Races from './pages/Races';
import RaceDetail from './pages/RaceDetail';
import Standings from './pages/Standings';
import Compare from './pages/Compare';
import Records from './pages/Records';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/drivers/:id" element={<DriverDetail />} />
        <Route path="/constructors" element={<Constructors />} />
        <Route path="/constructors/:id" element={<ConstructorDetail />} />
        <Route path="/circuits" element={<Circuits />} />
        <Route path="/circuits/:id" element={<CircuitDetail />} />
        <Route path="/races" element={<Races />} />
        <Route path="/races/:year" element={<Races />} />
        <Route path="/race/:id" element={<RaceDetail />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/records" element={<Records />} />
      </Routes>
    </Layout>
  );
}
