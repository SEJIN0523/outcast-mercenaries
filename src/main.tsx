import ReactDOM from "react-dom/client";
import { loadBattleArt } from "./render/battleArt";
import { loadGeneratedArt } from "./render/generatedArt";
import { App } from "./ui/App";
import {AssetGallery} from "./ui/AssetGallery";
import "./ui/styles.css";
const root = document.getElementById("root")!;
root.textContent = "용병단 에셋을 준비하고 있습니다…";
void Promise.all([loadGeneratedArt(),loadBattleArt()]).finally(() =>
  ReactDOM.createRoot(root).render(new URLSearchParams(location.search).has('gallery')?<AssetGallery/>:<App />),
);
