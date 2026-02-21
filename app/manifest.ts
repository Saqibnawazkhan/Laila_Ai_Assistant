import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Laila AI Assistant",
    short_name: "Laila",
    description: "Your personal AI assistant with voice control, system commands, and task management",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#8b5cf6",
    orientation: "portrait-primary",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
