import "./App.css";
import { Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import PricingPage from "./pages/PricingPage";
import BaselineTablePage from "./pages/BaselineTablePage";

function App() {
  return (
    <>
      <Routes>
        
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/home" element={<Home/>}/>
        <Route path="/pricing" element={<PricingPage/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/baseline" element={<BaselineTablePage/>}/>

      </Routes>
    </>
  );
}

export default App;
