import Image, { type ImageProps } from "next/image";

/** next/image that skips the optimizer for formats it should not re-encode (SVG, GIF). */
export function SmartImage({ alt, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image alt={alt} unoptimized={/\.(svg|gif)(\?.*)?$/i.test(src) || props.unoptimized} {...props} />;
}
