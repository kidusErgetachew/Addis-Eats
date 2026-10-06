const paths = {
  home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
  menu: "M4 6h16M4 12h16M4 18h16",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  cart: "M2 3h3l3 12h11l3-9H6M9 20h.01M18 20h.01",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  user: "M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  orders: "M6 3h12v18l-3-2-3 2-3-2-3 2V3ZM9 7h6M9 11h6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  back: "M20 12H4m6-6-6 6 6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  sun: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  moon: "M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z",
  leaf: "M20 3C9 2 2 7 5 15s17 4 15-12ZM4 21 16 9",
  bag: "M5 7h14l2 14H3L5 7ZM8 8V6a4 4 0 0 1 8 0v2",
  dish: "M3 17a9 9 0 0 1 18 0M2 21h20M1 17h22M12 4V2M10 2h4",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  chart: "M3 3v18h18M7 16l4-6 4 3 6-8",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  edit: "m15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z",
  logout: "M9 3H3v18h6M8 12h13m-5-5 5 5-5 5",
  shield: "M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6l-9-4Zm-4 10 3 3 5-6",
  filter: "M4 5h16M7 12h10M10 19h4",
};
export default function Icon({ name, size = 20, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={paths[name] || paths.dish} />
    </svg>
  );
}
