import ReactDOM from "react-dom/client";
import { loadGeneratedArt } from "./render/generatedArt";
import { App } from "./ui/App";
import "./ui/styles.css";
const root = document.getElementById("root")!;
root.textContent = "용병단 에셋을 준비하고 있습니다…";
void loadGeneratedArt().finally(() =>
  ReactDOM.createRoot(root).render(<App />),
);
