import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EvolutionCinematic } from './components/EvolutionCinematic';
import { MissionCompleteToast } from './components/MissionCompleteToast';
import { PurchaseCompleteToast } from './components/PurchaseCompleteToast';
import { AchievementUnlockToast } from './components/AchievementUnlockToast';
import { ImmersiveLoader } from './components/ui/ImmersiveLoader';

const Welcome = lazy(() => import('./pages/Welcome').then(m => ({ default: m.Welcome })));
const CharacterCreation = lazy(() => import('./pages/CharacterCreation').then(m => ({ default: m.CharacterCreation })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Quests = lazy(() => import('./pages/Quests').then(m => ({ default: m.Quests })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Nutrition = lazy(() => import('./pages/Nutrition').then(m => ({ default: m.Nutrition })));
const Boss = lazy(() => import('./pages/Boss').then(m => ({ default: m.Boss })));
const Exchange = lazy(() => import('./pages/Exchange').then(m => ({ default: m.Exchange })));
const Chronicle = lazy(() => import('./pages/Chronicle').then(m => ({ default: m.Chronicle })));
const Achievements = lazy(() => import('./pages/Achievements').then(m => ({ default: m.Achievements })));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EvolutionCinematic />
        <MissionCompleteToast />
        <PurchaseCompleteToast />
        <AchievementUnlockToast />
        <Suspense fallback={<ImmersiveLoader />}>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/create-character" element={<CharacterCreation />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/boss" element={<Boss />} />
              <Route path="/exchange" element={<Exchange />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/chronicle" element={<Chronicle />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
