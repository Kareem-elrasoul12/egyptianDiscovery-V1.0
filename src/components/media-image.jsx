"use client";

import { imageUrl } from "../data/content";
import { useSite } from "./site-context";

export function MediaImage({ source, width = 1000, alt = "", ...props }) {
  const { demo } = useSite();
  return <img src={imageUrl(source, width, demo.media)} alt={alt} {...props} />;
}
