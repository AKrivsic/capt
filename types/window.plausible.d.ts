export {};

type TrackProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface PlausibleFn {
    (name: string, options?: { props?: TrackProps; revenue?: number; callback?: () => void }): void;
    q?: IArguments[];
  }
  interface Window {
    plausible?: PlausibleFn;
  }
}
