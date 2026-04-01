type CopyrightProps = {
  className?: string;
};

export function Copyright({ className = "text-xs text-muted-foreground" }: CopyrightProps) {
  return (
    <p className={className}>
      Copyright © {new Date().getFullYear()} Baba.ge. All rights reserved.
    </p>
  );
}
