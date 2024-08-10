import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested product</p>
      <Link href="/products">Return to Products</Link>
    </div>
  );
}
