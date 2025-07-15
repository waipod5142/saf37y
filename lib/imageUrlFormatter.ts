export default function imageUrlFormatter(imagePath: string) {
  return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(
    imagePath
  )}?alt=media`;
}
