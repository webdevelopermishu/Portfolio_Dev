/** Re-mounted on every navigation, giving each page a soft fade-in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="enter-fade">{children}</div>;
}
