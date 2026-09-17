import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ApiKeys from "./pages/ApiKeys";
import VillageMaster from "./pages/admin/VillageMaster";
import StateAccess from "./pages/StateAccess";
import Usage from "./pages/Usage";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ApiLogs from "./pages/admin/ApiLogs";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminStateAccess from "./pages/admin/AdminStateAccess";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* B2B */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/api-keys"
          element={
            <ProtectedRoute>
              <ApiKeys />
            </ProtectedRoute>
          }
        />

        <Route
          path="/state-access"
          element={
            <ProtectedRoute>
              <StateAccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usage"
          element={
            <ProtectedRoute>
              <Usage />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/api-keys"
          element={
            <ProtectedRoute adminOnly>
              <AdminApiKeys />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/state-access"
          element={
            <ProtectedRoute adminOnly>
              <AdminStateAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/village-master"
          element={
            <ProtectedRoute adminOnly>
              <VillageMaster />
            </ProtectedRoute>
          }
       />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute adminOnly>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/api-logs"
          element={
           <ProtectedRoute adminOnly>
             <ApiLogs />
            </ProtectedRoute>
          }
        />
        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;