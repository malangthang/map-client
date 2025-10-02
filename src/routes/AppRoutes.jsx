import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ProvinceDetail from "../pages/ProvinceDetail";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/province/:slug" element={<ProvinceDetail />} />
      </Routes>
    </Router>
  );
}
