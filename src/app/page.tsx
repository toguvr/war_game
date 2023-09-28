import dynamic from "next/dynamic";

const Game = dynamic(() => import("./game").then((m) => m.default), {
  ssr: false,
  loading: () => <p>Loading game...</p>,
});

export default function Page() {
  return <Game />;
}
