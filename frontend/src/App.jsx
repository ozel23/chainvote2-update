import { Routes, Route, Navigate } from "react-router-dom";
import { useWeb3 } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import VotingPage from "./pages/VotingPage";
import AdminPage from "./pages/AdminPage";
import LoadingScreen from "./components/LoadingScreen";

export default function App() {
    const { account, isLoading } = useWeb3();

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="app-root">
            {account && <Navbar />}
            <Routes>
                <Route
                    path="/"
                    element={account ? <Navigate to="/vote" replace /> : <LoginPage />}
                />
                <Route
                    path="/vote"
                    element={account ? <VotingPage /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/admin"
                    element={account ? <AdminPage /> : <Navigate to="/" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
