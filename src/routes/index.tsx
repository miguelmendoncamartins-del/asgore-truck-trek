import { createFileRoute } from "@tanstack/react-router";
import Game from "@/game/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Bergentrück — Asgore Atropelando a Dess" },
      { name: "description", content: "Jogo meme: Asgore dirige o caminhão, pega Skol, atropela a Dess e foge da polícia." },
      { property: "og:title", content: "Bergentrück — Asgore Atropelando a Dess" },
      { property: "og:description", content: "Jogo meme 3D de caminhão baseado na música do PixelPietro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@500;700&display=swap" }],
  }),
  component: Game,
});
