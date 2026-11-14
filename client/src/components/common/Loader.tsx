interface LoaderProps {
  message?: string;
}

export default function Loader({
  message = "Loading...",
}: LoaderProps) {
  return (
    <div className="loader-container">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}