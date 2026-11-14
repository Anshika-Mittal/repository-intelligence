import type {
  RepositoryStatus as Status,
} from "../../types/repository.types";

interface Props {
  status: Status;
}

const statusConfig: Record<
  Status,
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "status-queued",
  },
  processing: {
    label: "Processing",
    className: "status-processing",
  },
  completed: {
    label: "Ready",
    className: "status-completed",
  },
  failed: {
    label: "Failed",
    className: "status-failed",
  },
};

export default function RepositoryStatus({ status }: Props) {
  const config = statusConfig[status];

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}