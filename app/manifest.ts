import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Laila AI Assistant",
    short_name: "Laila",
    description: "Your personal AI assistant with voice control, system commands, and task management",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#7c3aed",
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
