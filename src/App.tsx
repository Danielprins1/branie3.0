import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import EasterEggs from "./components/EasterEggs";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import ScrollManager from "./components/ScrollManager";
import { IntroProvider, useIntro } from "./intro/IntroContext";
import Home from "./pages/Home";
import ArticlePage from "./pages/Article";
import Articles from "./pages/Articles";
import Rubrics from "./pages/Rubrics";
import RubricPage from "./pages/Rubric";
import About from "./pages/About";
import Colofon from "./pages/Colofon";
import NotFound from "./pages/NotFound";

const Intro = lazy(() => import("./intro/Intro"));

function Layout() {
  const { mode, finish } = useIntro();
  const held = mode === "full";
  const covered = mode === "full" || mode === "reduced";
  return (
    <>
      {mode !== "none" && (
        <Suspense fallback={<div className="intro-fallback" />}>
          <Intro mode={mode} onDone={finish} />
        </Suspense>
      )}
      <div className={`site${held ? " site--held" : ""}`} inert={covered}>
        <a className="skip-link" href="#inhoud">
          Naar de inhoud
        </a>
        <Nav />
        <main id="inhoud" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artikelen" element={<Articles />} />
            <Route path="/artikelen/:slug" element={<ArticlePage />} />
            <Route path="/rubrieken" element={<Rubrics />} />
            <Route path="/rubrieken/:slug" element={<RubricPage />} />
            <Route path="/over" element={<About />} />
            <Route path="/colofon" element={<Colofon />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ScrollManager />
      <EasterEggs />
    </>
  );
}

export default function App() {
  return (
    <IntroProvider>
      <Layout />
    </IntroProvider>
  );
}
